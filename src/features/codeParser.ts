import * as vscode from 'vscode';
import * as ts from 'typescript';
import Parser from 'tree-sitter';
import JavaScript from 'tree-sitter-javascript';
import TypeScript from 'tree-sitter-typescript';
import Python from 'tree-sitter-python';
import Java from 'tree-sitter-java';
import { CodeFileStructure, CodeSymbol } from '../types/codeAnalysis';
import { logger } from '../utils/logger';
import * as fs from 'fs/promises';

type Language = 'javascript' | 'typescript' | 'python' | 'java';

/**
 * Parses source code files into a structured representation using ASTs.
 * Supports multiple languages by leveraging appropriate parsing libraries.
 */
export class CodeParser {
    private tsParser: typeof ts;
    private treeSitterParser: Parser;

    constructor() {
        this.tsParser = ts;
        this.treeSitterParser = new Parser();
    }

    /**
     * Parses a file and returns its structured representation.
     * @param uri The URI of the file to parse.
     * @returns A Promise resolving to a CodeFileStructure or null if the language is unsupported.
     */
    public async parse(uri: vscode.Uri): Promise<CodeFileStructure | null> {
        try {
            const document = await vscode.workspace.openTextDocument(uri);
            const content = document.getText();
            const languageId = document.languageId as Language;

            let symbols: CodeSymbol[] = [];

            switch (languageId) {
                case 'typescript':
                case 'javascript':
                    symbols = this.parseTypeScript(content, uri);
                    break;
                case 'python':
                    await this.initializeTreeSitter(Python, 'tree-sitter-python.wasm');
                    symbols = this.parseWithTreeSitter(content, uri, languageId);
                    break;
                case 'java':
                     await this.initializeTreeSitter(Java, 'tree-sitter-java.wasm');
                    symbols = this.parseWithTreeSitter(content, uri, languageId);
                    break;
                default:
                    logger.warn(`Unsupported language for parsing: ${languageId}`);
                    return null;
            }
            
            return { uri, languageId, symbols };
        } catch (error) {
            logger.error(`Failed to parse file ${uri.fsPath}: ${error}`);
            return null;
        }
    }

    /**
     * Configures the tree-sitter parser for a specific language.
     */
    private async initializeTreeSitter(languageModule: any, wasmPath: string) {
        // In a VS Code extension, WASM files might need to be located relative to the extension's root.
        // This path might need adjustment based on your webpack/bundler setup.
        // For now, we assume it's in a known location.
        // TODO: Properly configure WASM file loading for extensions.
        // For simplicity in this example, we'll try to load it, but it may fail
        // without proper bundler configuration for WASM files.
        try {
            await Parser.init();
            this.treeSitterParser.setLanguage(languageModule);
        } catch (e) {
            logger.error(`Failed to initialize tree-sitter for ${wasmPath}. Ensure WASM files are correctly bundled.`, e);
            throw new Error('Tree-sitter initialization failed.');
        }
    }

    /**
     * Parses TypeScript or JavaScript source code using the TypeScript compiler API.
     */
    private parseTypeScript(content: string, uri: vscode.Uri): CodeSymbol[] {
        const sourceFile = this.tsParser.createSourceFile(
            uri.fsPath,
            content,
            this.tsParser.ScriptTarget.Latest,
            true
        );

        const symbols: CodeSymbol[] = [];
        const visit = (node: ts.Node) => {
            if (this.tsParser.isFunctionDeclaration(node) && node.name) {
                symbols.push(this.nodeToSymbol(node, 'function', content, sourceFile));
            } else if (this.tsParser.isClassDeclaration(node) && node.name) {
                symbols.push(this.nodeToSymbol(node, 'class', content, sourceFile));
            } else if (this.tsParser.isImportDeclaration(node)) {
                symbols.push(this.nodeToSymbol(node, 'import', content, sourceFile));
            }
            this.tsParser.forEachChild(node, visit);
        };
        
        visit(sourceFile);
        return symbols;
    }

    /**
     * Parses code using tree-sitter and extracts symbols based on queries.
     */
    private parseWithTreeSitter(content: string, uri: vscode.Uri, language: Language): CodeSymbol[] {
        const tree = this.treeSitterParser.parse(content);
        const symbols: CodeSymbol[] = [];
        
        // Example query for functions in Python
        // More complex queries can be written for classes, methods, imports, etc.
        const queryStr = language === 'python' ? '(function_definition name: (identifier) @name)' :
                         language === 'java' ? '(method_declaration name: (identifier) @name)' : '';

        if (!queryStr) return [];
        
        try {
            const query = this.treeSitterParser.getLanguage().query(queryStr);
            const matches = query.matches(tree.rootNode);

            for (const match of matches) {
                for (const capture of match.captures) {
                    const node = capture.node;
                    symbols.push({
                        name: node.text,
                        type: 'function', // Simplified for this example
                        start: new vscode.Position(node.startPosition.row, node.startPosition.column),
                        end: new vscode.Position(node.endPosition.row, node.endPosition.column),
                    });
                }
            }
        } catch (e) {
            logger.error(`Error executing tree-sitter query for ${language}:`, e);
        }

        return symbols;
    }

    private nodeToSymbol(node: ts.Node, type: CodeSymbol['type'], content: string, sourceFile: ts.SourceFile): CodeSymbol {
        const startPos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const endPos = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
        
        let name = 'anonymous';
        if ('name' in node && ts.isIdentifier(node.name as any)) {
            name = (node.name as ts.Identifier).text;
        } else if(ts.isImportDeclaration(node)) {
            name = node.moduleSpecifier.getText(sourceFile).replace(/['"]/g, '');
        }

        return {
            name,
            type,
            start: new vscode.Position(startPos.line, startPos.character),
            end: new vscode.Position(endPos.line, endPos.character),
            // TODO: Extract documentation and other details
        };
    }
}
