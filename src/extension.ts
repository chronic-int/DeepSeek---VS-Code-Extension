import * as vscode from 'vscode';

import { SidebarProvider } from './ui/sidebarProvider';
import { DeepSeekService } from './services/deepseekService';
import { WorkspaceSnapshotService } from './services/workspaceSnapshotService';
import { AgentController } from './agent/agentController';
import { AuthProvider } from './auth/authProvider';

export async function activate(context: vscode.ExtensionContext) {
    console.log('DeepSeek VS Code Agent is now active!');

    const authProvider = new AuthProvider(context);

    const deepseekService = new DeepSeekService(authProvider);
    await deepseekService.initialize();

    const snapshotService = new WorkspaceSnapshotService();
    const agentController = new AgentController(deepseekService, snapshotService, authProvider);

    const sidebarProvider = new SidebarProvider(context.extensionUri, agentController, authProvider);
    agentController.setSidebarProvider(sidebarProvider);

    if (!await authProvider.isAuthenticated()) {
        vscode.window.showInformationMessage('DeepSeek: Please sign in to use the agent.', 'Sign in').then(selection => {
            if (selection === 'Sign in') {
                authProvider.loginWithGoogle();
            }
        });
    }

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            SidebarProvider.viewType,
            sidebarProvider
        )
    );
}

export function deactivate() { }
