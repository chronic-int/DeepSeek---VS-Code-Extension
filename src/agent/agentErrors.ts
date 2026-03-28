import { AgentErrorCategory, AgentErrorDetails } from './agentTypes';

export class AgentError extends Error {
    public readonly details: AgentErrorDetails;

    constructor(details: AgentErrorDetails) {
        super(details.message);
        this.name = 'AgentError';
        this.details = details;
    }
}

export function toAgentError(error: unknown, fallback: AgentErrorDetails): AgentErrorDetails {
    if (error instanceof AgentError) {
        return error.details;
    }

    if (error instanceof Error) {
        return {
            ...fallback,
            cause: error.message
        };
    }

    return fallback;
}

export function buildAgentError(
    category: AgentErrorCategory,
    code: string,
    message: string,
    recommendedAction: string,
    extras?: Pick<AgentErrorDetails, 'cause' | 'statusCode'>
): AgentError {
    return new AgentError({
        category,
        code,
        message,
        recommendedAction,
        ...extras
    });
}
