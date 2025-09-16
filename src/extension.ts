import * as vscode from 'vscode';
import { ProviderManager } from './features/providerManager';
import { CodebaseScanner } from './features/codebaseScanner';
import { CodeParser } from './features/codeParser';
import { EmbeddingManager } from './features/embeddingManager';
import { ContextRetriever } from './features/contextRetriever';
import { logger, LogLevel } from './utils/logger';
import { ChatPanel } from './webview/chatPanel';
import { InlineCompletionProvider } from './features/inlineCompletionProvider';
import { DebuggingAssistant, ErrorDebugAdapterTrackerFactory } from './features/debuggingAssistant';
import { SettingsManager } from './features/settingsManager';

export async function activate(context: vscode.ExtensionContext) {
    // Initialize SettingsManager first as other components depend on it.
    const settingsManager = new SettingsManager(context);
    await settingsManager.initialize();

    logger.setOutputLevel(settingsManager.getLogLevel());
    logger.log('My AI Extension is now active.');

    // Initialize the core managers, passing settingsManager where needed
    const providerManager = new ProviderManager(settingsManager);
    const codebaseScanner = new CodebaseScanner();
    const codeParser = new CodeParser();
    const embeddingManager = new EmbeddingManager(codeParser, context);
    const contextRetriever = new ContextRetriever(embeddingManager, codeParser);
    const debuggingAssistant = new DebuggingAssistant(providerManager, contextRetriever);
    
    // Wire up codebase scanning to the embedding manager
    codebaseScanner.scanAndWatch();
    codebaseScanner.onDidUpdateFiles(uris => {
        logger.log(`Codebase updated. ${uris.length} files changed.`);
        uris.forEach(uri => embeddingManager.addOrUpdateFile(uri));
    });
    codebaseScanner.onDidRemoveFiles(uris => {
        uris.forEach(uri => embeddingManager.removeFile(uri));
    });

    // Register the Inline Completion Provider
    if (settingsManager.isInlineCompletionEnabled()) {
        const inlineCompletionProvider = new InlineCompletionProvider(providerManager, contextRetriever);
        const supportedLanguages = ['typescript', 'javascript', 'python', 'java', 'go', 'rust', 'csharp', 'cpp'];
        context.subscriptions.push(
            vscode.languages.registerInlineCompletionItemProvider(
                supportedLanguages.map(language => ({ language, scheme: 'file' })), 
                inlineCompletionProvider
            )
        );
    }

    // Register Debug Adapter Tracker for error analysis
    context.subscriptions.push(
        vscode.debug.registerDebugAdapterTrackerFactory('*', new ErrorDebugAdapterTrackerFactory(debuggingAssistant))
    );

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('my-ai-extension.startChat', () => {
            ChatPanel.createOrShow(context.extensionUri, providerManager, contextRetriever);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('my-ai-extension.generateProject', () => {
            vscode.window.showInformationMessage('Generating project from blueprint...');
        })
    );
}

export function deactivate() {
    logger.log('My AI Extension is being deactivated.');
}

