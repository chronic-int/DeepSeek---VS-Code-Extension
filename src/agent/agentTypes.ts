export type StepType =
    | 'install'
    | 'create_file'
    | 'modify_file'
    | 'delete_file'
    | 'run_command'
    | 'complete'
    | 'request_more_info';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface ISidebarProvider {
    postMessage(message: any): void;
}

export type AgentErrorCategory =
    | 'authentication'
    | 'planning'
    | 'execution'
    | 'rate_limit'
    | 'api'
    | 'unknown';

export interface AgentErrorDetails {
    category: AgentErrorCategory;
    code: string;
    message: string;
    recommendedAction: string;
    cause?: string;
    statusCode?: number;
}

export interface AgentStep {
    id: string;
    type: StepType;
    description: string;
    action: string;
    risk: RiskLevel;
    status: 'pending' | 'approved' | 'executing' | 'completed' | 'failed' | 'skipped';
    result?: string;
    error?: AgentErrorDetails;
}

export interface WorkspaceSummary {
    fileCount: number;
    activeFile?: string;
    activeFileSnippet?: string;
    languageId?: string;
    recentChanges: string[];
    fileTree?: any;
}

export interface AgentState {
    originalRequest: string;
    executedSteps: AgentStep[];
    workspaceSummary: WorkspaceSummary;
    changedFiles: string[];
    lastExecutionResult?: string;
    mode: 'agent' | 'assist' | 'study';
    isExecuting: boolean;
}

export interface IterativePlanAction {
    thought: string;
    nextStep: Omit<AgentStep, 'id' | 'status'>;
}
