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
exports.DocumentationGenerator = void 0;
const vscode = __importStar(require("vscode"));
const logger_1 = require("../utils/logger");
class DocumentationGenerator {
    constructor(providerManager, codeParser) {
        this.providerManager = providerManager;
        this.codeParser = codeParser;
    }
    /**
     * Generates a JSDoc/TSDoc or Python docstring for a selected function.
     */
    async generateDocstring(document, range) {
        const code = document.getText(range);
        if (code.trim().length === 0)
            return null;
        // Use the parser to get function details (optional but recommended for better results)
        // const structure = await this.codeParser.parse(document.uri);
        // const funcDetails = ... find function in structure ...
        const prompt = `
            You are an expert programmer tasked with writing clear documentation.
            Generate a comprehensive docstring comment for the following function.
            The comment should explain what the function does, describe its parameters, and specify what it returns.
            Format the docstring according to the standard conventions for the language (${document.languageId}).

            Function code:
            \`\`\`${document.languageId}
            ${code}
            \`\`\`

            Provide only the complete docstring comment, ready to be inserted above the function.
        `;
        try {
            return await this.providerManager.generateResponse(prompt);
        }
        catch (error) {
            logger_1.logger.error(`Error generating docstring: ${error.message}`);
            return null;
        }
    }
    /**
     * Generates a README.md file content based on the workspace file structure.
     */
    async generateReadme(workspaceUri) {
        const files = await vscode.workspace.findFiles(new vscode.RelativePattern(workspaceUri, '**/*'), '**/{node_modules,.git,dist,build}/**', 100);
        const fileList = files.map(file => vscode.workspace.asRelativePath(file)).join('\n');
        const prompt = `
            You are a technical writer creating documentation for a new software project.
            Based on the following list of files in the project, generate a professional README.md file.
            The README should include a project title, a brief description of its likely purpose, installation instructions,
            a usage example, and a section on how to contribute. Make educated guesses based on the file structure.

            Project file structure:
            ${fileList}

            Generate the full content for the README.md file in Markdown format.
        `;
        try {
            return await this.providerManager.generateResponse(prompt, { maxTokens: 1024 });
        }
        catch (error) {
            logger_1.logger.error(`Error generating README: ${error.message}`);
            return null;
        }
    }
    /**
     * Enhances existing comments within a selected code block.
     */
    async enhanceComments(document, range) {
        const codeWithComments = document.getText(range);
        if (codeWithComments.trim().length === 0)
            return null;
        const prompt = `
            As a senior developer, review the following code and its comments.
            Your task is to improve the existing comments for clarity, accuracy, and completeness. Do not change the code itself.
            If comments are missing for complex parts, add them. If they are unclear, rewrite them.

            Code to review:
            \`\`\`${document.languageId}
            ${codeWithComments}
            \`\`\`

            Return the original code block with the improved comments.
        `;
        try {
            return await this.providerManager.generateResponse(prompt);
        }
        catch (error) {
            logger_1.logger.error(`Error enhancing comments: ${error.message}`);
            return null;
        }
    }
    /**
     * Creates a formatted changelog entry from a description of changes.
     */
    async generateChangelogEntry(changeDescription) {
        if (changeDescription.trim().length === 0)
            return null;
        const prompt = `
            You are managing a project's changelog. A developer has provided the following summary of their changes.
            Convert this description into a concise, well-formatted changelog entry in Markdown.
            Categorize the changes under headings like 'Added', 'Changed', 'Fixed', or 'Removed' based on the description.

            Developer's description of changes:
            "${changeDescription}"

            Generate the changelog entry in Markdown format.
        `;
        try {
            return await this.providerManager.generateResponse(prompt);
        }
        catch (error) {
            logger_1.logger.error(`Error generating changelog entry: ${error.message}`);
            return null;
        }
    }
}
exports.DocumentationGenerator = DocumentationGenerator;
//# sourceMappingURL=documentationGenerator.js.map