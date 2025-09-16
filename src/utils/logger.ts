import * as vscode from 'vscode';

// Create a dedicated output channel for the extension
const outputChannel = vscode.window.createOutputChannel("My AI Extension");

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
}

let currentLevel: LogLevel = LogLevel.INFO;

export const logger = {
    setOutputLevel: (level: LogLevel) => {
        currentLevel = level;
    },
    debug: (...args: any[]) => {
        if (currentLevel <= LogLevel.DEBUG) {
            const timestamp = new Date().toLocaleTimeString();
            outputChannel.appendLine(`[DEBUG ${timestamp}] ${args.map(stringify).join(' ')}`);
        }
    },
    log: (...args: any[]) => {
        if (currentLevel <= LogLevel.INFO) {
            const timestamp = new Date().toLocaleTimeString();
            outputChannel.appendLine(`[INFO ${timestamp}] ${args.map(stringify).join(' ')}`);
        }
    },
    warn: (...args: any[]) => {
        if (currentLevel <= LogLevel.WARN) {
            const timestamp = new Date().toLocaleTimeString();
            outputChannel.appendLine(`[WARN ${timestamp}] ${args.map(stringify).join(' ')}`);
        }
    },
    error: (...args: any[]) => {
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

function stringify(value: any): string {
    if (value instanceof Error) {
        return value.stack || value.message;
    }
    if (typeof value === 'object') {
        try { return JSON.stringify(value); } catch { return String(value); }
    }
    return String(value);
}
