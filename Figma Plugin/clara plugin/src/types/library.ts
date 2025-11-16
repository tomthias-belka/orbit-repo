// Type definitions for Figma Library support
// Handles external library variables and cross-library references

/**
 * Metadata about a library variable collection
 */
export interface LibraryCollectionMetadata {
  name: string;
  key: string;
  libraryName: string;
  variableCount?: number;
}

/**
 * Metadata about a variable from an external library
 */
export interface LibraryVariableMetadata {
  id: string;
  key: string;
  name: string;
  resolvedType: VariableResolvedDataType;
  variableCollectionId: string;
  collectionName: string;
  libraryName: string;
  isRemote: true;
}

/**
 * Options for importing variables from external libraries
 */
export interface LibraryImportOptions {
  /** Key of the variable to import */
  variableKey: string;
  /** Whether to link the variable (keeps sync with library) or copy it */
  linkVariable?: boolean;
  /** Collection to import into (if different from source) */
  targetCollectionId?: string;
}

/**
 * Result of a library import operation
 */
export interface LibraryImportResult {
  success: boolean;
  message: string;
  importedVariable?: Variable;
  variableKey?: string;
  error?: {
    code: 'PERMISSION_DENIED' | 'NOT_FOUND' | 'LIBRARY_DISABLED' | 'INVALID_KEY' | 'UNKNOWN';
    details: string;
  };
}

/**
 * Result of discovering available libraries
 */
export interface LibraryDiscoveryResult {
  success: boolean;
  libraries: LibraryCollectionMetadata[];
  message?: string;
  error?: string;
}

/**
 * Reference to a remote variable in JSON export
 */
export interface RemoteVariableReference {
  $type: string;
  $value: string; // Alias format: {collection.group.token}
  $extensions?: {
    'clara.library': {
      libraryName: string;
      collectionName: string;
      variableKey: string;
      isRemote: true;
    };
  };
}

/**
 * Cache entry for resolved remote variables
 */
export interface RemoteVariableCache {
  variableId: string;
  variable: Variable;
  timestamp: number;
  libraryName?: string;
  collectionName?: string;
}

/**
 * Options for resolving aliases with library support
 */
export interface AliasResolutionOptions {
  /** Whether to resolve aliases from external libraries */
  resolveRemoteAliases?: boolean;
  /** Maximum depth for alias chain resolution */
  maxDepth?: number;
  /** Cache for remote variable lookups */
  remoteCache?: Map<string, RemoteVariableCache>;
  /** Callback for when a remote variable is accessed */
  onRemoteAccess?: (libraryName: string, variableName: string) => void;
}

/**
 * Error types specific to library operations
 */
export enum LibraryErrorType {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  LIBRARY_NOT_ENABLED = 'LIBRARY_NOT_ENABLED',
  VARIABLE_NOT_FOUND = 'VARIABLE_NOT_FOUND',
  COLLECTION_NOT_FOUND = 'COLLECTION_NOT_FOUND',
  INVALID_KEY = 'INVALID_KEY',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Library-specific error with context
 */
export class LibraryError extends Error {
  constructor(
    public type: LibraryErrorType,
    message: string,
    public context?: {
      libraryName?: string;
      collectionKey?: string;
      variableKey?: string;
      originalError?: Error;
    }
  ) {
    super(message);
    this.name = 'LibraryError';
  }
}
