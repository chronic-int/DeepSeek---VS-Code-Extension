import * as vscode from 'vscode';

import { SidebarProvider } from './ui/sidebarProvider';
import { DeepSeekService } from './services/deepseekService';
import { WorkspaceSnapshotService } from './services/workspaceSnapshotService';
import { AgentController } from './agent/agentController';
import { AuthProvider } from './auth/authProvider';
import { DeepSeekUriHandler } from './auth/uriHandler';

export async function activate(context: vscode.ExtensionContext) {
    console.log('DeepSeek VS Code Agent is now active!');

    const uriHandler = new DeepSeekUriHandler();
    context.subscriptions.push(vscode.window.registerUriHandler(uriHandler));

    const authProvider = new AuthProvider(context, uriHandler);
    context.subscriptions.push(vscode.authentication.registerAuthenticationProvider('deepseek', 'DeepSeek', authProvider));

    const deepseekService = new DeepSeekService(authProvider);
    await deepseekService.initialize();

    const snapshotService = new WorkspaceSnapshotService();
    const agentController = new AgentController(deepseekService, snapshotService, authProvider);

    const sidebarProvider = new SidebarProvider(context.extensionUri, agentController, authProvider);
    agentController.setSidebarProvider(sidebarProvider);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            SidebarProvider.viewType,
            sidebarProvider
        )
    );
}

export function deactivate() { }
