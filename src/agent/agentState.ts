import { AgentState, WorkspaceSummary } from './agentTypes';

export class AgentStateManager {
    private state: AgentState;

    constructor(originalRequest: string) {
        this.state = {
            originalRequest,
            executedSteps: [],
            workspaceSummary: {
                fileCount: 0,   
                recentChanges: []
            },
            changedFiles: [],
            mode: 'agent',
            isExecuting: false
        };
    }

    public getState(): AgentState {
        return { ...this.state };
    }

    public updateWorkspaceSummary(summary: Partial<WorkspaceSummary>): void {
        this.state.workspaceSummary = {
            ...this.state.workspaceSummary,
            ...summary
        };
    }

    public addStep(step: any): void {
        this.state.executedSteps.push(step);
    }

    public markExecuting(executing: boolean): void {
        this.state.isExecuting = executing;
    }

    public setLastResult(result: string): void {
        this.state.lastExecutionResult = result;
    }

    public addChangedFile(file: string): void {
        if (!this.state.changedFiles.includes(file)) {
            this.state.changedFiles.push(file);
        }
    }
}
