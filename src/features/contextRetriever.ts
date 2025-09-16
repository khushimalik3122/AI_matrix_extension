import * as vscode from 'vscode';
import { EmbeddingManager } from './embeddingManager';
import { CodeParser } from './codeParser';
import { CodeChunk } from '../types/embedding';
import { ContextRetrievalOptions, RetrievedContext, ContextStrategy } from '../types/context';
import { logger } from '../utils/logger';

const MAX_RECENT_FILES = 10;

/**
 * Orchestrates the retrieval of relevant code context for AI prompts.
 * It combines semantic search with heuristics like recent files and user selections.
 */
export class ContextRetriever {
    private recentFiles: vscode.Uri[] = [];

    constructor(
        private embeddingManager: EmbeddingManager,
        private codeParser: CodeParser
    ) {
        this.subscribeToEditorChanges();
    }

    /**
     * The main entry point for retrieving context.
     * @param options The options defining how to retrieve context.
     * @returns A promise resolving to the retrieved context, or null if none is found.
     */
    public async retrieve(options: ContextRetrievalOptions): Promise<RetrievedContext | null> {
        let chunks: CodeChunk[] = [];
        const topK = options.topK ?? 5;

        // User selection is the highest priority context
        const selectionContext = await this.retrieveSelectionContext();
        if (selectionContext) {
            logger.log('Using selection as primary context.');
            chunks = selectionContext;
            options.strategy = 'selection';
        } else {
            switch (options.strategy) {
                case 'semantic':
                    chunks = await this.retrieveSemanticContext(options.query, topK);
                    break;
                case 'local':
                    chunks = await this.retrieveLocalContext();
                    break;
            }
        }

        if (chunks.length === 0) {
            return null;
        }
        
        // TODO: Implement dependency expansion for a more complete context.
        // chunks = await this.expandWithDependencies(chunks);

        const contextString = this.buildContextString(chunks);

        return {
            strategy: options.strategy,
            chunks,
            contextString,
        };
    }

    /**
     * Listens for active editor changes to maintain a list of recent files.
     */
    private subscribeToEditorChanges() {
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor && editor.document.uri) {
                const uri = editor.document.uri;
                // Remove if already exists to move it to the front
                const index = this.recentFiles.findIndex(u => u.fsPath === uri.fsPath);
                if (index > -1) {
                    this.recentFiles.splice(index, 1);
                }
                
                // Add to the front of the list
                this.recentFiles.unshift(uri);

                // Keep the list trimmed to a max size
                if (this.recentFiles.length > MAX_RECENT_FILES) {
                    this.recentFiles.pop();
                }
            }
        });
    }

    private async retrieveSemanticContext(query: string, topK: number): Promise<CodeChunk[]> {
        const searchResults = await this.embeddingManager.search(query, topK * 2); // Get more results to allow for boosting

        // Boost score for recently accessed files
        const boostedResults = searchResults.map((result: { chunk: CodeChunk; similarity: number }) => {
            const recentIndex = this.recentFiles.findIndex(u => u.fsPath === result.chunk.uri.fsPath);
            if (recentIndex !== -1) {
                // Boost score based on recency (higher boost for more recent files)
                const boost = (MAX_RECENT_FILES - recentIndex) / MAX_RECENT_FILES * 0.2; // Max 20% boost
                result.similarity += boost;
            }
            return result;
        });

        boostedResults.sort((a: { chunk: CodeChunk; similarity: number }, b: { chunk: CodeChunk; similarity: number }) => b.similarity - a.similarity);

        return boostedResults.slice(0, topK).map((r: { chunk: CodeChunk; similarity: number }) => r.chunk);
    }

    private async retrieveLocalContext(): Promise<CodeChunk[]> {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) return [];

        const uri = activeEditor.document.uri;
        const fileStructure = await this.codeParser.parse(uri);
        if (!fileStructure || !fileStructure.symbols) return [];
        
        const content = activeEditor.document.getText();
        
        return fileStructure.symbols.map(symbol => ({
            id: `${uri.fsPath}#${symbol.name}`,
            uri,
            symbol,
            content: content.substring(
                activeEditor.document.offsetAt(symbol.start),
                activeEditor.document.offsetAt(symbol.end)
            )
        }));
    }

    private async retrieveSelectionContext(): Promise<CodeChunk[] | null> {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor || activeEditor.selection.isEmpty) {
            return null;
        }

        const selection = activeEditor.selection;
        const text = activeEditor.document.getText(selection);

        const chunk: CodeChunk = {
            id: `${activeEditor.document.uri.fsPath}#selection`,
            uri: activeEditor.document.uri,
            content: text,
            symbol: { // Create a temporary symbol for the selection
                name: 'selection',
                type: 'variable', // Placeholder type
                start: selection.start,
                end: selection.end,
            }
        };

        return [chunk];
    }
    
    /**
     * Formats an array of code chunks into a single string for the AI prompt.
     */
    private buildContextString(chunks: CodeChunk[]): string {
        return chunks.map(chunk => {
            const relativePath = vscode.workspace.asRelativePath(chunk.uri);
            const startLine = chunk.symbol.start.line + 1;
            const endLine = chunk.symbol.end.line + 1;
            return `
// File: ${relativePath}
// Lines: ${startLine}-${endLine}
// Symbol: ${chunk.symbol.name}
\`\`\`${this.getLanguageIdForFile(chunk.uri)}
${chunk.content}
\`\`\`
`;
        }).join('\n---\n');
    }

    private getLanguageIdForFile(uri: vscode.Uri): string {
        const extension = uri.path.split('.').pop() || '';
        const langMap: { [key: string]: string } = {
            'ts': 'typescript',
            'js': 'javascript',
            'py': 'python',
            'java': 'java',
            'md': 'markdown',
        };
        return langMap[extension] || '';
    }
}
