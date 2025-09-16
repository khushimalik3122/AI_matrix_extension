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
exports.CodeRefactorer = void 0;
const vscode = __importStar(require("vscode"));
const logger_1 = require("../utils/logger");
class CodeRefactorer {
    constructor(providerManager, codeParser) {
        this.providerManager = providerManager;
        this.codeParser = codeParser;
    }
    /**
     * Suggests how to extract a selected piece of code into a new function.
     */
    async suggestFunctionExtraction(document, range) {
        const selectedCode = document.getText(range);
        if (selectedCode.trim().length === 0)
            return null;
        const prompt = `
            You are a senior software engineer performing a code refactoring.
            A user has selected the following code block to be extracted into a new function or method.
            Your task is to analyze the code, determine the necessary input parameters, and identify the return value.
            
            Code to extract:
            \`\`\`${document.languageId}
            ${selectedCode}
            \`\`\`

            Please provide the complete new function definition and suggest a call to this new function that should replace the original code.
            Respond in a clear, concise manner with the suggested new function.
        `;
        try {
            const suggestion = await this.providerManager.generateResponse(prompt);
            return { description: "Extract to function", newCode: suggestion };
        }
        catch (error) {
            logger_1.logger.error(`Error during function extraction: ${error.message}`);
            return null;
        }
    }
    /**
     * Provides code optimization suggestions for a given code block.
     */
    async suggestOptimizations(document, range) {
        const codeToOptimize = document.getText(range);
        if (codeToOptimize.trim().length === 0)
            return null;
        const prompt = `
            As a performance optimization expert, analyze the following code snippet and identify potential improvements.
            Look for inefficient algorithms, redundant computations, or opportunities to use more performant language features.
            
            Code to analyze:
            \`\`\`${document.languageId}
            ${codeToOptimize}
            \`\`\`

            Provide a clear explanation of the issue and the optimized code. If no optimizations are apparent, state that.
        `;
        try {
            const suggestion = await this.providerManager.generateResponse(prompt);
            return { description: "Optimization Suggestion", newCode: suggestion };
        }
        catch (error) {
            logger_1.logger.error(`Error suggesting optimizations: ${error.message}`);
            return null;
        }
    }
    /**
     * Detects potential security vulnerabilities in the selected code.
     */
    async detectVulnerabilities(document, range) {
        const codeToScan = document.getText(range);
        if (codeToScan.trim().length === 0)
            return null;
        const prompt = `
            You are a security analyst. Scan the following code for common security vulnerabilities.
            Look for issues like SQL injection, cross-site scripting (XSS), insecure direct object references, use of hardcoded secrets, or insecure library usage.
            
            Code to scan:
            \`\`\`${document.languageId}
            ${codeToScan}
            \`\`\`

            For each vulnerability found, describe the risk and suggest a remediation. If no vulnerabilities are found, state that the code appears safe.
        `;
        try {
            const report = await this.providerManager.generateResponse(prompt);
            return { description: "Security Scan Report", newCode: report };
        }
        catch (error) {
            logger_1.logger.error(`Error detecting vulnerabilities: ${error.message}`);
            return null;
        }
    }
    /**
     * NOTE: Context-aware rename is a very complex feature. A full implementation
     * would require a much deeper integration with a language server (LSP) to
     * reliably find all references. This is a simplified version using the CodeParser.
     */
    async suggestRename(document, position, newName) {
        // This is a placeholder for a much more complex operation.
        // A true implementation would use the CodeParser to find the symbol at the
        // position, then traverse the ASTs of all relevant files to find references.
        vscode.window.showWarningMessage("Context-aware rename is a complex feature and this is a simplified demonstration.");
        const edit = new vscode.WorkspaceEdit();
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange)
            return null;
        const oldName = document.getText(wordRange);
        // In a real implementation, you would use the parser to find all references.
        // For this example, we'll just rename within the current document.
        const text = document.getText();
        const regex = new RegExp(`\\b${oldName}\\b`, 'g');
        let match;
        while ((match = regex.exec(text)) !== null) {
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + oldName.length);
            edit.replace(document.uri, new vscode.Range(startPos, endPos), newName);
        }
        return edit;
    }
}
exports.CodeRefactorer = CodeRefactorer;
//# sourceMappingURL=codeRefactorer.js.map