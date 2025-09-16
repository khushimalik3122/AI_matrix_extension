import * as vscode from 'vscode';

/**
 * Represents a single extracted code symbol like a function or class.
 */
export interface CodeSymbol {
    name: string;
    type: 'function' | 'class' | 'method' | 'variable' | 'import' | 'interface';
    start: vscode.Position;
    end: vscode.Position;
    documentation?: string;
    dependencies?: string[];
    children?: CodeSymbol[];
}

/**
 * Represents the complete parsed structure of a single source file.
 */
export interface CodeFileStructure {
    uri: vscode.Uri;
    languageId: string;
    summary?: string;
    symbols: CodeSymbol[];
}
