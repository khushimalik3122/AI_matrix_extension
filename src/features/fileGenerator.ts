import * as vscode from 'vscode';
import { DetailedBlueprint } from '../types/projectGeneration';
import { logger } from '../utils/logger';

export class FileGenerator {
    /**
     * Creates the entire project structure from a detailed blueprint.
     * @param blueprint The detailed technical plan for the project.
     * @param rootUri The URI of the root folder where the project should be created.
     * @returns A promise that resolves to true if generation was successful, false otherwise.
     */
    public async generateProject(blueprint: DetailedBlueprint, rootUri: vscode.Uri): Promise<boolean> {
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

                logger.log('Project generation completed successfully.');
                vscode.window.showInformationMessage('Project generated successfully!');

                // Suggest installing dependencies if a package.json was created
                if (blueprint.dependencies.length > 0 && blueprint.fileStructure.some(f => f.path.endsWith('package.json'))) {
                    const selection = await vscode.window.showInformationMessage(
                        'Project scaffolded. Would you like to install dependencies now?',
                        'Yes, run npm install', 'No, I\'ll do it later'
                    );
                    if (selection === 'Yes, run npm install') {
                        const terminal = vscode.window.createTerminal({ name: 'Project Setup' });
                        terminal.show();
                        terminal.sendText(`cd "${rootUri.fsPath}" && npm install`);
                    }
                }

                return true;
            } catch (error: any) {
                logger.error(`Failed to generate project: ${error.message}`);
                vscode.window.showErrorMessage(`Project generation failed: ${error.message}`);
                return false;
            }
        });
    }
}
