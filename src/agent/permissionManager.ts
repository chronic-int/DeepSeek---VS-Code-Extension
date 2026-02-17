import { AgentStep } from './agentTypes';

export class PermissionManager {
    private autoApproveLowRisk: boolean = true;

    constructor() { }

    public async checkPermission(step: AgentStep): Promise<boolean> {
        if (this.autoApproveLowRisk && step.risk === 'low') {
            return true;
        }

        // High risk actions should ALWAYS be blocked or require explicit UI confirmation
        if (step.risk === 'high') {
            // Logic to block dangerous patterns like rm -rf
            if (this.isDangerous(step.action)) {
                throw new Error(`Action blocked due to high risk: ${step.action}`);
            }
        }

        return false; // Requires UI approval
    }

    private isDangerous(action: string): boolean {
        const dangerousPatterns = [/rm\s+-rf/, /sudo\s+/, /curl\s+.*\|\s*bash/];
        return dangerousPatterns.some(pattern => pattern.test(action));
    }
}
