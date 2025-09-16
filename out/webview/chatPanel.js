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
exports.ChatPanel = void 0;
const vscode = __importStar(require("vscode"));
const getChatWebviewContent_1 = require("./getChatWebviewContent");
const logger_1 = require("../utils/logger");
class ChatPanel {
    constructor(panel, extensionUri, providerManager, contextRetriever) {
        this.providerManager = providerManager;
        this.contextRetriever = contextRetriever;
        this._disposables = [];
        this._cancellationTokenSource = null;
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.onDidReceiveMessage((message) => this.handleMessage(message), null, this._disposables);
        this._panel.webview.html = (0, getChatWebviewContent_1.getChatWebviewContent)(this._panel.webview, this._extensionUri, {
            messages: [],
            availableProviders: [],
            activeProvider: '',
            isLoading: true,
            contextStrategy: 'semantic'
        });
    }
    static createOrShow(extensionUri, providerManager, contextRetriever) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
        if (ChatPanel.currentPanel) {
            ChatPanel.currentPanel._panel.reveal(column);
            return;
        }
        const panel = vscode.window.createWebviewPanel('aiChat', 'AI Chat', column || vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
        });
        ChatPanel.currentPanel = new ChatPanel(panel, extensionUri, providerManager, contextRetriever);
    }
    async handleMessage(message) {
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
                    logger_1.logger.log("User cancelled AI request.");
                }
                break;
            case 'openSettings':
                vscode.commands.executeCommand('workbench.action.openSettings', 'my-ai-extension');
                break;
            case 'clearHistory':
                // In a real app, this would clear stored history. Here we just reset the view.
                this._panel.webview.html = (0, getChatWebviewContent_1.getChatWebviewContent)(this._panel.webview, this._extensionUri, {
                    messages: [],
                    availableProviders: this.providerManager.getAvailableProviders(),
                    activeProvider: this.providerManager.getActiveProviderName(),
                    isLoading: false,
                    contextStrategy: 'semantic'
                });
                break;
        }
    }
    async handleUserMessage(message, contextStrategy) {
        this._cancellationTokenSource = new vscode.CancellationTokenSource();
        const token = this._cancellationTokenSource.token;
        this.postMessage({ type: 'typingIndicator', payload: { active: true } });
        try {
            const context = await this.contextRetriever.retrieve({
                query: message,
                strategy: contextStrategy
            });
            let fullPrompt = `User Query: "${message}"\n\n`;
            if (context && context.contextString) {
                fullPrompt += `Relevant Code Context:\n---\n${context.contextString}\n---\n`;
            }
            const conversationId = Date.now().toString();
            this.postMessage({ type: 'streamStart', payload: { conversationId } });
            let fullResponse = "";
            for await (const chunk of this.providerManager.streamResponse(fullPrompt.toString(), { sessionId: conversationId })) {
                if (token.isCancellationRequested)
                    break;
                fullResponse += chunk;
                this.postMessage({ type: 'streamChunk', payload: { conversationId, chunk } });
            }
            this.postMessage({ type: 'streamEnd', payload: { conversationId, fullResponse } });
        }
        catch (error) {
            this.postMessage({ type: 'error', payload: { message: error.message } });
        }
        finally {
            this.postMessage({ type: 'typingIndicator', payload: { active: false } });
            this._cancellationTokenSource = null;
        }
    }
    postMessage(message) {
        this._panel.webview.postMessage(message);
    }
    dispose() {
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
exports.ChatPanel = ChatPanel;
//# sourceMappingURL=chatPanel.js.map