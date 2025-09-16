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
exports.ContextRetriever = void 0;
const vscode = __importStar(require("vscode"));
const logger_1 = require("../utils/logger");
const MAX_RECENT_FILES = 10;
/**
 * Orchestrates the retrieval of relevant code context for AI prompts.
 * It combines semantic search with heuristics like recent files and user selections.
 */
class ContextRetriever {
    constructor(embeddingManager, codeParser) {
        this.embeddingManager = embeddingManager;
        this.codeParser = codeParser;
        this.recentFiles = [];
        this.subscribeToEditorChanges();
    }
    /**
     * The main entry point for retrieving context.
     * @param options The options defining how to retrieve context.
     * @returns A promise resolving to the retrieved context, or null if none is found.
     */
    async retrieve(options) {
        let chunks = [];
        const topK = options.topK ?? 5;
        // User selection is the highest priority context
        const selectionContext = await this.retrieveSelectionContext();
        if (selectionContext) {
            logger_1.logger.log('Using selection as primary context.');
            chunks = selectionContext;
            options.strategy = 'selection';
        }
        else {
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
    subscribeToEditorChanges() {
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
    async retrieveSemanticContext(query, topK) {
        const searchResults = await this.embeddingManager.search(query, topK * 2); // Get more results to allow for boosting
        // Boost score for recently accessed files
        const boostedResults = searchResults.map(result => {
            const recentIndex = this.recentFiles.findIndex(u => u.fsPath === result.chunk.uri.fsPath);
            if (recentIndex !== -1) {
                // Boost score based on recency (higher boost for more recent files)
                const boost = (MAX_RECENT_FILES - recentIndex) / MAX_RECENT_FILES * 0.2; // Max 20% boost
                result.similarity += boost;
            }
            return result;
        });
        boostedResults.sort((a, b) => b.similarity - a.similarity);
        return boostedResults.slice(0, topK).map(r => r.chunk);
    }
    async retrieveLocalContext() {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor)
            return [];
        const uri = activeEditor.document.uri;
        const fileStructure = await this.codeParser.parse(uri);
        if (!fileStructure || !fileStructure.symbols)
            return [];
        const content = activeEditor.document.getText();
        return fileStructure.symbols.map(symbol => ({
            id: `${uri.fsPath}#${symbol.name}`,
            uri,
            symbol,
            content: content.substring(activeEditor.document.offsetAt(symbol.start), activeEditor.document.offsetAt(symbol.end))
        }));
    }
    async retrieveSelectionContext() {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor || activeEditor.selection.isEmpty) {
            return null;
        }
        const selection = activeEditor.selection;
        const text = activeEditor.document.getText(selection);
        const chunk = {
            id: `${activeEditor.document.uri.fsPath}#selection`,
            uri: activeEditor.document.uri,
            content: text,
            symbol: {
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
    buildContextString(chunks) {
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
    getLanguageIdForFile(uri) {
        const extension = uri.path.split('.').pop() || '';
        const langMap = {
            'ts': 'typescript',
            'js': 'javascript',
            'py': 'python',
            'java': 'java',
            'md': 'markdown',
        };
        return langMap[extension] || '';
    }
}
exports.ContextRetriever = ContextRetriever;
//# sourceMappingURL=contextRetriever.js.map