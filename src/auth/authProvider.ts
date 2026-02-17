import * as vscode from 'vscode';
import { v4 as uuid } from 'uuid';

export class AuthProvider implements vscode.AuthenticationProvider {
    private static readonly AUTH_TYPE = 'deepseek';
    private static readonly SESSION_KEY = 'deepseek_session';

    private _onDidChangeSessions = new vscode.EventEmitter<vscode.AuthenticationProviderAuthenticationSessionsChangeEvent>();
    public readonly onDidChangeSessions = this._onDidChangeSessions.event;

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly uriHandler: any // Type this properly if needed
    ) { }

    public async getSessions(scopes?: string[]): Promise<vscode.AuthenticationSession[]> {
        const sessionData = await this.context.secrets.get(AuthProvider.SESSION_KEY);
        if (!sessionData) {
            return [];
        }

        try {
            const session = JSON.parse(sessionData);
            return [session];
        } catch {
            return [];
        }
    }

    public async createSession(scopes: string[]): Promise<vscode.AuthenticationSession> {
        const loginUrl = 'https://chat.deepseek.com/auth/google?callback=' +
            encodeURIComponent('vscode://chronic-int.deepseek-vscode-agent/auth');

        await vscode.env.openExternal(vscode.Uri.parse(loginUrl));

        return new Promise((resolve, reject) => {
            const disposable = this.uriHandler.onDidReceiveToken(async (token: string) => {
                disposable.dispose();

                const session: vscode.AuthenticationSession = {
                    id: uuid(),
                    accessToken: token,
                    account: {
                        id: 'deepseek-user', // In a real app, you'd decode this from the token
                        label: 'DeepSeek User'
                    },
                    scopes: scopes
                };

                await this.context.secrets.store(AuthProvider.SESSION_KEY, JSON.stringify(session));
                this._onDidChangeSessions.fire({ added: [session], removed: [], changed: [] });
                resolve(session);
            });

            // Timeout after 5 minutes
            setTimeout(() => {
                disposable.dispose();
                reject(new Error('Authentication timed out'));
            }, 300000);
        });
    }

    public async removeSession(sessionId: string): Promise<void> {
        const sessions = await this.getSessions();
        const session = sessions.find(s => s.id === sessionId);

        await this.context.secrets.delete(AuthProvider.SESSION_KEY);
        if (session) {
            this._onDidChangeSessions.fire({ added: [], removed: [session], changed: [] });
        }
    }

    // Helper for other services to quickly check if authenticated
    public async isAuthenticated(): Promise<boolean> {
        const sessions = await this.getSessions();
        return sessions.length > 0;
    }

    public async getToken(): Promise<string | undefined> {
        const sessions = await this.getSessions();
        return sessions[0]?.accessToken;
    }
}
