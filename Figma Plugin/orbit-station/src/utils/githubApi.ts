// GitHub API Utilities
// Funzioni per interagire con l'API GitHub

export interface GitHubConfig {
  token: string;
  repository: string; // formato: "owner/repo"
  branch?: string;
  directory?: string;
  overwrite?: boolean;
}

export interface GitHubUploadResult {
  success: boolean;
  message: string;
  url?: string;
  sha?: string;
  error?: string;
}

export interface GitHubFileInfo {
  filename: string;
  content: string;
  path?: string;
}

/**
 * Carica un singolo file su GitHub
 */
export async function uploadToGitHub(
  config: GitHubConfig,
  content: string,
  filename: string
): Promise<GitHubUploadResult> {
  try {
    const { token, repository, branch = 'main', directory = 'tokens' } = config;

    if (!token || !repository) {
      throw new Error('GitHub token and repository are required');
    }

    const [owner, repo] = repository.split('/');
    if (!owner || !repo) {
      throw new Error('Repository must be in format "owner/repo"');
    }

    const path = directory ? `${directory}/${filename}` : filename;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    console.log(`[GitHubAPI] Uploading ${filename} to ${repository}:${branch}/${path}`);

    // Check if file exists (per ottenere SHA se necessario)
    let existingSha: string | undefined;
    if (config.overwrite) {
      try {
        const checkResponse = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Figma-Plugin-Variables-Import-Export'
          }
        });

        if (checkResponse.ok) {
          const existingFile = await checkResponse.json();
          existingSha = existingFile.sha;
          console.log(`[GitHubAPI] File exists, will overwrite with SHA: ${existingSha}`);
        }
      } catch (error) {
        console.log(`[GitHubAPI] File doesn't exist or error checking: ${error.message}`);
      }
    }

    // Prepare upload payload
    const payload: any = {
      message: `Update ${filename} from Figma Plugin`,
      content: btoa(unescape(encodeURIComponent(content))), // Base64 encode UTF-8
      branch: branch
    };

    if (existingSha) {
      payload.sha = existingSha;
    }

    // Upload file
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Figma-Plugin-Variables-Import-Export'
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('[GitHubAPI] Upload failed:', responseData);
      throw new Error(responseData.message || `GitHub API error: ${response.status}`);
    }

    console.log(`[GitHubAPI] Successfully uploaded ${filename}`);

    return {
      success: true,
      message: `Successfully uploaded ${filename} to GitHub`,
      url: responseData.content?.html_url,
      sha: responseData.content?.sha
    };

  } catch (error) {
    console.error('[GitHubAPI] Upload error:', error);
    return {
      success: false,
      message: `Failed to upload ${filename}`,
      error: error.message
    };
  }
}

/**
 * Carica multipli file su GitHub
 */
export async function uploadMultipleFilesToGitHub(
  config: GitHubConfig,
  files: GitHubFileInfo[]
): Promise<{
  success: boolean;
  message: string;
  results: GitHubUploadResult[];
  successCount: number;
  failureCount: number;
}> {
  const results: GitHubUploadResult[] = [];
  let successCount = 0;
  let failureCount = 0;

  console.log(`[GitHubAPI] Starting upload of ${files.length} files`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filename = file.path || file.filename;

    console.log(`[GitHubAPI] Uploading file ${i + 1}/${files.length}: ${filename}`);

    try {
      const result = await uploadToGitHub(config, file.content, filename);
      results.push(result);

      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }

      // Rate limiting: pausa tra upload
      if (i < files.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

    } catch (error) {
      const errorResult: GitHubUploadResult = {
        success: false,
        message: `Failed to upload ${filename}`,
        error: error.message
      };
      results.push(errorResult);
      failureCount++;
    }
  }

  const overallSuccess = successCount > 0;
  let message = '';

  if (failureCount === 0) {
    message = `Successfully uploaded all ${successCount} files to GitHub`;
  } else if (successCount === 0) {
    message = `Failed to upload all ${failureCount} files`;
  } else {
    message = `Upload completed: ${successCount} successful, ${failureCount} failed out of ${files.length} total`;
  }

  console.log(`[GitHubAPI] Upload summary: ${message}`);

  return {
    success: overallSuccess,
    message,
    results,
    successCount,
    failureCount
  };
}

/**
 * Verifica la configurazione GitHub
 */
export function validateGitHubConfig(config: Partial<GitHubConfig>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.token) {
    errors.push('GitHub token is required');
  }

  if (!config.repository) {
    errors.push('Repository is required');
  } else {
    const [owner, repo] = config.repository.split('/');
    if (!owner || !repo) {
      errors.push('Repository must be in format "owner/repo"');
    }
  }

  if (config.branch && !/^[a-zA-Z0-9._/-]+$/.test(config.branch)) {
    errors.push('Branch name contains invalid characters');
  }

  if (config.directory && !/^[a-zA-Z0-9._/-]+$/.test(config.directory)) {
    errors.push('Directory name contains invalid characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Genera il nome file per l'upload
 */
export function generateFileName(
  baseName: string,
  format: string,
  includeTimestamp: boolean = false
): string {
  let filename = baseName;

  // Assicura l'estensione corretta
  if (!filename.includes('.')) {
    filename += `.${format}`;
  }

  // Aggiungi timestamp se richiesto
  if (includeTimestamp) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const parts = filename.split('.');
    const extension = parts.pop();
    const nameWithoutExt = parts.join('.');
    filename = `${nameWithoutExt}-${timestamp}.${extension}`;
  }

  return filename;
}

/**
 * Estrae informazioni dal repository URL
 */
export function parseRepositoryUrl(url: string): {
  owner: string;
  repo: string;
  branch?: string;
} | null {
  try {
    // Handles: https://github.com/owner/repo
    // Handles: https://github.com/owner/repo/tree/branch
    // Handles: owner/repo

    if (url.includes('github.com')) {
      const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+))?/);
      if (match) {
        return {
          owner: match[1],
          repo: match[2].replace('.git', ''),
          branch: match[3]
        };
      }
    } else {
      // Simple "owner/repo" format
      const parts = url.split('/');
      if (parts.length === 2) {
        return {
          owner: parts[0],
          repo: parts[1]
        };
      }
    }

    return null;
  } catch (error) {
    console.error('[GitHubAPI] Error parsing repository URL:', error);
    return null;
  }
}

/**
 * Testa la connessione GitHub
 */
export async function testGitHubConnection(config: GitHubConfig): Promise<{
  success: boolean;
  message: string;
  repoInfo?: any;
}> {
  try {
    const { token, repository } = config;
    const [owner, repo] = repository.split('/');

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Figma-Plugin-Variables-Import-Export'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API responded with ${response.status}: ${response.statusText}`);
    }

    const repoInfo = await response.json();

    return {
      success: true,
      message: `Successfully connected to ${repository}`,
      repoInfo: {
        name: repoInfo.name,
        fullName: repoInfo.full_name,
        private: repoInfo.private,
        defaultBranch: repoInfo.default_branch,
        permissions: repoInfo.permissions
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `Failed to connect to GitHub: ${error.message}`
    };
  }
}