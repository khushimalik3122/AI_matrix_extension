import * as vscode from 'vscode';
import { logger } from '../utils/logger';
import { CodeParser } from './codeParser';
import { VectorStoreItem } from '../types/embedding';

// Define a type for the pipeline function for clarity
type Pipeline = (text: string, options: { pooling: 'mean', normalize: boolean }) => Promise<any>;

const CACHE_KEY = 'embeddingVectorStore';
const MAX_RETRIES = 3;

export class EmbeddingManager {
    private model: Pipeline | null = null;
    private modelPromise: Promise<Pipeline> | null = null;
    private vectorStore = new Map<string, VectorStoreItem>();
    private isDegraded: boolean = false; // Flag for graceful degradation

    constructor(private codeParser: CodeParser, private context: vscode.ExtensionContext) {
        this.loadFromCache();
    }

    private async getModel(retryCount = 0): Promise<Pipeline> {
        if (this.isDegraded) {
            throw new Error("Embedding model is in a degraded state. Cannot perform operation.");
        }
        if (this.model) {
            return this.model;
        }
        if (this.modelPromise) {
            return this.modelPromise;
        }

        logger.log("Lazy loading embedding model...");
        this.modelPromise = new Promise(async (resolve, reject) => {
            try {
                // Use a dynamic import to lazy load the heavy library
                const { pipeline } = await import('@xenova/transformers');
                // The progress callback can be hooked to a status bar item if needed
                const model = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
                    progress_callback: (progress: any) => {
                        logger.log(`Downloading embedding model... ${Math.round(progress.progress)}%`);
                    }
                });
                this.model = model;
                this.modelPromise = null;
                logger.log("Embedding model loaded successfully.");
                resolve(model);
            } catch (error) {
                logger.error(`Failed to load embedding model (Attempt ${retryCount + 1}/${MAX_RETRIES}):`, error);
                this.modelPromise = null;

                if (retryCount < MAX_RETRIES - 1) {
                    const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
                    logger.log(`Retrying in ${delay}ms...`);
                    setTimeout(() => resolve(this.getModel(retryCount + 1)), delay);
                } else {
                    this.isDegraded = true;
                    vscode.window.showErrorMessage(
                        'AI Embedding Features Failed: Could not download the AI model. Code search and context features will be disabled.',
                        'Retry'
                    ).then(selection => {
                        if (selection === 'Retry') {
                            this.isDegraded = false;
                            // Reset and try again, fire and forget
                            this.getModel().catch(() => {});
                        }
                    });
                    reject(new Error("Failed to load embedding model after multiple retries."));
                }
            }
        });
        return this.modelPromise;
    }

    /**
     * Processes and stores embeddings for a file.
     * Debounced in the CodebaseScanner to handle rapid changes.
     */
    public async addOrUpdateFile(uri: vscode.Uri): Promise<void> {
        if (this.isDegraded) {
            logger.warn("Skipping embedding update: model is in a degraded state.");
            return;
        }
        try {
            const structure = await this.codeParser.parse(uri);
            if (!structure) return;

            const chunks = this.codeParser.chunk(structure);
            for (const chunk of chunks) {
                const embedding = await this.generateEmbedding(chunk.content);
                this.vectorStore.set(`${uri.toString()}#${chunk.id}`, { uri: uri.toString(), chunk, embedding });
            }
            logger.log(`Updated embeddings for ${vscode.workspace.asRelativePath(uri)}`);
            await this.saveToCache();
        } catch (error: any) {
            logger.error(`Failed to process file for embeddings ${uri.fsPath}: ${error.message}`);
            // Individual file processing errors are logged but don't show a UI popup to avoid noise.
        }
    }

    public async removeFile(uri: vscode.Uri): Promise<void> {
        const keysToDelete = Array.from(this.vectorStore.keys()).filter(key => key.startsWith(uri.toString()));
        keysToDelete.forEach(key => this.vectorStore.delete(key));
        logger.log(`Removed embeddings for ${vscode.workspace.asRelativePath(uri)}`);
        await this.saveToCache();
    }

    private async generateEmbedding(text: string): Promise<number[]> {
        const model = await this.getModel();
        const output = await model(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
    }

    /**
     * Finds the top N most similar code chunks to a query embedding.
     */
    public async findSimilar(queryText: string, topN: number): Promise<VectorStoreItem[]> {
        if (this.isDegraded) {
            logger.warn("Skipping similarity search: model is in a degraded state.");
            return [];
        }
        if (this.vectorStore.size === 0) return [];
        
        try {
            const queryEmbedding = await this.generateEmbedding(queryText);
            
            const similarities = Array.from(this.vectorStore.values()).map(item => {
                const similarity = this.cosineSimilarity(queryEmbedding, item.embedding);
                return { item, similarity };
            });

            similarities.sort((a, b) => b.similarity - a.similarity);
            return similarities.slice(0, topN).map(s => s.item);
        } catch (error) {
            logger.error("Error during similarity search:", error);
            return [];
        }
    }

    private cosineSimilarity(vecA: number[], vecB: number[]): number {
        let dotProduct = 0;
        let magA = 0;
        let magB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            magA += vecA[i] * vecA[i];
            magB += vecB[i] * vecB[i];
        }
        magA = Math.sqrt(magA);
        magB = Math.sqrt(magB);
        return magA > 0 && magB > 0 ? dotProduct / (magA * magB) : 0;
    }
    
    // --- Caching Logic ---
    private async saveToCache(): Promise<void> {
        const serializable = Array.from(this.vectorStore.entries());
        await this.context.workspaceState.update(CACHE_KEY, serializable);
    }
    
    private async loadFromCache(): Promise<void> {
        const cachedData = this.context.workspaceState.get<[string, VectorStoreItem][]>(CACHE_KEY);
        if (cachedData) {
            this.vectorStore = new Map(cachedData);
            logger.log(`Loaded ${this.vectorStore.size} embeddings from workspace cache.`);
        }
    }
}

