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
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('Extension should be present and activate', (done) => {
        const extension = vscode.extensions.getExtension('your-publisher-name.my-ai-extension'); // Replace with your actual publisher name
        assert.ok(extension, "Extension not found");
        extension.activate().then(() => {
            assert.ok(true, "Extension activated");
            done();
        });
    });
    test('startChat command should create a webview panel', async () => {
        // This is a proxy to check if the command opens a panel.
        // A more detailed test would require inspecting the panel's content.
        let panelCreated = false;
        const originalCreateWebviewPanel = vscode.window.createWebviewPanel;
        vscode.window.createWebviewPanel = () => {
            panelCreated = true;
            // Restore original function and return a mock panel
            vscode.window.createWebviewPanel = originalCreateWebviewPanel;
            return { webview: {}, onDidDispose: () => { }, reveal: () => { } };
        };
        await vscode.commands.executeCommand('my-ai-extension.startChat');
        assert.ok(panelCreated, "The chat panel was not created.");
    });
});
//# sourceMappingURL=extension.test.js.map