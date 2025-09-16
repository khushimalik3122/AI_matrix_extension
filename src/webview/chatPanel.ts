import * as vscode from 'vscode';
import { getChatWebviewContent } from './getChatWebviewContent';
import { WebviewToExtensionMessage, ExtensionToWebviewMessage } from './webview';
import { ProviderManager } from '../features/providerManager';
import { ContextRetriever } from '../features/contextRetriever';
import { logger } from '../utils/logger';

export class ChatPanel {
    public static currentPanel: ChatPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _cancellationTokenSource: vscode.CancellationTokenSource | null = null;

    private constructor(
        panel: vscode.WebviewPanel, 
        extensionUri: vscode.Uri,
        private providerManager: ProviderManager,
        private contextRetriever: ContextRetriever
    ) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.onDidReceiveMessage(
            (message: WebviewToExtensionMessage) => this.handleMessage(message),
            null,
            this._disposables
        );

        this._panel.webview.html = getChatWebviewContent(this._panel.webview, this._extensionUri);
    }

    public static createOrShow(
        extensionUri: vscode.Uri, 
        providerManager: ProviderManager, 
        contextRetriever: ContextRetriever
    ) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        if (ChatPanel.currentPanel) {
            ChatPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'aiChat', 'AI Chat',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
            }
        );

        ChatPanel.currentPanel = new ChatPanel(panel, extensionUri, providerManager, contextRetriever);
    }
    
    private async handleMessage(message: WebviewToExtensionMessage) {
        switch (message.type) {
            case 'ready':
                this.postMessage({ 
                    type: 'providersLoaded', 
                    payload: { 
                        providers: this.providerManager.getAvailableProviders(),
                        activeProvider: this.providerManager.getActiveProviderName() 
                    }
                });
                break;
            case 'sendMessage':
                await this.handleUserMessage(message.payload.message, message.payload.contextStrategy);
                break;
            case 'setActiveProvider':
                this.providerManager.setActiveProvider(message.payload.provider);
                break;
            case 'cancelRequest':
                if (this._cancellationTokenSource) {
                    this._cancellationTokenSource.cancel();
                    this._cancellationTokenSource = null;
                    logger.log("User cancelled AI request.");
                }
                break;
            case 'openSettings':
                vscode.commands.executeCommand('workbench.action.openSettings', 'my-ai-extension');
                break;
            case 'clearHistory':
                // In a real app, this would clear stored history. Here we just reset the view.
                this._panel.webview.html = getChatWebviewContent(this._panel.webview, this._extensionUri);
                break;
        }
    }

    private async handleUserMessage(message: string, contextStrategy: string) {
        this._cancellationTokenSource = new vscode.CancellationTokenSource();
        const token = this._cancellationTokenSource.token;

        this.postMessage({ type: 'typingIndicator', payload: { active: true } });

        try {
            const context = await this.contextRetriever.retrieve({ 
                query: message, 
                strategy: contextStrategy as any
            });

            let fullPrompt = `User Query: "${message}"\n\n`;
            if (context && context.contextString) {
                fullPrompt += `Relevant Code Context:\n---\n${context.contextString}\n---\n`;
            }
            
            const conversationId = Date.now().toString();
            this.postMessage({ type: 'streamStart', payload: { conversationId } });

            let fullResponse = "";
            for await (const chunk of this.providerManager.streamResponse({ prompt: fullPrompt }, token)) {
                if (token.isCancellationRequested) break;
                fullResponse += chunk;
                this.postMessage({ type: 'streamChunk', payload: { conversationId, chunk }});
            }

            this.postMessage({ type: 'streamEnd', payload: { conversationId, fullResponse } });

        } catch (error: any) {
            this.postMessage({ type: 'error', payload: { message: error.message }});
        } finally {
            this.postMessage({ type: 'typingIndicator', payload: { active: false } });
            this._cancellationTokenSource = null;
        }
    }
    
    private postMessage(message: ExtensionToWebviewMessage) {
        this._panel.webview.postMessage(message);
    }

    public dispose() {
        ChatPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}

