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
exports.FileGenerator = void 0;
const vscode = __importStar(require("vscode"));
const logger_1 = require("../utils/logger");
class FileGenerator {
    /**
     * Creates the entire project structure from a detailed blueprint.
     * @param blueprint The detailed technical plan for the project.
     * @param rootUri The URI of the root folder where the project should be created.
     * @returns A promise that resolves to true if generation was successful, false otherwise.
     */
    async generateProject(blueprint, rootUri) {
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Generating project: ${blueprint.fileStructure[0]?.path.split('/')[0] || 'New Project'}`,
            cancellable: false
        }, async (progress) => {
            try {
                const totalFiles = blueprint.fileStructure.length;
                progress.report({ message: `Creating ${totalFiles} files...`, increment: 0 });
                for (let i = 0; i < totalFiles; i++) {
                    const fileSpec = blueprint.fileStructure[i];
                    const increment = 100 / totalFiles;
                    progress.report({ message: `Creating ${fileSpec.path}`, increment });
                    const fileUri = vscode.Uri.joinPath(rootUri, fileSpec.path);
                    // Ensure the parent directory exists
                    const dirUri = vscode.Uri.joinPath(fileUri, '..');
                    await vscode.workspace.fs.createDirectory(dirUri);
                    // Write the file content
                    const contentBytes = new TextEncoder().encode(fileSpec.content);
                    await vscode.workspace.fs.writeFile(fileUri, contentBytes);
                }
                logger_1.logger.log('Project generation completed successfully.');
                vscode.window.showInformationMessage('Project generated successfully!');
                // Suggest installing dependencies if a package.json was created
                if (blueprint.dependencies.length > 0 && blueprint.fileStructure.some(f => f.path.endsWith('package.json'))) {
                    const selection = await vscode.window.showInformationMessage('Project scaffolded. Would you like to install dependencies now?', 'Yes, run npm install', 'No, I\'ll do it later');
                    if (selection === 'Yes, run npm install') {
                        const terminal = vscode.window.createTerminal({ name: 'Project Setup' });
                        terminal.show();
                        terminal.sendText(`cd "${rootUri.fsPath}" && npm install`);
                    }
                }
                return true;
            }
            catch (error) {
                logger_1.logger.error(`Failed to generate project: ${error.message}`);
                vscode.window.showErrorMessage(`Project generation failed: ${error.message}`);
                return false;
            }
        });
    }
}
exports.FileGenerator = FileGenerator;
//# sourceMappingURL=fileGenerator.js.map