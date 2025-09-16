import * as vscode from 'vscode';
import { ProviderManager } from './providerManager';
import { CodeParser } from './codeParser';
import { logger } from '../utils/logger';

// Interface for a structured AI response for refactoring suggestions.
export interface RefactorSuggestion {
    description: string;
    newCode?: string;
}

export class CodeRefactorer {
    private providerManager: ProviderManager;
    private codeParser: CodeParser;

    constructor(providerManager: ProviderManager, codeParser: CodeParser) {
        this.providerManager = providerManager;
        this.codeParser = codeParser;
    }

    /**
     * Suggests how to extract a selected piece of code into a new function.
     */
    public async suggestFunctionExtraction(document: vscode.TextDocument, range: vscode.Range): Promise<RefactorSuggestion | null> {
        const selectedCode = document.getText(range);
        if (selectedCode.trim().length === 0) return null;

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
        } catch (error: any) {
            logger.error(`Error during function extraction: ${error.message}`);
            return null;
        }
    }

    /**
     * Provides code optimization suggestions for a given code block.
     */
    public async suggestOptimizations(document: vscode.TextDocument, range: vscode.Range): Promise<RefactorSuggestion | null> {
        const codeToOptimize = document.getText(range);
        if (codeToOptimize.trim().length === 0) return null;
        
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
        } catch (error: any) {
            logger.error(`Error suggesting optimizations: ${error.message}`);
            return null;
        }
    }

    /**
     * Detects potential security vulnerabilities in the selected code.
     */
    public async detectVulnerabilities(document: vscode.TextDocument, range: vscode.Range): Promise<RefactorSuggestion | null> {
        const codeToScan = document.getText(range);
        if (codeToScan.trim().length === 0) return null;

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
        } catch (error: any) {
            logger.error(`Error detecting vulnerabilities: ${error.message}`);
            return null;
        }
    }
    
    /**
     * NOTE: Context-aware rename is a very complex feature. A full implementation
     * would require a much deeper integration with a language server (LSP) to
     * reliably find all references. This is a simplified version using the CodeParser.
     */
    public async suggestRename(document: vscode.TextDocument, position: vscode.Position, newName: string): Promise<vscode.WorkspaceEdit | null> {
        // This is a placeholder for a much more complex operation.
        // A true implementation would use the CodeParser to find the symbol at the
        // position, then traverse the ASTs of all relevant files to find references.
        vscode.window.showWarningMessage("Context-aware rename is a complex feature and this is a simplified demonstration.");
        
        const edit = new vscode.WorkspaceEdit();
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) return null;
        
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
