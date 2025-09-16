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
exports.EmbeddingManager = void 0;
const vscode = __importStar(require("vscode"));
const logger_1 = require("../utils/logger");
const CACHE_KEY = 'embeddingVectorStore';
const MAX_RETRIES = 3;
class EmbeddingManager {
    constructor(codeParser, context) {
        this.codeParser = codeParser;
        this.context = context;
        this.model = null;
        this.modelPromise = null;
        this.vectorStore = new Map();
        this.isDegraded = false; // Flag for graceful degradation
        this.loadFromCache();
    }
    async getModel(retryCount = 0) {
        if (this.isDegraded) {
            throw new Error("Embedding model is in a degraded state. Cannot perform operation.");
        }
        if (this.model) {
            return this.model;
        }
        if (this.modelPromise) {
            return this.modelPromise;
        }
        logger_1.logger.log("Lazy loading embedding model...");
        this.modelPromise = new Promise(async (resolve, reject) => {
            try {
                // Use a dynamic import to lazy load the heavy library
                const { pipeline } = await Promise.resolve().then(() => __importStar(require('@xenova/transformers')));
                // The progress callback can be hooked to a status bar item if needed
                const model = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
                    progress_callback: (progress) => {
                        logger_1.logger.log(`Downloading embedding model... ${Math.round(progress.progress)}%`);
                    }
                });
                this.model = model;
                this.modelPromise = null;
                logger_1.logger.log("Embedding model loaded successfully.");
                resolve(model);
            }
            catch (error) {
                logger_1.logger.error(`Failed to load embedding model (Attempt ${retryCount + 1}/${MAX_RETRIES}):`, error);
                this.modelPromise = null;
                if (retryCount < MAX_RETRIES - 1) {
                    const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
                    logger_1.logger.log(`Retrying in ${delay}ms...`);
                    setTimeout(() => resolve(this.getModel(retryCount + 1)), delay);
                }
                else {
                    this.isDegraded = true;
                    vscode.window.showErrorMessage('AI Embedding Features Failed: Could not download the AI model. Code search and context features will be disabled.', 'Retry').then(selection => {
                        if (selection === 'Retry') {
                            this.isDegraded = false;
                            // Reset and try again, fire and forget
                            this.getModel().catch(() => { });
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
    async addOrUpdateFile(uri) {
        if (this.isDegraded) {
            logger_1.logger.log("Skipping embedding update: model is in a degraded state.");
            return;
        }
        try {
            const structure = await this.codeParser.parse(uri);
            if (!structure)
                return;
            const chunks = this.codeParser.chunkCode(structure);
            for (const chunk of chunks) {
                const embedding = await this.generateEmbedding(chunk.content);
                this.vectorStore.set(`${uri.toString()}#${chunk.id}`, { uri: uri.toString(), chunk, embedding });
            }
            logger_1.logger.log(`Updated embeddings for ${vscode.workspace.asRelativePath(uri)}`);
            await this.saveToCache();
        }
        catch (error) {
            logger_1.logger.error(`Failed to process file for embeddings ${uri.fsPath}: ${error.message}`);
            // Individual file processing errors are logged but don't show a UI popup to avoid noise.
        }
    }
    async removeFile(uri) {
        const keysToDelete = Array.from(this.vectorStore.keys()).filter(key => key.startsWith(uri.toString()));
        keysToDelete.forEach(key => this.vectorStore.delete(key));
        logger_1.logger.log(`Removed embeddings for ${vscode.workspace.asRelativePath(uri)}`);
        await this.saveToCache();
    }
    async generateEmbedding(text) {
        const model = await this.getModel();
        const output = await model(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
    }
    /**
     * Performs a semantic search and returns scored chunks.
     */
    async search(queryText, topN) {
        if (this.isDegraded) {
            logger_1.logger.log("Skipping similarity search: model is in a degraded state.");
            return [];
        }
        if (this.vectorStore.size === 0)
            return [];
        try {
            const queryEmbedding = await this.generateEmbedding(queryText);
            const similarities = Array.from(this.vectorStore.values()).map(item => {
                const similarity = this.cosineSimilarity(queryEmbedding, item.embedding);
                return { chunk: item.chunk, similarity };
            });
            similarities.sort((a, b) => b.similarity - a.similarity);
            return similarities.slice(0, topN);
        }
        catch (error) {
            logger_1.logger.error("Error during similarity search:", error);
            return [];
        }
    }
    /**
     * Finds the top N most similar code chunks to a query embedding and returns raw vector store items.
     * Kept for backward compatibility.
     */
    async findSimilar(queryText, topN) {
        const results = await this.search(queryText, topN);
        // Map back to vector store items by matching ids
        const itemsById = new Map(Array.from(this.vectorStore.entries()).map(([key, val]) => [val.chunk.id, val]));
        return results.map(r => itemsById.get(r.chunk.id)).filter(Boolean);
    }
    cosineSimilarity(vecA, vecB) {
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
    async saveToCache() {
        const serializable = Array.from(this.vectorStore.entries());
        await this.context.workspaceState.update(CACHE_KEY, serializable);
    }
    async loadFromCache() {
        const cachedData = this.context.workspaceState.get(CACHE_KEY);
        if (cachedData) {
            this.vectorStore = new Map(cachedData);
            logger_1.logger.log(`Loaded ${this.vectorStore.size} embeddings from workspace cache.`);
        }
    }
}
exports.EmbeddingManager = EmbeddingManager;
//# sourceMappingURL=embeddingManager.js.map