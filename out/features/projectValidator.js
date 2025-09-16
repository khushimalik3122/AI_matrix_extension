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
exports.InlineCompletionProvider = void 0;
const vscode = __importStar(require("vscode"));
const logger_1 = require("../utils/logger");
const completionCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
class InlineCompletionProvider {
    // ... (constructor and other methods)
    async fetchCompletions(document, position, context) {
        // ... (initial checks)
        const cacheKey = this.generateCacheKey(document, position);
        const cached = completionCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
            logger_1.logger.log("Returning cached completion.");
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
        }
        catch (error) {
            logger_1.logger.error(`Error during inline completion: ${error.message}`);
            return;
        }
    }
    cleanupCache() {
        const now = Date.now();
        for (const [key, value] of completionCache.entries()) {
            if (now - value.timestamp > CACHE_TTL_MS) {
                completionCache.delete(key);
            }
        }
    }
}
exports.InlineCompletionProvider = InlineCompletionProvider;
//# sourceMappingURL=projectValidator.js.map