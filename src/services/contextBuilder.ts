import { AgentState } from '../agent/agentTypes';

export class ContextBuilder {
    constructor() { }

    public buildPrompt(state: AgentState): string {
        const snapshot = state.workspaceSummary;

        let context = `--- WORKSPACE CONTEXT ---\n`;
        context += `File Count: ${snapshot.fileCount}\n`;
        context += `File Tree Structure: ${JSON.stringify(snapshot.fileTree, null, 2)}\n\n`;

        if (snapshot.activeFile) {
            context += `--- ACTIVE FILE: ${snapshot.activeFile} ---\n`;
            context += `Snippet:\n${snapshot.activeFileSnippet}\n\n`;
        }

        context += `--- REQUEST ---\n`;
        context += `${state.originalRequest}\n\n`;

        if (state.executedSteps.length > 0) {
            context += `--- STEP HISTORY ---\n`;
            state.executedSteps.forEach((step, i) => {
                context += `${i + 1}. [${step.type}] ${step.description} -> ${step.status}\n`;
                if (step.result) context += `   Result: ${step.result}\n`;
            });
        }

        return context;
    }
}
