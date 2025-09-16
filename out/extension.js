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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const providerManager_1 = require("./features/providerManager");
const codebaseScanner_1 = require("./features/codebaseScanner");
const codeParser_1 = require("./features/codeParser");
const embeddingManager_1 = require("./features/embeddingManager");
const contextRetriever_1 = require("./features/contextRetriever");
const logger_1 = require("./utils/logger");
const chatPanel_1 = require("./webview/chatPanel");
const inlineCompletionProvider_1 = require("./features/inlineCompletionProvider");
const debuggingAssistant_1 = require("./features/debuggingAssistant");
const settingsManager_1 = require("./features/settingsManager");
async function activate(context) {
    // Initialize SettingsManager first as other components depend on it.
    const settingsManager = new settingsManager_1.SettingsManager(context);
    await settingsManager.initialize();
    logger_1.logger.setOutputLevel(settingsManager.getLogLevel());
    logger_1.logger.log('My AI Extension is now active.');
    // Initialize the core managers, passing settingsManager where needed
    const providerManager = new providerManager_1.ProviderManager(settingsManager);
    const codebaseScanner = new codebaseScanner_1.CodebaseScanner();
    const codeParser = new codeParser_1.CodeParser();
    const embeddingManager = new embeddingManager_1.EmbeddingManager(codeParser, context);
    const contextRetriever = new contextRetriever_1.ContextRetriever(embeddingManager, codeParser);
    const debuggingAssistant = new debuggingAssistant_1.DebuggingAssistant(providerManager, contextRetriever);
    // Wire up codebase scanning to the embedding manager
    codebaseScanner.scanAndWatch();
    codebaseScanner.onDidUpdateFiles(uris => {
        logger_1.logger.log(`Codebase updated. ${uris.length} files changed.`);
        uris.forEach(uri => embeddingManager.addOrUpdateFile(uri));
    });
    codebaseScanner.onDidRemoveFiles(uris => {
        uris.forEach(uri => embeddingManager.removeFile(uri));
    });
    // Register the Inline Completion Provider
    if (settingsManager.isInlineCompletionEnabled()) {
        const inlineCompletionProvider = new inlineCompletionProvider_1.InlineCompletionProvider(providerManager, contextRetriever);
        const supportedLanguages = ['typescript', 'javascript', 'python', 'java', 'go', 'rust', 'csharp', 'cpp'];
        context.subscriptions.push(vscode.languages.registerInlineCompletionItemProvider(supportedLanguages.map(language => ({ language, scheme: 'file' })), inlineCompletionProvider));
    }
    // Register Debug Adapter Tracker for error analysis
    context.subscriptions.push(vscode.debug.registerDebugAdapterTrackerFactory('*', new debuggingAssistant_1.ErrorDebugAdapterTrackerFactory(debuggingAssistant)));
    // Register commands
    context.subscriptions.push(vscode.commands.registerCommand('my-ai-extension.startChat', () => {
        chatPanel_1.ChatPanel.createOrShow(context.extensionUri, providerManager, contextRetriever);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('my-ai-extension.generateProject', () => {
        vscode.window.showInformationMessage('Generating project from blueprint...');
    }));
}
function deactivate() {
    logger_1.logger.log('My AI Extension is being deactivated.');
}
//# sourceMappingURL=extension.js.map