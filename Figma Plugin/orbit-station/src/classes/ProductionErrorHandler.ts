// Production-ready error handling types

interface ErrorCategory {
  severity: 'critical' | 'high' | 'medium' | 'low';
  retry: boolean;
  maxRetries?: number;
}

interface ErrorInfo {
  id: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  stack?: string;
  context: Record<string, any>;
  timestamp: number;
  attempt: number;
}

interface RecoveryResult {
  canRecover: boolean;
  strategy: 'retry' | 'skip' | 'abort';
}

interface ErrorHandleResult {
  shouldRetry: boolean;
  shouldSkip: boolean;
  errorId: string;
  severity?: string;
}

type RecoveryStrategy = (error: Error, context: Record<string, any>, attempt: number) => Promise<RecoveryResult>;

interface ErrorSummary {
  total: number;
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
  recentErrors: ErrorInfo[];
}

/**
 * Production-ready error handling system with recovery strategies and logging
 */
export class ProductionErrorHandler {
  private errorCategories: Record<string, ErrorCategory>;
  private errorLog: ErrorInfo[] = [];
  private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();

  constructor() {
    this.errorCategories = {
      validation: { severity: 'critical', retry: false },
      format: { severity: 'high', retry: false },
      network: { severity: 'medium', retry: true, maxRetries: 3 },
      figma_api: { severity: 'high', retry: true, maxRetries: 2 },
      processing: { severity: 'medium', retry: false },
      user_input: { severity: 'low', retry: false }
    };

    this.errorLog = [];
    this.recoveryStrategies = new Map();
    this.setupRecoveryStrategies();
  }

  /**
   * Setup recovery strategies for different error categories
   */
  private setupRecoveryStrategies(): void {
    // Network errors - retry with exponential backoff
    this.recoveryStrategies.set('network', async (_error: Error, _context: Record<string, any>, attempt: number): Promise<RecoveryResult> => {
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      await new Promise<void>(resolve => setTimeout(resolve, delay));
      return { canRecover: attempt < 3, strategy: 'retry' };
    });

    // Figma API errors - retry with rate limiting
    this.recoveryStrategies.set('figma_api', async (error: Error, _context: Record<string, any>, attempt: number): Promise<RecoveryResult> => {
      if (error.message.includes('rate limit')) {
        await new Promise<void>(resolve => setTimeout(resolve, 5000));
        return { canRecover: attempt < 2, strategy: 'retry' };
      }
      return { canRecover: false, strategy: 'abort' };
    });

    // Processing errors - skip problematic tokens
    this.recoveryStrategies.set('processing', async (_error: Error, context: Record<string, any>): Promise<RecoveryResult> => {
      console.warn(`[ProductionErrorHandler] Skipping problematic token: ${context.tokenPath || 'unknown'}`);
      return { canRecover: true, strategy: 'skip' };
    });
  }

  /**
   * Handle an error with recovery strategies
   * @param error - The error to handle
   * @param category - Error category for classification
   * @param context - Additional context information
   * @param attempt - Current attempt number
   * @returns Promise with handling result
   */
  async handleError(
    error: Error,
    category: string,
    context: Record<string, any> = {},
    attempt: number = 0
  ): Promise<ErrorHandleResult> {
    const errorId = this.generateErrorId();
    const errorInfo: ErrorInfo = {
      id: errorId,
      category: category,
      severity: this.errorCategories[category]?.severity || 'medium',
      message: error.message,
      stack: error.stack,
      context: { ...context },
      timestamp: Date.now(),
      attempt: attempt
    };

    this.errorLog.push(errorInfo);

    console.error(`[ProductionErrorHandler] Error ${errorId} [${category}]:`, error.message);

    // Attempt recovery if strategy exists
    const strategy = this.recoveryStrategies.get(category);
    if (strategy && this.shouldRetry(category, attempt)) {
      try {
        const recovery = await strategy(error, context, attempt);
        if (recovery.canRecover) {
          return {
            shouldRetry: recovery.strategy === 'retry',
            shouldSkip: recovery.strategy === 'skip',
            errorId: errorId
          };
        }
      } catch (recoveryError) {
        console.error(`[ProductionErrorHandler] Recovery failed:`, recoveryError);
      }
    }

    // Determine if error is fatal
    if (this.isFatalError(errorInfo)) {
      throw new Error(`Fatal error ${errorId}: ${error.message}`);
    }

    return {
      shouldRetry: false,
      shouldSkip: true,
      errorId: errorId,
      severity: errorInfo.severity
    };
  }

  /**
   * Check if retry should be attempted
   * @param category - Error category
   * @param attempt - Current attempt number
   * @returns True if retry should be attempted
   */
  private shouldRetry(category: string, attempt: number): boolean {
    const config = this.errorCategories[category];
    return config && config.retry && attempt < (config.maxRetries || 1);
  }

  /**
   * Check if error is fatal
   * @param errorInfo - Error information
   * @returns True if error is fatal
   */
  private isFatalError(errorInfo: ErrorInfo): boolean {
    return errorInfo.severity === 'critical' ||
           (errorInfo.severity === 'high' && errorInfo.attempt >= 2);
  }

  /**
   * Generate unique error ID
   * @returns Unique error identifier
   */
  private generateErrorId(): string {
    return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error summary statistics
   * @returns Error summary with counts and recent errors
   */
  getErrorSummary(): ErrorSummary {
    const summary: ErrorSummary = {
      total: this.errorLog.length,
      bySeverity: {},
      byCategory: {},
      recentErrors: this.errorLog.slice(-10)
    };

    this.errorLog.forEach(error => {
      summary.bySeverity[error.severity] = (summary.bySeverity[error.severity] || 0) + 1;
      summary.byCategory[error.category] = (summary.byCategory[error.category] || 0) + 1;
    });

    return summary;
  }

  /**
   * Clear all logged errors
   */
  clearErrors(): void {
    this.errorLog = [];
  }

  /**
   * Get all logged errors
   * @returns Array of all error info
   */
  getAllErrors(): ErrorInfo[] {
    return [...this.errorLog];
  }

  /**
   * Get errors by category
   * @param category - Error category to filter by
   * @returns Array of errors in the specified category
   */
  getErrorsByCategory(category: string): ErrorInfo[] {
    return this.errorLog.filter(error => error.category === category);
  }

  /**
   * Get errors by severity
   * @param severity - Severity level to filter by
   * @returns Array of errors with the specified severity
   */
  getErrorsBySeverity(severity: 'critical' | 'high' | 'medium' | 'low'): ErrorInfo[] {
    return this.errorLog.filter(error => error.severity === severity);
  }

  /**
   * Add a custom recovery strategy
   * @param category - Error category
   * @param strategy - Recovery strategy function
   */
  addRecoveryStrategy(category: string, strategy: RecoveryStrategy): void {
    this.recoveryStrategies.set(category, strategy);
  }

  /**
   * Add a custom error category
   * @param category - Category name
   * @param config - Category configuration
   */
  addErrorCategory(category: string, config: ErrorCategory): void {
    this.errorCategories[category] = config;
  }
}