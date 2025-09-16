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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeParser = void 0;
const vscode = __importStar(require("vscode"));
const ts = __importStar(require("typescript"));
const tree_sitter_1 = __importDefault(require("tree-sitter"));
const tree_sitter_python_1 = __importDefault(require("tree-sitter-python"));
const tree_sitter_java_1 = __importDefault(require("tree-sitter-java"));
const logger_1 = require("../utils/logger");
/**
 * Parses source code files into a structured representation using ASTs.
 * Supports multiple languages by leveraging appropriate parsing libraries.
 */
class CodeParser {
    constructor() {
        this.tsParser = ts;
        this.treeSitterParser = new tree_sitter_1.default();
    }
    /**
     * Parses a file and returns its structured representation.
     * @param uri The URI of the file to parse.
     * @returns A Promise resolving to a CodeFileStructure or null if the language is unsupported.
     */
    async parse(uri) {
        try {
            const document = await vscode.workspace.openTextDocument(uri);
            const content = document.getText();
            const languageId = document.languageId;
            let symbols = [];
            switch (languageId) {
                case 'typescript':
                case 'javascript':
                    symbols = this.parseTypeScript(content, uri);
                    break;
                case 'python':
                    await this.initializeTreeSitter(tree_sitter_python_1.default, 'tree-sitter-python.wasm');
                    symbols = this.parseWithTreeSitter(content, uri, languageId);
                    break;
                case 'java':
                    await this.initializeTreeSitter(tree_sitter_java_1.default, 'tree-sitter-java.wasm');
                    symbols = this.parseWithTreeSitter(content, uri, languageId);
                    break;
                default:
                    logger_1.logger.warn(`Unsupported language for parsing: ${languageId}`);
                    return null;
            }
            return { uri, languageId, symbols };
        }
        catch (error) {
            logger_1.logger.error(`Failed to parse file ${uri.fsPath}: ${error}`);
            return null;
        }
    }
    /**
     * Configures the tree-sitter parser for a specific language.
     */
    async initializeTreeSitter(languageModule, wasmPath) {
        // In a VS Code extension, WASM files might need to be located relative to the extension's root.
        // This path might need adjustment based on your webpack/bundler setup.
        // For now, we assume it's in a known location.
        // TODO: Properly configure WASM file loading for extensions.
        // For simplicity in this example, we'll try to load it, but it may fail
        // without proper bundler configuration for WASM files.
        try {
            await tree_sitter_1.default.init();
            this.treeSitterParser.setLanguage(languageModule);
        }
        catch (e) {
            logger_1.logger.error(`Failed to initialize tree-sitter for ${wasmPath}. Ensure WASM files are correctly bundled.`, e);
            throw new Error('Tree-sitter initialization failed.');
        }
    }
    /**
     * Parses TypeScript or JavaScript source code using the TypeScript compiler API.
     */
    parseTypeScript(content, uri) {
        const sourceFile = this.tsParser.createSourceFile(uri.fsPath, content, this.tsParser.ScriptTarget.Latest, true);
        const symbols = [];
        const visit = (node) => {
            if (this.tsParser.isFunctionDeclaration(node) && node.name) {
                symbols.push(this.nodeToSymbol(node, 'function', content, sourceFile));
            }
            else if (this.tsParser.isClassDeclaration(node) && node.name) {
                symbols.push(this.nodeToSymbol(node, 'class', content, sourceFile));
            }
            else if (this.tsParser.isImportDeclaration(node)) {
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
    parseWithTreeSitter(content, uri, language) {
        const tree = this.treeSitterParser.parse(content);
        const symbols = [];
        // Example query for functions in Python
        // More complex queries can be written for classes, methods, imports, etc.
        const queryStr = language === 'python' ? '(function_definition name: (identifier) @name)' :
            language === 'java' ? '(method_declaration name: (identifier) @name)' : '';
        if (!queryStr)
            return [];
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
        }
        catch (e) {
            logger_1.logger.error(`Error executing tree-sitter query for ${language}:`, e);
        }
        return symbols;
    }
    nodeToSymbol(node, type, content, sourceFile) {
        const startPos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const endPos = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
        let name = 'anonymous';
        if ('name' in node && ts.isIdentifier(node.name)) {
            name = node.name.text;
        }
        else if (ts.isImportDeclaration(node)) {
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
exports.CodeParser = CodeParser;
//# sourceMappingURL=codeParser.js.map