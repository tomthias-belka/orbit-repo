/**
 * Production-ready Logger
 * Replaces console.log with configurable logging levels
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

interface LogEntry {
  level: LogLevel;
  timestamp: number;
  context: string;
  message: string;
  data?: any;
}

class Logger {
  private currentLevel: LogLevel = LogLevel.WARN; // Production default
  private logs: LogEntry[] = [];
  private maxLogs = 100;
  private enableConsole = true;

  /**
   * Set the minimum log level
   */
  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  /**
   * Enable/disable console output
   */
  setConsoleEnabled(enabled: boolean): void {
    this.enableConsole = enabled;
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.currentLevel;
  }

  /**
   * Debug level logging
   */
  debug(message: string, data?: any, context = ''): void {
    this.log(LogLevel.DEBUG, message, data, context);
  }

  /**
   * Info level logging
   */
  info(message: string, data?: any, context = ''): void {
    this.log(LogLevel.INFO, message, data, context);
  }

  /**
   * Warning level logging
   */
  warn(message: string, data?: any, context = ''): void {
    this.log(LogLevel.WARN, message, data, context);
  }

  /**
   * Error level logging
   */
  error(message: string, data?: any, context = ''): void {
    this.log(LogLevel.ERROR, message, data, context);
  }

  /**
   * Core logging function
   */
  private log(level: LogLevel, message: string, data?: any, context = ''): void {
    if (level < this.currentLevel) {
      return;
    }

    const entry: LogEntry = {
      level,
      timestamp: Date.now(),
      context,
      message,
      data
    };

    // Store in memory buffer
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output if enabled
    if (this.enableConsole) {
      this.outputToConsole(entry);
    }
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(entry: LogEntry): void {
    const levelName = LogLevel[entry.level];
    const contextStr = entry.context ? `[${entry.context}]` : '';
    const timestamp = new Date(entry.timestamp).toISOString().substr(11, 12);
    const prefix = `${timestamp} ${levelName} ${contextStr}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.data || '');
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.data || '');
        break;
      case LogLevel.ERROR:
        console.error(prefix, entry.message, entry.data || '');
        break;
    }
  }

  /**
   * Get recent logs
   */
  getLogs(count?: number): LogEntry[] {
    if (count) {
      return this.logs.slice(-count);
    }
    return [...this.logs];
  }

  /**
   * Clear log buffer
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON string
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Get logs formatted as text
   */
  getLogsAsText(): string {
    return this.logs.map(entry => {
      const levelName = LogLevel[entry.level];
      const contextStr = entry.context ? `[${entry.context}]` : '';
      const timestamp = new Date(entry.timestamp).toISOString();
      const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
      return `${timestamp} ${levelName} ${contextStr} ${entry.message}${dataStr}`;
    }).join('\n');
  }
}

// Singleton instance
export const logger = new Logger();

// Development mode detection
const isDevelopment = false; // Set to true during development

if (isDevelopment) {
  logger.setLevel(LogLevel.DEBUG);
} else {
  logger.setLevel(LogLevel.WARN); // Production: only warnings and errors
}

/**
 * Create a logger with a specific context
 */
export function createLogger(context: string) {
  return {
    debug: (message: string, data?: any) => logger.debug(message, data, context),
    info: (message: string, data?: any) => logger.info(message, data, context),
    warn: (message: string, data?: any) => logger.warn(message, data, context),
    error: (message: string, data?: any) => logger.error(message, data, context)
  };
}
