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
exports.CodebaseScanner = void 0;
const vscode = __importStar(require("vscode"));
class CodebaseScanner {
    constructor() {
        this.watcher = null;
        this.onDidUpdateFilesEmitter = new vscode.EventEmitter();
        this.onDidRemoveFilesEmitter = new vscode.EventEmitter();
        this.onDidUpdateFiles = this.onDidUpdateFilesEmitter.event;
        this.onDidRemoveFiles = this.onDidRemoveFilesEmitter.event;
        // --- Debouncing state ---
        this.changedFiles = new Set();
        this.removedFiles = new Set();
        this.debounceTimer = null;
        // ... (rest of the class remains the same)
        // ... findRelevantFiles, isBinary, etc.
    }
    scanAndWatch() {
        this.initialScan();
        this.setupWatcher();
    }
    async initialScan() {
        // This process can be slow, so run it as a background task.
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "AI Extension: Indexing workspace...",
            cancellable: true,
        }, async (progress, token) => {
            const uris = await this.findRelevantFiles(token);
            if (!token.isCancellationRequested) {
                progress.report({ message: `Found ${uris.length} files to process.` });
                this.onDidUpdateFilesEmitter.fire(uris);
            }
        });
    }
    setupWatcher() {
        this.watcher = vscode.workspace.createFileSystemWatcher('**/*');
        this.watcher.onDidChange(uri => this.handleFileChange(uri));
        this.watcher.onDidCreate(uri => this.handleFileChange(uri));
        this.watcher.onDidDelete(uri => this.handleFileRemove(uri));
    }
    handleFileChange(uri) {
        this.changedFiles.add(uri);
        this.resetDebounceTimer();
    }
    handleFileRemove(uri) {
        this.removedFiles.add(uri);
        this.resetDebounceTimer();
    }
    resetDebounceTimer() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(() => {
            this.processDebouncedEvents();
        }, 1000); // Wait 1 second after the last change to process
    }
    processDebouncedEvents() {
        if (this.changedFiles.size > 0) {
            this.onDidUpdateFilesEmitter.fire(Array.from(this.changedFiles));
            this.changedFiles.clear();
        }
        if (this.removedFiles.size > 0) {
            this.onDidRemoveFilesEmitter.fire(Array.from(this.removedFiles));
            this.removedFiles.clear();
        }
    }
}
exports.CodebaseScanner = CodebaseScanner;
//# sourceMappingURL=codebaseScanner.js.map