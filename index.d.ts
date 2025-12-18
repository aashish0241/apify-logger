declare class ApifySmartLogger {
  constructor(options?: ApifySmartLogger.LoggerOptions);

  debug(...args: any[]): void;
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;

  getLogs(filter?: ApifySmartLogger.LogFilter): ApifySmartLogger.LogEntry[];
  clearLogs(): void;
  exportLogs(format?: "json" | "csv" | "text"): string;

  setLogLevel(level: "debug" | "info" | "warn" | "error"): void;
  addCustomPattern(pattern: RegExp, mask: string): void;
  restoreConsole(): void;

  static createInstance(
    options?: ApifySmartLogger.LoggerOptions
  ): ApifySmartLogger;
}

declare namespace ApifySmartLogger {
  interface LoggerOptions {
    enabled?: boolean;
    logLevel?: "debug" | "info" | "warn" | "error";
    autoCapture?: boolean;
    maxBufferSize?: number;
    maskPatterns?: MaskPattern[];
    customPatterns?: MaskPattern[];
  }

  interface MaskPattern {
    pattern: RegExp;
    mask: string;
  }

  interface LogFilter {
    level?: "debug" | "info" | "warn" | "error";
    since?: Date | string | number;
    limit?: number;
  }

  interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
  }
}

export = ApifySmartLogger;
