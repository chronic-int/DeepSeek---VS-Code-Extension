import { AgentStateManager } from './agentState';
import { DeepSeekService } from '../services/deepseekService';
import { WorkspaceSnapshotService } from '../services/workspaceSnapshotService';
import { AgentStep, IterativePlanAction } from './agentTypes';
import { v4 as uuidv4 } from 'uuid';

export class IterativePlanner {
    constructor(
        private stateManager: AgentStateManager,
        private deepseekService: DeepSeekService,
        private snapshotService: WorkspaceSnapshotService
    ) { }

    public async planNextStep(): Promise<AgentStep | null> {
        // 1. Refresh snapshot
        const snapshot = await this.snapshotService.getSnapshot();
        this.stateManager.updateWorkspaceSummary(snapshot);

        // 2. Get next step from LLM
        const state = this.stateManager.getState();
        const action: IterativePlanAction = await this.deepseekService.generateNextStep(state);

        // 3. Create step object
        const step: AgentStep = {
            id: uuidv4(),
            ...action.nextStep,
            status: 'pending'
        };

        // 4. Record the step (with thought in description or elsewhere)
        this.stateManager.addStep(step);

        return step;
    }
}
