import * as vscode from 'vscode';

// Create a dedicated output channel for the extension
const outputChannel = vscode.window.createOutputChannel("My AI Extension");

export const logger = {
    log: (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        outputChannel.appendLine(`[INFO ${timestamp}] ${message}`);
    },
    error: (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        outputChannel.appendLine(`[ERROR ${timestamp}] ${message}`);
        vscode.window.showErrorMessage(`My AI Extension Error: ${message}. See output for details.`);
    },
    show: () => {
        outputChannel.show();
    }
};
