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
exports.TemplateEngine = void 0;
const vscode = __importStar(require("vscode"));
const Handlebars = __importStar(require("handlebars"));
const logger_1 = require("../utils/logger");
// --- Handlebars Helpers ---
// Register helpers for common casing needs in file/variable names.
Handlebars.registerHelper('pascalCase', (str) => str.replace(/(\w)(\w*)/g, (g0, g1, g2) => g1.toUpperCase() + g2.toLowerCase()).replace(/\s+/g, ''));
Handlebars.registerHelper('camelCase', (str) => Handlebars.helpers.pascalCase(str).replace(/^./, (g0) => g0.toLowerCase()));
Handlebars.registerHelper('kebabCase', (str) => str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase().replace(/\s+/g, '-'));
class TemplateEngine {
    /**
     * @param extensionUri The URI of the extension's root directory.
     */
    constructor(extensionUri) {
        this.extensionUri = extensionUri;
        this.templatesRoot = vscode.Uri.joinPath(extensionUri, 'templates');
    }
    /**
     * Renders a project template into a target directory.
     * @param templateName The name of the template folder inside the 'templates' directory.
     * @param targetRootUri The URI where the project should be generated.
     * @param context An object containing variables to be used in the templates.
     * @returns A promise that resolves to true on success, false on failure.
     */
    async render(templateName, targetRootUri, context) {
        const templateDirUri = vscode.Uri.joinPath(this.templatesRoot, templateName);
        try {
            // Check if template directory exists
            await vscode.workspace.fs.stat(templateDirUri);
            await this.processDirectory(templateDirUri, targetRootUri, context);
            logger_1.logger.log(`Template '${templateName}' rendered successfully.`);
            return true;
        }
        catch (error) {
            if (error instanceof vscode.FileSystemError && error.code === 'FileNotFound') {
                logger_1.logger.error(`Template directory not found: ${templateDirUri.fsPath}`);
                vscode.window.showErrorMessage(`Template '${templateName}' does not exist.`);
            }
            else {
                logger_1.logger.error(`Failed to render template '${templateName}': ${error}`);
                vscode.window.showErrorMessage(`An error occurred while rendering the template.`);
            }
            return false;
        }
    }
    async processDirectory(templateDirUri, targetDirUri, context) {
        const entries = await vscode.workspace.fs.readDirectory(templateDirUri);
        for (const [name, type] of entries) {
            const sourceUri = vscode.Uri.joinPath(templateDirUri, name);
            // Render file/directory names that contain Handlebars expressions
            const renderedName = this.renderString(name, context);
            const destinationUri = vscode.Uri.joinPath(targetDirUri, renderedName);
            if (type === vscode.FileType.Directory) {
                await vscode.workspace.fs.createDirectory(destinationUri);
                await this.processDirectory(sourceUri, destinationUri, context);
            }
            else if (type === vscode.FileType.File) {
                await this.processFile(sourceUri, destinationUri, context);
            }
        }
    }
    async processFile(sourceFileUri, destinationFileUri, context) {
        const contentBytes = await vscode.workspace.fs.readFile(sourceFileUri);
        const templateContent = new TextDecoder().decode(contentBytes);
        const renderedContent = this.renderString(templateContent, context);
        const destinationPath = destinationFileUri.path.endsWith('.hbs')
            ? destinationFileUri.path.slice(0, -4)
            : destinationFileUri.path;
        await vscode.workspace.fs.writeFile(vscode.Uri.parse(destinationPath), new TextEncoder().encode(renderedContent));
    }
    renderString(template, context) {
        try {
            const compiledTemplate = Handlebars.compile(template, { noEscape: true });
            return compiledTemplate(context);
        }
        catch (error) {
            logger_1.logger.warn(`Handlebars compilation failed for a string. Returning original. Error: ${error}`);
            return template; // Return original string if it's not a valid template
        }
    }
}
exports.TemplateEngine = TemplateEngine;
//# sourceMappingURL=templateEngine.js.map