// Import Preview Types

export interface PreviewItem {
  id: string;
  name: string;
  path: string[];
  type: string;
  value: string;
  status: 'new' | 'overwrite' | 'conflict' | 'invalid' | 'unchanged';
  existingValue?: string;
  selected: boolean;
  collection: string;
  mode?: string;
  description?: string;
  errorMessage?: string;
}

export interface PreviewResult {
  success: boolean;
  items: PreviewItem[];
  stats: {
    total: number;
    new: number;
    overwrite: number;
    conflict: number;
    invalid: number;
    unchanged: number;
  };
  errors?: string[];
}

export interface PreviewOptions {
  includeUnchanged?: boolean;
  checkConflicts?: boolean;
  validateTypes?: boolean;
}
