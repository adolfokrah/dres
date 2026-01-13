export interface Logger {
  info: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  debug: (message: string, ...args: unknown[]) => void;
}

/**
 * Simple logger with timestamps and colors
 */
export const logger: Logger = {
  info: (message: string, ...args: unknown[]): void => {
    console.log(`[${new Date().toISOString()}] ℹ️  ${message}`, ...args);
  },
  
  error: (message: string, ...args: unknown[]): void => {
    console.error(`[${new Date().toISOString()}] ❌ ${message}`, ...args);
  },
  
  warn: (message: string, ...args: unknown[]): void => {
    console.warn(`[${new Date().toISOString()}] ⚠️  ${message}`, ...args);
  },
  
  debug: (message: string, ...args: unknown[]): void => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${new Date().toISOString()}] 🐛 ${message}`, ...args);
    }
  }
};