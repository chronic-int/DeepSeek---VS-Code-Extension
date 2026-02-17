import * as vscode from 'vscode';
import { AgentStep } from './agentTypes';
import * as fs from 'fs';
import * as path from 'path';

export class Executor {
    constructor() { }

    public async execute(step: AgentStep): Promise<string> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('No workspace folder open');
        }
        const rootPath = workspaceFolders[0].uri.fsPath;

        switch (step.type) {
            case 'create_file':
                return await this.createFile(rootPath, step.action);
            case 'run_command':
                return await this.runCommand(step.action);
            case 'modify_file':
                return await this.modifyFile(rootPath, step.action);
            default:
                throw new Error(`Execution for step type ${step.type} not implemented`);
        }
    }

    private async createFile(rootPath: string, action: string): Promise<string> {
        // action format expected: "filename\ncontent" or just "filename" (empty content)
        const lines = action.split('\n');
        const fileName = lines[0].trim();
        const content = lines.slice(1).join('\n');

        const filePath = path.join(rootPath, fileName);
        const dirPath = path.dirname(filePath);

        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        fs.writeFileSync(filePath, content);
        return `Created file: ${fileName}`;
    }

    private async runCommand(command: string): Promise<string> {
        return new Promise((resolve) => {
            const terminal = vscode.window.createTerminal('DeepSeek Agent Task');
            terminal.show();
            terminal.sendText(command);

            // Note: VS Code API doesn't easily return terminal output.
            // For a "real" agent, we might use child_process or a more advanced terminal integration.
            // For now, we signal start.
            resolve(`Started command in terminal: ${command}`);
        });
    }

    private async modifyFile(rootPath: string, action: string): Promise<string> {
        // action format expected: "filename\nSEARCH\n[original code]\nREPLACE\n[new code]"
        const parts = action.split('\n');
        const fileName = parts[0].trim();
        const fullContent = action.substring(action.indexOf('\n') + 1);

        const searchMarker = 'SEARCH';
        const replaceMarker = 'REPLACE';

        const searchIndex = fullContent.indexOf(searchMarker);
        const replaceIndex = fullContent.indexOf(replaceMarker);

        if (searchIndex === -1 || replaceIndex === -1) {
            throw new Error('Invalid modify_file format. Expected SEARCH and REPLACE markers.');
        }

        const searchText = fullContent.substring(searchIndex + searchMarker.length, replaceIndex).trim();
        const replaceText = fullContent.substring(replaceIndex + replaceMarker.length).trim();

        const filePath = path.join(rootPath, fileName);
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${fileName}`);
        }

        let fileContent = fs.readFileSync(filePath, 'utf8');

        if (!fileContent.includes(searchText)) {
            throw new Error(`Target text to replace not found in ${fileName}`);
        }

        const newContent = fileContent.replace(searchText, replaceText);
        fs.writeFileSync(filePath, newContent);

        return `Modified file: ${fileName}`;
    }
}
