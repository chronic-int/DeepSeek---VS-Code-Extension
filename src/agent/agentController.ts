import * as vscode from 'vscode';
import { AgentStateManager } from './agentState';
import { IterativePlanner } from './iterativePlanner';
import { Executor } from './executor';
import { PermissionManager } from './permissionManager';
import { ISidebarProvider } from './agentTypes';
import { AuthProvider } from '../auth/authProvider';
import { DeepSeekService } from '../services/deepseekService';
import { WorkspaceSnapshotService } from '../services/workspaceSnapshotService';

export class AgentController {
    private stateManager: AgentStateManager | undefined;
    private planner: IterativePlanner | undefined;
    private executor: Executor;
    private permissionManager: PermissionManager;

    private sidebarProvider: ISidebarProvider | undefined;

    constructor(
        private deepseekService: DeepSeekService,
        private snapshotService: WorkspaceSnapshotService,
        private authProvider: AuthProvider
    ) {
        this.executor = new Executor();
        this.permissionManager = new PermissionManager();
    }

    public setSidebarProvider(sidebarProvider: ISidebarProvider) {
        this.sidebarProvider = sidebarProvider;
    }

    public async processRequest(request: string) {
        if (!await this.authProvider.isAuthenticated()) {
            vscode.window.showErrorMessage('DeepSeek Agent: Please login first.');
            return;
        }

        this.stateManager = new AgentStateManager(request);
        this.planner = new IterativePlanner(
            this.stateManager,
            this.deepseekService,
            this.snapshotService
        );

        await vscode.window.showInformationMessage(`Agent started: ${request}`);

        await this.runLoop();
    }

    private async runLoop() {
        if (!this.stateManager || !this.planner) return;

        this.stateManager.markExecuting(true);

        try {
            let isComplete = false;
            while (!isComplete) {
                const step = await this.planner.planNextStep();

                // Feedback to UI
                this.sidebarProvider?.postMessage({
                    type: 'addAgentResponse',
                    value: {
                        thought: 'Analyzing workspace...',
                        step: step
                    }
                });

                if (!step || step.type === 'complete') {
                    isComplete = true;
                    vscode.window.showInformationMessage('Agent task completed!');
                    break;
                }

                const hasPermission = await this.permissionManager.checkPermission(step);

                if (hasPermission) {
                    await this.executeStep(step);
                } else {
                    const result = await vscode.window.showInformationMessage(
                        `Agent needs permission: ${step.description}`,
                        'Approve', 'Skip', 'Stop'
                    );

                    if (result === 'Approve') {
                        await this.executeStep(step);
                    } else if (result === 'Skip') {
                        step.status = 'skipped';
                    } else {
                        isComplete = true;
                        break;
                    }
                }
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(`Agent error: ${error.message}`);
        } finally {
            this.stateManager.markExecuting(false);
        }
    }

    private async executeStep(step: any) {
        step.status = 'executing';
        try {
            const result = await this.executor.execute(step);
            step.status = 'completed';
            step.result = result;
            this.stateManager?.setLastResult(result);
        } catch (error: any) {
            step.status = 'failed';
            step.error = error.message;
            this.stateManager?.setLastResult(`Failed: ${error.message}`);
        }
    }
}
