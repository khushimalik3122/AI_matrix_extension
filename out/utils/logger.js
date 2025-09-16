"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.LogLevel = void 0;
const vscode = __importStar(require("vscode"));
// Create a dedicated output channel for the extension
const outputChannel = vscode.window.createOutputChannel("My AI Extension");
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
let currentLevel = LogLevel.INFO;
exports.logger = {
    setOutputLevel: (level) => {
        currentLevel = level;
    },
    debug: (...args) => {
        if (currentLevel <= LogLevel.DEBUG) {
            const timestamp = new Date().toLocaleTimeString();
            outputChannel.appendLine(`[DEBUG ${timestamp}] ${args.map(stringify).join(' ')}`);
        }
    },
    log: (...args) => {
        if (currentLevel <= LogLevel.INFO) {
            const timestamp = new Date().toLocaleTimeString();
            outputChannel.appendLine(`[INFO ${timestamp}] ${args.map(stringify).join(' ')}`);
        }
    },
    warn: (...args) => {
        if (currentLevel <= LogLevel.WARN) {
            const timestamp = new Date().toLocaleTimeString();
            outputChannel.appendLine(`[WARN ${timestamp}] ${args.map(stringify).join(' ')}`);
        }
    },
    error: (...args) => {
        if (currentLevel <= LogLevel.ERROR) {
            const timestamp = new Date().toLocaleTimeString();
            outputChannel.appendLine(`[ERROR ${timestamp}] ${args.map(stringify).join(' ')}`);
        }
        const firstMessage = args[0] instanceof Error ? args[0].message : stringify(args[0]);
        vscode.window.showErrorMessage(`My AI Extension Error: ${firstMessage}. See output for details.`);
    },
    show: () => {
        outputChannel.show();
    }
};
function stringify(value) {
    if (value instanceof Error) {
        return value.stack || value.message;
    }
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value);
        }
        catch {
            return String(value);
        }
    }
    return String(value);
}
//# sourceMappingURL=logger.js.map