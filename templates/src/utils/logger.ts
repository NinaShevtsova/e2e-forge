// path: src/utils/logger.ts

/**
 * Simple structured logger used throughout the framework.
 * Prepends a context label to every message for easy filtering.
 */
export class Logger {
  constructor(private readonly context: string) {}

  /**
   * Log an informational message.
   * @param message - Message to log
   */
  info(message: string): void {
    console.log(`[INFO]  [${this.context}] ${message}`);
  }

  /**
   * Log a warning message.
   * @param message - Warning details
   */
  warn(message: string): void {
    console.warn(`[WARN]  [${this.context}] ${message}`);
  }

  /**
   * Log an error message with optional error object.
   * @param message - Error summary
   * @param error - Optional Error instance
   */
  error(message: string, error?: unknown): void {
    console.error(`[ERROR] [${this.context}] ${message}`, error ?? '');
  }

  /**
   * Log verbose/debug information (only when the DEBUG env var is set).
   * @param message - Debug details
   */
  debug(message: string): void {
    if (process.env['DEBUG']) {
      console.debug(`[DEBUG] [${this.context}] ${message}`);
    }
  }
}
