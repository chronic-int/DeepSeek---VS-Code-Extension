import axios from 'axios';
import { IterativePlanAction } from '../agent/agentTypes';
import { ContextBuilder } from './contextBuilder';
import { AuthProvider } from '../auth/authProvider';

export class DeepSeekService {
    private readonly apiUrl = 'https://api.deepseek.com/v1/chat/completions';
    private contextBuilder: ContextBuilder;

    constructor(
        private readonly authProvider: AuthProvider
    ) {
        this.contextBuilder = new ContextBuilder();
    }

    public async initialize() {
        // No longer need to manually initialize apiKey here
    }

    public async hasKey(): Promise<boolean> {
        return await this.authProvider.isAuthenticated();
    }

    public async generateNextStep(state: any): Promise<IterativePlanAction> {
        const apiKey = await this.authProvider.getToken();
        if (!apiKey) {
            throw new Error('DeepSeek API Key not found. Please log in.');
        }

        const systemPrompt = `You are a VS Code autonomous coding agent. 
Analyze the current workspace state and the user's request.
Return ONLY the next best action in the following JSON format:
{
    "thought": "Reasoning for the next step",
    "nextStep": {
        "type": "install | create_file | modify_file | delete_file | run_command | complete | request_more_info",
        "description": "Short description of the step",
        "action": "The actual value (e.g., command to run, file content, or filename)",
        "risk": "low | medium | high"
    }
}
Do not include any other text.`;

        const userPrompt = this.contextBuilder.buildPrompt(state);

        try {
            const response = await axios.post(this.apiUrl, {
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                response_format: { type: 'json_object' }
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            const content = response.data.choices[0].message.content;
            return JSON.parse(content) as IterativePlanAction;
        } catch (error: any) {
            console.error('DeepSeek API Error:', error.response?.data || error.message);
            throw new Error(`DeepSeek API failed: ${error.message}`);
        }
    }
}
