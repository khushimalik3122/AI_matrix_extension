import * as vscode from 'vscode';
import { CodeSymbol } from './codeAnalysis';

/**
 * Represents a chunk of code to be embedded.
 * This is the unit of retrieval for our similarity search.
 */
export interface CodeChunk {
    id: string; // Unique identifier, e.g., `${uri.fsPath}#${symbol.name}`
    uri: vscode.Uri;
    content: string;
    symbol: CodeSymbol;
}

/**
 * Represents a vector embedding with its associated metadata.
 */
export interface Vector {
    id: string;
    vector: number[];
    chunk: CodeChunk;
}

/**
 * Represents a result from a similarity search.
 */
export interface SimilaritySearchResult {
    chunk: CodeChunk;
    similarity: number;
}

/**
 * Internal vector store item shape used by EmbeddingManager.
 */
export interface VectorStoreItem {
    uri: string;
    chunk: CodeChunk;
    embedding: number[];
}
