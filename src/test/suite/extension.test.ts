import * as assert from 'assert';
import * as vscode from 'vscode';

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
        
        (vscode.window as any).createWebviewPanel = () => {
            panelCreated = true;
            // Restore original function and return a mock panel
            (vscode.window as any).createWebviewPanel = originalCreateWebviewPanel;
            return { webview: {}, onDidDispose: () => {}, reveal: () => {} }; 
        };

        await vscode.commands.executeCommand('my-ai-extension.startChat');
        assert.ok(panelCreated, "The chat panel was not created.");
    });
});

