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
exports.BatchProcessor = void 0;
const vscode = __importStar(require("vscode"));
const logger_1 = require("../utils/logger");
class BatchProcessor {
    constructor(providerManager) {
        this.providerManager = providerManager;
    }
    /**
     * Performs a large-scale, AI-driven code migration across multiple files.
     * @param instruction A natural language description of the migration (e.g., "Migrate from Jest to Vitest").
     * @param fileGlob A glob pattern for the files to include (e.g., "** / *.test.ts").
     * @param excludeGlob An optional glob pattern for files to exclude.
     */
    async migrateCode(instruction, fileGlob, excludeGlob) {
        await this.processWorkspace(`AI Code Migration: ${instruction}`, fileGlob, excludeGlob, async (document) => {
            const prompt = `
                    You are an expert software engineer performing a code migration.
                    Your task is to rewrite the following file content based on the migration instruction.
                    Return only the full, updated content of the file. Do not include any explanations or markdown formatting.

                    Migration Instruction: "${instruction}"

                    Original File Content (${document.languageId}):
                    ---
                    ${document.getText()}
                    ---
                `;
            const newContent = await this.providerManager.generateResponse(prompt, { temperature: 0.0 });
            // Replace the entire document content with the AI's response
            const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
            return [vscode.TextEdit.replace(fullRange, newContent || '')];
        });
    }
    /**
     * Performs a global search and replace across the workspace.
     * @param searchTerm The string or regex pattern to find.
     * @param replacementTerm The string to replace matches with.
     * @param fileGlob A glob pattern for the files to include.
     * @param excludeGlob An optional glob pattern for files to exclude.
     */
    async globalReplace(searchTerm, replacementTerm, fileGlob, excludeGlob) {
        await this.processWorkspace(`Global Replace: '${searchTerm}' -> '${replacementTerm}'`, fileGlob, excludeGlob, (document) => {
            const edits = [];
            const text = document.getText();
            const regex = new RegExp(searchTerm, 'g');
            let match;
            while ((match = regex.exec(text)) !== null) {
                const startPos = document.positionAt(match.index);
                const endPos = document.positionAt(match.index + match[0].length);
                const range = new vscode.Range(startPos, endPos);
                edits.push(vscode.TextEdit.replace(range, replacementTerm));
            }
            return edits;
        });
    }
    /**
     * A generic workspace processor that finds files, applies a transformation, and stages the edits.
     * @param taskTitle The title to show in the progress notification.
     * @param fileGlob The glob pattern for files to process.
     * @param excludeGlob The glob pattern for files to exclude.
     * @param fileProcessor A function that takes a TextDocument and returns a promise of TextEdit[].
     */
    async processWorkspace(taskTitle, fileGlob, excludeGlob, fileProcessor) {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: taskTitle,
            cancellable: true,
        }, async (progress, token) => {
            const workspaceEdit = new vscode.WorkspaceEdit();
            const files = await vscode.workspace.findFiles(fileGlob, excludeGlob, undefined, token);
            if (token.isCancellationRequested)
                return;
            for (let i = 0; i < files.length; i++) {
                if (token.isCancellationRequested)
                    return;
                const fileUri = files[i];
                progress.report({ message: `Processing ${vscode.workspace.asRelativePath(fileUri)}`, increment: 100 / files.length });
                try {
                    const document = await vscode.workspace.openTextDocument(fileUri);
                    const edits = await fileProcessor(document);
                    if (edits.length > 0) {
                        workspaceEdit.set(fileUri, edits);
                    }
                }
                catch (error) {
                    logger_1.logger.error(`Failed to process file ${fileUri.fsPath}: ${error.message}`);
                }
            }
            if (workspaceEdit.size === 0) {
                vscode.window.showInformationMessage("Batch operation complete. No changes were needed.");
                return;
            }
            const selection = await vscode.window.showInformationMessage(`This batch operation will modify ${workspaceEdit.size} files. Do you want to apply these changes?`, { modal: true }, 'Apply Changes');
            if (selection === 'Apply Changes') {
                await vscode.workspace.applyEdit(workspaceEdit);
                vscode.window.showInformationMessage(`Successfully applied changes to ${workspaceEdit.size} files.`);
            }
            else {
                vscode.window.showInformationMessage("Batch operation cancelled.");
            }
        });
    }
}
exports.BatchProcessor = BatchProcessor;
//# sourceMappingURL=batchProcessor.js.map