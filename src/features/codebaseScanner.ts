import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import ignore from 'ignore';
import { logger } from '../utils/logger';

export class CodebaseScanner {
    private watcher: vscode.FileSystemWatcher | null = null;
    private onDidUpdateFilesEmitter = new vscode.EventEmitter<vscode.Uri[]>();
    private onDidRemoveFilesEmitter = new vscode.EventEmitter<vscode.Uri[]>();

    public readonly onDidUpdateFiles = this.onDidUpdateFilesEmitter.event;
    public readonly onDidRemoveFiles = this.onDidRemoveFilesEmitter.event;

    // --- Debouncing state ---
    private changedFiles = new Set<vscode.Uri>();
    private removedFiles = new Set<vscode.Uri>();
    private debounceTimer: NodeJS.Timeout | null = null;

    public scanAndWatch() {
        this.initialScan();
        this.setupWatcher();
    }

    private async initialScan() {
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

    private setupWatcher() {
        this.watcher = vscode.workspace.createFileSystemWatcher('**/*');
        
        this.watcher.onDidChange(uri => this.handleFileChange(uri));
        this.watcher.onDidCreate(uri => this.handleFileChange(uri));
        this.watcher.onDidDelete(uri => this.handleFileRemove(uri));
    }

    private handleFileChange(uri: vscode.Uri) {
        this.changedFiles.add(uri);
        this.resetDebounceTimer();
    }

    private handleFileRemove(uri: vscode.Uri) {
        this.removedFiles.add(uri);
        this.resetDebounceTimer();
    }

    private resetDebounceTimer() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(() => {
            this.processDebouncedEvents();
        }, 1000); // Wait 1 second after the last change to process
    }

    private processDebouncedEvents() {
        if (this.changedFiles.size > 0) {
            this.onDidUpdateFilesEmitter.fire(Array.from(this.changedFiles));
            this.changedFiles.clear();
        }
        if (this.removedFiles.size > 0) {
            this.onDidRemoveFilesEmitter.fire(Array.from(this.removedFiles));
            this.removedFiles.clear();
        }
    }
    
    // ... (rest of the class remains the same)
    // ... findRelevantFiles, isBinary, etc.

    /**
     * Finds relevant files in the workspace, optionally respecting cancellation.
     * @param token Cancellation token
     * @returns Promise resolving to an array of vscode.Uri
     */
    public async findRelevantFiles(token?: vscode.CancellationToken): Promise<vscode.Uri[]> {
        const uris: vscode.Uri[] = [];
        const exclude = await this.getIgnorePatterns();

        for (const folder of vscode.workspace.workspaceFolders || []) {
            if (token?.isCancellationRequested) {
                break;
            }
            const files = await vscode.workspace.findFiles(
                new vscode.RelativePattern(folder, '**/*'),
                exclude.length > 0 ? `{${exclude.join(',')}}` : undefined
            );
            uris.push(...files);
        }
        return uris;
    }

    /**
     * Reads .gitignore and other ignore files to build an array of glob patterns to exclude.
     */
    private async getIgnorePatterns(): Promise<string[]> {
        const patterns: string[] = [];
        for (const folder of vscode.workspace.workspaceFolders || []) {
            const gitignorePath = path.join(folder.uri.fsPath, '.gitignore');
            if (fs.existsSync(gitignorePath)) {
                const content = fs.readFileSync(gitignorePath, 'utf8');
                const ig = ignore().add(content);
                // Use the lines from .gitignore directly as patterns
                const gitignorePatterns = content
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line && !line.startsWith('#'));
                patterns.push(...gitignorePatterns);
            }
        }
        // Add common binary and node_modules exclusions
        patterns.push('**/node_modules/**', '**/*.exe', '**/*.dll', '**/*.bin');
        return patterns;
    }
}

