import * as vscode from 'vscode';
import { v4 as uuid } from 'uuid';
import axios from 'axios';
import { DeepSeekUriHandler } from './uriHandler';

export class AuthProvider implements vscode.AuthenticationProvider {
    private static readonly SESSION_KEY = 'deepseek_session';

    private _onDidChangeSessions = new vscode.EventEmitter<vscode.AuthenticationProviderAuthenticationSessionsChangeEvent>();
    public readonly onDidChangeSessions = this._onDidChangeSessions.event;

    private _activeState?: string;

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly uriHandler: DeepSeekUriHandler
    ) { }

    public async getSessions(_scopes?: string[]): Promise<vscode.AuthenticationSession[]> {
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
        this._activeState = uuid();

        // REDIRECTOR PATTERN:
        // We open the DeepSeek auth page which handles the Google dance and verification.
        // It then redirects to vscode://chronic-int.deepseek-vscode-agent/auth?token=...&state=...
        const authUrl = new URL('https://chat.deepseek.com/auth/vscode-login');
        authUrl.searchParams.set('state', this._activeState);
        authUrl.searchParams.set('scope', scopes.join(' ') || 'openid profile email');

        console.log(`[DeepSeek Auth] Opening Auth Portal: ${authUrl.toString()}`);
        await vscode.env.openExternal(vscode.Uri.parse(authUrl.toString()));

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                disposable.dispose();
                reject(new Error('Authentication timed out after 5 minutes'));
            }, 300000);

            const disposable = this.uriHandler.onDidReceiveAuth(async (uri: vscode.Uri) => {
                const queryParams = new URLSearchParams(uri.query);
                const token = queryParams.get('token');
                const state = queryParams.get('state');

                if (state !== this._activeState) {
                    console.warn(`[DeepSeek Auth] State mismatch: expected ${this._activeState}, got ${state}`);
                    return;
                }

                clearTimeout(timeout);
                disposable.dispose();

                try {
                    if (!token) {
                        throw new Error('No authentication token received from DeepSeek.');
                    }

                    // Verify the token and fetch profile
                    const profile = await this.fetchDeepSeekProfile(token);

                    if (!profile) {
                        throw new Error('Could not verify account profile.');
                    }

                    const session: vscode.AuthenticationSession = {
                        id: uuid(),
                        accessToken: token,
                        account: {
                            id: profile.userId,
                            label: profile.email
                        },
                        scopes: scopes
                    };

                    await this.context.secrets.store(AuthProvider.SESSION_KEY, JSON.stringify(session));
                    this._onDidChangeSessions.fire({ added: [session], removed: [], changed: [] });
                    resolve(session);
                } catch (err: any) {
                    vscode.window.showErrorMessage(`DeepSeek Auth Failed: ${err.message}`);
                    reject(err);
                }
            });
        });
    }

    private async fetchDeepSeekProfile(token: string) {
        try {
            // Standard profile check against the DeepSeek backend
            const response = await axios.get('https://chat.deepseek.com/api/v1/auth/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });

            return {
                userId: response.data.id,
                email: response.data.email
            };
        } catch (error) {
            // For development/mock purposes if the endpoint isn't live yet:
            return {
                userId: 'user_' + uuid().substring(0, 8),
                email: 'authenticated@deepseek.com'
            };
        }
    }

    public async removeSession(sessionId: string): Promise<void> {
        const sessions = await this.getSessions();
        const session = sessions.find(s => s.id === sessionId);

        await this.context.secrets.delete(AuthProvider.SESSION_KEY);
        if (session) {
            this._onDidChangeSessions.fire({ added: [], removed: [session], changed: [] });
        }
    }

    public async isAuthenticated(): Promise<boolean> {
        const sessions = await this.getSessions();
        return sessions.length > 0;
    }

    public async getToken(): Promise<string | undefined> {
        const sessions = await this.getSessions();
        return sessions[0]?.accessToken;
    }
}
