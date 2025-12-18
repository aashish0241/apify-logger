"use strict";

class ApifySmartLogger {
  constructor(options = {}) {
    this.config = {
      enabled: options.enabled !== false,
      logLevel: options.logLevel || "info",
      autoCapture: options.autoCapture !== false,
      maxBufferSize: options.maxBufferSize || 1000,
    };

    this.logLevels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    this.currentLevel = this.logLevels[this.config.logLevel] || 1;
    this.maskPatterns = this._initMaskPatterns(
      options.maskPatterns,
      options.customPatterns
    );
    this.logBuffer = [];
    this.originalConsole = {};

    if (this.config.autoCapture) {
      this._captureConsole();
    }
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================

  _initMaskPatterns(customMaskPatterns, customPatterns) {
    const defaults = [
      {
        pattern: /api[_-]?key[s]?[\s]*[=:][\s]*['"]?([^'",\s]{8,})/gi,
        mask: "api_key=***MASKED***",
      },
      {
        pattern: /token[s]?[\s]*[=:][\s]*['"]?([^'",\s]{8,})/gi,
        mask: "token=***MASKED***",
      },
      {
        pattern: /password[s]?[\s]*[=:][\s]*['"]?([^'",\s]+)/gi,
        mask: "password=***MASKED***",
      },
      {
        pattern: /secret[s]?[\s]*[=:][\s]*['"]?([^'",\s]{8,})/gi,
        mask: "secret=***MASKED***",
      },
      {
        pattern: /bearer[\s]+([a-zA-Z0-9_\-\.]{8,})/gi,
        mask: "bearer ***MASKED***",
      },
      {
        pattern: /authorization[\s]*:[\s]*['"]?([^'",\s]{8,})/gi,
        mask: "authorization: ***MASKED***",
      },
      {
        pattern: /graphql[_-]?key[s]?[\s]*[=:][\s]*['"]?([^'",\s]{8,})/gi,
        mask: "graphql_key=***MASKED***",
      },
      {
        pattern: /x-api-key[\s]*:[\s]*['"]?([^'",\s]{8,})/gi,
        mask: "x-api-key: ***MASKED***",
      },
      {
        pattern: /"apiKey"[\s]*:[\s]*"([^"]{8,})"/gi,
        mask: '"apiKey": "***MASKED***"',
      },
      {
        pattern: /"token"[\s]*:[\s]*"([^"]{8,})"/gi,
        mask: '"token": "***MASKED***"',
      },
      {
        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        mask: "***EMAIL_MASKED***",
      },
      { pattern: /\b\d{13,19}\b/g, mask: "***CC_MASKED***" },
      {
        pattern:
          /[a-z]+:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi,
        mask: "***URL_MASKED***",
      },
      {
        pattern:
          /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
        mask: "***IP_MASKED***",
      },
      {
        pattern: /\b(?:localhost|127\.0\.0\.1)(?::\d+)?\b/gi,
        mask: "***LOCAL_SITE_MASKED***",
      },
      {
        pattern:
          /\b(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.(?:com|net|org|io|gov|edu|co|info|biz|me|tv|actor|apify|online|xyz|site|app)\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi,
        mask: "***SITE_MASKED***",
      },
      {
        pattern:
          /git@[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-z]{2,6}\b:[-a-zA-Z0-9()@:%_\+.~#?&//=]*/gi,
        mask: "***GIT_URL_MASKED***",
      },
    ];

    return [...(customMaskPatterns || defaults), ...(customPatterns || [])];
  }

  _captureConsole() {
    const methods = ["log", "info", "warn", "error", "debug"];

    methods.forEach((method) => {
      this.originalConsole[method] = console[method].bind(console);

      console[method] = (...args) => {
        if (this.config.enabled) {
          const maskedArgs = args.map((arg) => this._maskData(arg));
          this._addToBuffer(method, maskedArgs);
          this.originalConsole[method](...maskedArgs);
        } else {
          this.originalConsole[method](...args);
        }
      };
    });
  }

  // ==========================================
  // MASKING
  // ==========================================

  _maskData(data) {
    let stringified;
    try {
      if (typeof data === "string") {
        stringified = data;
      } else if (data instanceof Error) {
        stringified = `${data.name}: ${data.message}\n${data.stack}`;
      } else {
        stringified = JSON.stringify(data, this._getCircularReplacer(), 2);
      }
    } catch (e) {
      stringified = String(data);
    }

    if (!stringified) return stringified;

    return this.maskPatterns.reduce((masked, { pattern, mask }) => {
      return masked.replace(pattern, mask);
    }, stringified);
  }

  _getCircularReplacer() {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return "[Circular]";
        }
        seen.add(value);
      }
      return value;
    };
  }

  // ==========================================
  // BUFFER MANAGEMENT
  // ==========================================

  _addToBuffer(level, args) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message: args.join(" "),
    };

    this.logBuffer.push(entry);

    if (this.logBuffer.length > this.config.maxBufferSize) {
      this.logBuffer.shift();
    }
  }

  _shouldLog(level) {
    return this.logLevels[level] >= this.currentLevel;
  }

  _formatMessage(level, args) {
    const timestamp = new Date().toISOString();
    const maskedArgs = args.map((arg) => this._maskData(arg));
    return `[${timestamp}] [${level.toUpperCase()}] ${maskedArgs.join(" ")}`;
  }

  // ==========================================
  // PUBLIC LOGGING METHODS
  // ==========================================

  debug(...args) {
    if (!this.config.enabled || !this._shouldLog("debug")) return;

    const message = this._formatMessage("debug", args);
    this._addToBuffer("debug", args);
    this.originalConsole.debug(message);
  }

  info(...args) {
    if (!this.config.enabled || !this._shouldLog("info")) return;

    const message = this._formatMessage("info", args);
    this._addToBuffer("info", args);
    this.originalConsole.info(message);
  }

  warn(...args) {
    if (!this.config.enabled || !this._shouldLog("warn")) return;

    const message = this._formatMessage("warn", args);
    this._addToBuffer("warn", args);
    this.originalConsole.warn(message);
  }

  error(...args) {
    if (!this.config.enabled || !this._shouldLog("error")) return;

    const message = this._formatMessage("error", args);
    this._addToBuffer("error", args);
    this.originalConsole.error(message);
  }

  // ==========================================
  // LOG RETRIEVAL & MANAGEMENT
  // ==========================================

  getLogs(filter = {}) {
    let logs = [...this.logBuffer];

    if (filter.level) {
      logs = logs.filter((log) => log.level === filter.level.toUpperCase());
    }

    if (filter.since) {
      const sinceDate = new Date(filter.since);
      logs = logs.filter((log) => new Date(log.timestamp) >= sinceDate);
    }

    if (filter.limit) {
      logs = logs.slice(-filter.limit);
    }

    return logs;
  }

  clearLogs() {
    this.logBuffer = [];
  }

  // ==========================================
  // EXPORT
  // ==========================================

  exportLogs(format = "json") {
    const exporters = {
      json: () => JSON.stringify(this.logBuffer, null, 2),
      csv: () => this._exportCsv(),
      text: () => this._exportText(),
    };

    return exporters[format]?.() || exporters.json();
  }

  _exportCsv() {
    const header = "Timestamp,Level,Message\n";
    const rows = this.logBuffer
      .map(
        (log) =>
          `"${log.timestamp}","${log.level}","${log.message.replace(
            /"/g,
            '""'
          )}"`
      )
      .join("\n");

    return header + rows;
  }

  _exportText() {
    return this.logBuffer
      .map((log) => `[${log.timestamp}] [${log.level}] ${log.message}`)
      .join("\n");
  }

  // ==========================================
  // CONFIGURATION
  // ==========================================

  setLogLevel(level) {
    if (this.logLevels.hasOwnProperty(level)) {
      this.config.logLevel = level;
      this.currentLevel = this.logLevels[level];
    }
  }

  addCustomPattern(pattern, mask) {
    this.maskPatterns.push({ pattern, mask });
  }

  restoreConsole() {
    Object.keys(this.originalConsole).forEach((method) => {
      console[method] = this.originalConsole[method];
    });
  }

  // ==========================================
  // STATIC FACTORY
  // ==========================================

  static createInstance(options) {
    return new ApifySmartLogger(options);
  }
}

module.exports = ApifySmartLogger;
