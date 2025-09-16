import * as vscode from 'vscode';
import { ProviderManager } from './providerManager';
import { ContextRetriever } from './contextRetriever';
import { logger } from '../utils/logger';

interface CacheItem {
    items: vscode.InlineCompletionItem[];
    timestamp: number;
}
const completionCache = new Map<string, CacheItem>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export class InlineCompletionProvider implements vscode.InlineCompletionItemProvider {
    // ... (constructor and other methods)

    private async fetchCompletions(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext
    ): Promise<vscode.InlineCompletionItem[] | undefined> {
        // ... (initial checks)

        const cacheKey = this.generateCacheKey(document, position);
        const cached = completionCache.get(cacheKey);

        if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
            logger.log("Returning cached completion.");
            return cached.items;
        }

        try {
            // ... (rest of the fetch logic)
            const result = [new vscode.InlineCompletionItem(cleanCompletion)];
            
            // Update cache with timestamp
            completionCache.set(cacheKey, { items: result, timestamp: Date.now() });
            
            // Clean up old cache entries occasionally
            if (Math.random() < 0.1) {
                this.cleanupCache();
            }

            return result;

        } catch (error: any) {
            logger.error(`Error during inline completion: ${error.message}`);
            return;
        }
    }
    
    private cleanupCache() {
        const now = Date.now();
        for (const [key, value] of completionCache.entries()) {
            if (now - value.timestamp > CACHE_TTL_MS) {
                completionCache.delete(key);
            }
        }
    }
    
    // ... (rest of the class)
}

