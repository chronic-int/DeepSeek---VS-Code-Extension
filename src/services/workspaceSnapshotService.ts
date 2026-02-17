import * as vscode from 'vscode';

export class WorkspaceSnapshotService {
    constructor() { }

    public async getSnapshot() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return { fileCount: 0, files: [] };
        }

        const rootPath = workspaceFolders[0].uri.fsPath;

        // Recursive scan for all files (excluding node_modules)
        const allFiles = await vscode.workspace.findFiles('**/*', '**/node_modules/**', 500);
        const fileTree = this.buildFileTree(allFiles.map(f => vscode.workspace.asRelativePath(f)));

        const activeEditor = vscode.window.activeTextEditor;
        let activeFileContent = '';

        if (activeEditor) {
            const document = activeEditor.document;
            activeFileContent = document.getText(new vscode.Range(0, 0, 100, 0)); // Get first 100 lines
        }

        return {
            fileCount: allFiles.length,
            rootPath,
            fileTree,
            activeFile: activeEditor?.document.fileName,
            activeFileSnippet: activeFileContent,
            languageId: activeEditor?.document.languageId
        };
    }

    private buildFileTree(files: string[]): any {
        // Basic tree structure representation
        const tree: any = {};
        files.forEach(file => {
            const parts = file.split('/');
            let current = tree;
            parts.forEach((part, index) => {
                if (index === parts.length - 1) {
                    current[part] = 'file';
                } else {
                    current[part] = current[part] || {};
                    current = current[part];
                }
            });
        });
        return tree;
    }
}
