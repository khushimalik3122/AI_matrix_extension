import * as vscode from 'vscode';
import { CodeChunk } from './embedding';

/**
 * Defines the strategy for retrieving context.
 * - 'semantic': Use vector search to find relevant code across the workspace.
 * - 'local': Use the content of the currently active file.
 * - 'selection': Use only the user's currently selected text.
 */
export type ContextStrategy = 'local' | 'semantic' | 'selection';

/**
 * Options for a context retrieval operation.
 */
export interface ContextRetrievalOptions {
    query: string;
    strategy: ContextStrategy;
    topK?: number;
}

/**
 * The final retrieved context package, ready to be sent to an AI provider.
 */
export interface RetrievedContext {
    strategy: ContextStrategy;
    chunks: CodeChunk[];
    /**
     * The final, formatted string of context to be included in the AI prompt.
     */
    contextString: string;
}
