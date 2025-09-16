import * as vscode from 'vscode';
import { ProviderManager } from './providerManager';
import { ContextRetriever } from './contextRetriever';
import { logger } from '../utils/logger';

export class DebuggingAssistant {
    private providerManager: ProviderManager;
    private contextRetriever: ContextRetriever;

    constructor(providerManager: ProviderManager, contextRetriever: ContextRetriever) {
        this.providerManager = providerManager;
        this.contextRetriever = contextRetriever;
    }

    /**
     * Analyzes an error message and stack trace to provide an explanation and potential fix.
     */
    public async analyzeError(error: { message: string, stack?: string }): Promise<string | null> {
        if (!error.message) return null;

        const relevantFiles = this.extractFilePathsFromStack(error.stack);
        const codeContext = await this.getContextFromFiles(relevantFiles);

        const prompt = `
            You are an expert software debugger. A user has encountered an error in their application.
            Analyze the following error message, stack trace, and relevant code to explain the cause of the error and suggest a fix.

            Error Message:
            ${error.message}

            Stack Trace:
            ${error.stack || 'No stack trace provided.'}

            Relevant Code from the project:
            ---
            ${codeContext || 'No code context could be retrieved automatically.'}
            ---

            Please provide:
            1. A clear and concise explanation of what the error means in this context.
            2. The likely root cause of the problem.
            3. A concrete suggestion for how to fix the code, including code snippets if applicable.
        `;

        try {
            return await this.providerManager.generateResponse(prompt, { maxTokens: 1024 });
        } catch (err: any) {
            logger.error(`Error analyzing error: ${err.message}`);
            return "Sorry, I encountered an error while analyzing the issue.";
        }
    }
    
    /**
     * Analyzes a memory usage report to identify potential issues.
     */
    public async analyzeMemoryUsage(report: string): Promise<string | null> {
        const prompt = `
            You are a performance and memory optimization specialist.
            Analyze the following memory usage report or heap snapshot summary.
            Identify potential memory leaks, excessive memory consumption, or inefficient data structures.

            Memory Report:
            ---
            ${report}
            ---

            Provide a detailed analysis including:
            1. Potential areas of concern in the report.
            2. Likely causes for high memory usage or leaks.
            3. Recommendations for optimizing memory consumption.
        `;

        try {
            return await this.providerManager.generateResponse(prompt, { maxTokens: 1024 });
        } catch (err: any) {
            logger.error(`Error analyzing memory usage: ${err.message}`);
            return "Sorry, I encountered an error while analyzing the memory report.";
        }
    }

    private async getContextFromFiles(filePaths: string[]): Promise<string | null> {
        if (filePaths.length === 0) return null;
        
        // Find unique file URIs in the workspace
        const uris = await Promise.all(
            filePaths.map(p => vscode.workspace.findFiles(`**/${p.split(/[\\/]/).pop()}`, '**/node_modules/**', 1))
        );
        const uniqueUris = new Set(uris.flat().map(uri => uri.toString()));

        if (uniqueUris.size === 0) return null;

        let combinedContext = '';
        for (const uriString of uniqueUris) {
            try {
                const doc = await vscode.workspace.openTextDocument(vscode.Uri.parse(uriString));
                combinedContext += `\n\n--- File: ${vscode.workspace.asRelativePath(uriString)} ---\n`;
                combinedContext += doc.getText().substring(0, 4000); // Limit context size per file
            } catch (error) {
                logger.error(`Could not read file for context: ${uriString}`);
            }
        }
        return combinedContext;
    }

    private extractFilePathsFromStack(stackTrace?: string): string[] {
        if (!stackTrace) return [];
        // This regex is a best-effort attempt to find file paths in stack traces.
        const regex = /(?:[a-zA-Z]:[\\/][^:]+|[/][^:]+)(?::\d+)?/g;
        const matches = stackTrace.match(regex) || [];
        return matches.map(match => match.split(':')[0]); // Remove line/column numbers
    }
}


/**
 * Factory for creating DebugAdapterTrackers to monitor debug sessions for errors.
 */
export class ErrorDebugAdapterTrackerFactory implements vscode.DebugAdapterTrackerFactory {

    constructor(private debuggingAssistant: DebuggingAssistant) {}

    createDebugAdapterTracker(session: vscode.DebugSession): vscode.ProviderResult<vscode.DebugAdapterTracker> {
        return {
            onDidSendMessage: (message: any) => {
                if (message.type === 'event' && message.event === 'output' && message.body.category === 'stderr') {
                    const output = message.body.output as string;
                    if (this.isLikelyError(output)) {
                        
                        vscode.window.showErrorMessage(`Error detected: ${output.substring(0, 100)}...`, 'Analyze with AI')
                            .then(selection => {
                                if (selection === 'Analyze with AI') {
                                    const panel = vscode.window.createWebviewPanel(
                                        'aiErrorAnalysis', 'AI Error Analysis',
                                        vscode.ViewColumn.Beside, { enableScripts: true }
                                    );
                                    panel.webview.html = `<h1>Analyzing Error...</h1>`;
                                    
                                    this.debuggingAssistant.analyzeError({ message: output })
                                        .then(analysis => {
                                            panel.webview.html = this.getAnalysisHtml(output, analysis);
                                        });
                                }
                            });
                    }
                }
            }
        };
    }

    private getAnalysisHtml(error: string, analysis: string | null): string {
        const analysisHtml = (analysis || 'No suggestion available.')
            .replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        return `
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-editor-foreground);
                    background-color: var(--vscode-editor-background);
                }
                h1, h2 { border-bottom: 1px solid var(--vscode-side-bar-border); padding-bottom: 5px; }
                pre { 
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    background-color: var(--vscode-text-block-quote-background);
                    border: 1px solid var(--vscode-text-block-quote-border);
                    padding: 1em;
                    border-radius: 4px;
                }
                code { font-family: var(--vscode-editor-font-family); }
            </style>
            <h1>AI Debugging Assistant</h1>
            <h2>Analysis of Error:</h2>
            <pre><code>${error.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
            <h2>AI Suggestion:</h2>
            <pre>${analysisHtml}</pre>
        `;
    }

    private isLikelyError(output: string): boolean {
        const lowerOutput = output.toLowerCase();
        const keywords = ['error', 'exception', 'failed', 'unhandled', 'traceback', 'panic'];
        const ignoreKeywords = ['warning', 'deprecated'];

        if (ignoreKeywords.some(kw => lowerOutput.includes(kw))) return false;
        return keywords.some(kw => lowerOutput.includes(kw));
    }
}
