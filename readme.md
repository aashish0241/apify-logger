# Smarter Console 🔒

[![npm version](https://img.shields.io/npm/v/smarter-console.svg)](https://www.npmjs.com/package/smarter-console)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A sophisticated, automatic logging system with sensitive data masking, console interception, and flexible log management to keep your logs clean, secure, and useful.

## 🚀 Features

- 🔒 **Automatic Masking**: Automatically detects and masks API keys, tokens, passwords, emails, and credit card numbers.
- 🎯 **Console Interception**: Seamlessly intercepts `console.log`, `console.info`, `console.warn`, and `console.error`.
- 📊 **Log Buffering**: Stores logs in memory with a configurable buffer size.
- 📤 **Multi-format Export**: Export your logs as JSON, CSV, or plain text.
- 🛠️ **Highly Customizable**: Add your own masking patterns and configure log levels.
- 🧹 **Clean Output**: Formats logs with timestamps and levels for better readability.

---

## 📋 Table of Contents

- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [API Reference](#-api-reference)
  - [Logging Methods](#logging-methods)
  - [Log Retrieval](#log-retrieval)
  - [Exporting Logs](#exporting-logs)
  - [Utility Methods](#utility-methods)
- [Default Masking Patterns](#-default-masking-patterns)
- [License](#-license)

---

## 📦 Installation

Install via npm:

```bash
npm install smarter-console
```

---

## ⚡ Quick Start

The simplest way to use the logger is to initialize it at the start of your application. It will automatically start intercepting console calls.

```javascript
const SmarterConsole = require("smarter-console");

// Initialize (auto-captures console logs by default)
const logger = new SmarterConsole();

// Use standard console methods - they are now automatically masked!
console.log("My API Key is: sk_test_51Mzabc123456789");
// Output: [2023-10-27T10:00:00.000Z] [LOG] My API Key is: api_key=***MASKED***

// You can also use the logger instance directly
logger.info("Actor started successfully");
logger.error("Something went wrong", { errorCode: 500 });
```

---

## ⚙️ Configuration

You can customize the logger behavior by passing an options object to the constructor:

```javascript
const logger = new SmarterConsole({
  enabled: true, // Set to false to disable all logging (Default: true)
  autoCapture: true, // Automatically intercept console methods (Default: true)
  logLevel: "info", // Minimum level to log: 'debug', 'info', 'warn', 'error' (Default: 'info')
  maxBufferSize: 1000, // Maximum number of log entries to keep in memory (Default: 1000)
  customPatterns: [
    // Add your own regex patterns for masking
    {
      pattern: /internal-id-\d+/gi,
      mask: "ID-***MASKED***",
    },
  ],
});
```

---

## 📖 API Reference

### Logging Methods

The logger provides methods for different log levels. If `autoCapture` is enabled, these will also be used by the global `console` object.

- `logger.debug(...args)`
- `logger.info(...args)`
- `logger.warn(...args)`
- `logger.error(...args)`

### Log Retrieval

#### `logger.getLogs(filter)`

Returns an array of log entries from the buffer.

**Parameters:**

- `filter` (Object):
  - `level` (String): Filter by level ('debug', 'info', etc.)
  - `since` (Date|String|Number): Filter logs after this timestamp.
  - `limit` (Number): Limit the number of returned logs.

```javascript
const errors = logger.getLogs({ level: "error", limit: 10 });
```

#### `logger.clearLogs()`

Clears the internal log buffer.

### Exporting Logs

#### `logger.exportLogs(format)`

Returns the buffered logs as a string in the specified format.

**Parameters:**

- `format` (String): 'json', 'csv', or 'text' (Default: 'json')

```javascript
const csvData = logger.exportLogs("csv");
```

### Utility Methods

#### `logger.setLogLevel(level)`

Dynamically change the minimum log level.

#### `logger.addCustomPattern(pattern, mask)`

Add a new masking pattern at runtime.

#### `logger.restoreConsole()`

Stops intercepting console methods and restores the original `console` behavior.

#### `ApifySmartLogger.createInstance(options)`

Static factory method to create a new instance.

---

## 🛡️ Default Masking Patterns

By default, the logger masks the following sensitive information:

- **API Keys**: `api_key`, `apiKey`, `x-api-key`
- **Tokens**: `token`, `bearer` tokens
- **Credentials**: `password`, `secret`
- **Headers**: `authorization`
- **Personal Info**: Email addresses
- **Financial**: Credit card numbers (13-19 digits)

---

## 📄 License

This project is licensed under the MIT License.

---

Created by [Aashish Timsina](https://github.com/yourusername)
