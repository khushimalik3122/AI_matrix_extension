import * as vscode from 'vscode';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { logger } from '../utils/logger';

// --- Handlebars Helpers ---
// Register helpers for common casing needs in file/variable names.
Handlebars.registerHelper('pascalCase', (str: string) => 
    str.replace(/(\w)(\w*)/g, (g0, g1, g2) => g1.toUpperCase() + g2.toLowerCase()).replace(/\s+/g, '')
);
Handlebars.registerHelper('camelCase', (str: string) => 
    Handlebars.helpers.pascalCase(str).replace(/^./, (g0) => g0.toLowerCase())
);
Handlebars.registerHelper('kebabCase', (str: string) => 
    str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase().replace(/\s+/g, '-')
);


export class TemplateEngine {
    private templatesRoot: vscode.Uri;

    /**
     * @param extensionUri The URI of the extension's root directory.
     */
    constructor(private extensionUri: vscode.Uri) {
        this.templatesRoot = vscode.Uri.joinPath(extensionUri, 'templates');
    }

    /**
     * Renders a project template into a target directory.
     * @param templateName The name of the template folder inside the 'templates' directory.
     * @param targetRootUri The URI where the project should be generated.
     * @param context An object containing variables to be used in the templates.
     * @returns A promise that resolves to true on success, false on failure.
     */
    public async render(templateName: string, targetRootUri: vscode.Uri, context: Record<string, any>): Promise<boolean> {
        const templateDirUri = vscode.Uri.joinPath(this.templatesRoot, templateName);
        
        try {
            // Check if template directory exists
            await vscode.workspace.fs.stat(templateDirUri);
            
            await this.processDirectory(templateDirUri, targetRootUri, context);
            logger.log(`Template '${templateName}' rendered successfully.`);
            return true;
        } catch (error) {
            if (error instanceof vscode.FileSystemError && error.code === 'FileNotFound') {
                logger.error(`Template directory not found: ${templateDirUri.fsPath}`);
                vscode.window.showErrorMessage(`Template '${templateName}' does not exist.`);
            } else {
                logger.error(`Failed to render template '${templateName}': ${error}`);
                vscode.window.showErrorMessage(`An error occurred while rendering the template.`);
            }
            return false;
        }
    }

    private async processDirectory(templateDirUri: vscode.Uri, targetDirUri: vscode.Uri, context: Record<string, any>) {
        const entries = await vscode.workspace.fs.readDirectory(templateDirUri);

        for (const [name, type] of entries) {
            const sourceUri = vscode.Uri.joinPath(templateDirUri, name);
            
            // Render file/directory names that contain Handlebars expressions
            const renderedName = this.renderString(name, context);
            const destinationUri = vscode.Uri.joinPath(targetDirUri, renderedName);

            if (type === vscode.FileType.Directory) {
                await vscode.workspace.fs.createDirectory(destinationUri);
                await this.processDirectory(sourceUri, destinationUri, context);
            } else if (type === vscode.FileType.File) {
                await this.processFile(sourceUri, destinationUri, context);
            }
        }
    }

    private async processFile(sourceFileUri: vscode.Uri, destinationFileUri: vscode.Uri, context: Record<string, any>) {
        const contentBytes = await vscode.workspace.fs.readFile(sourceFileUri);
        const templateContent = new TextDecoder().decode(contentBytes);
        
        const renderedContent = this.renderString(templateContent, context);
        
        const destinationPath = destinationFileUri.path.endsWith('.hbs') 
            ? destinationFileUri.path.slice(0, -4) 
            : destinationFileUri.path;

        await vscode.workspace.fs.writeFile(vscode.Uri.parse(destinationPath), new TextEncoder().encode(renderedContent));
    }

    private renderString(template: string, context: Record<string, any>): string {
        try {
            const compiledTemplate = Handlebars.compile(template, { noEscape: true });
            return compiledTemplate(context);
        } catch (error) {
            logger.warn(`Handlebars compilation failed for a string. Returning original. Error: ${error}`);
            return template; // Return original string if it's not a valid template
        }
    }
}
