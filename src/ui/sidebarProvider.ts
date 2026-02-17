import * as vscode from 'vscode';

import { AgentController } from '../agent/agentController';
import { ISidebarProvider } from '../agent/agentTypes';
import { AuthProvider } from '../auth/authProvider';

export class SidebarProvider implements vscode.WebviewViewProvider, ISidebarProvider {
    public static readonly viewType = 'deepseek-agent-chat';
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _agentController: AgentController,
        private readonly _authProvider: AuthProvider
    ) {
        this._authProvider.onDidAuthStateChange(() => {
            if (this._view) {
                this._updateWebview(this._view.webview);
            }
        });
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        this._updateWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async data => {
            switch (data.type) {
                case 'onInfo': {
                    if (!data.value) {
                        return;
                    }
                    this._agentController.processRequest(data.value);
                    break;
                }
                case 'triggerLogin': {
                    await this._authProvider.loginWithGoogle();
                    break;
                }
                case 'login': {
                    await this._authProvider.login(data.value);
                    if (this._view) {
                        this._updateWebview(this._view.webview);
                    }
                    break;
                }
                case 'logout': {
                    await this._authProvider.logout();
                    if (this._view) {
                        this._updateWebview(this._view.webview);
                    }
                    break;
                }
                case 'onError': {
                    if (!data.value) {
                        return;
                    }
                    vscode.window.showErrorMessage(data.value);
                    break;
                }
            }
        });
    }

    public postMessage(message: any) {
        if (this._view) {
            this._view.webview.postMessage(message);
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview, isAuthenticated: boolean) {
        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'ui', 'webview', 'style.css'));

        if (!isAuthenticated) {
            return `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <link href="${styleResetUri}" rel="stylesheet">
                    <title>Login - DeepSeek Agent</title>
                </head>
                <body>
                    <div class="chat-container">
                        <h2>DeepSeek Agent</h2>
                        <p>Please log in with your API Key to continue.</p>
                        <div class="input-area" style="text-align: center;">
                            <button id="loginBtn" style="width: 100%; padding: 12px; font-weight: 600;">Sign in with Google</button>
                        </div>
                        <p class="text-dim" style="font-size: 11px; margin-top: 20px;">
                            We use secure Google OAuth to sync your chat history and preferences.
                        </p>
                    </div>
                    <script>
                        const vscode = acquireVsCodeApi();
                        document.getElementById('loginBtn').addEventListener('click', () => {
                            vscode.postMessage({ type: 'triggerLogin' });
                        });
                    </script>
                </body>
                </html>`;
        }

        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleResetUri}" rel="stylesheet">
				<title>DeepSeek Agent</title>
			</head>
			<body>
				<div class="chat-container">
					<div id="messages">
                        <div class="message agent">Hello! I'm your DeepSeek Agent. How can I help you today?</div>
                    </div>
					<div class="input-area">
						<textarea id="chatInput" placeholder="Describe your task..."></textarea>
						<div class="actions" style="justify-content: space-between;">
                            <button id="logoutBtn" style="background: transparent; border: 1px solid var(--border); color: var(--text-dim);">Logout</button>
                            <button id="sendBtn">Send Request</button>
                        </div>
					</div>
				</div>
				<script>
					const vscode = acquireVsCodeApi();
                    const messagesContainer = document.getElementById('messages');
                    const input = document.getElementById('chatInput');

                    const addMessage = (data, type) => {
                        const div = document.createElement('div');
                        div.className = 'message ' + type;
                        
                        if (type === 'user') {
                            div.textContent = data;
                        } else {
                            // Agent message with structured content
                            if (data.thought) {
                                const thoughtDiv = document.createElement('div');
                                thoughtDiv.className = 'thought';
                                thoughtDiv.textContent = 'Thought: ' + data.thought;
                                div.appendChild(thoughtDiv);
                            }
                            
                            if (data.step) {
                                const stepDiv = document.createElement('div');
                                stepDiv.className = 'step-card';
                                stepDiv.innerHTML = \`
                                    <div class="step-header">
                                        <span class="step-type">\${data.step.type}</span>
                                        <span>Action</span>
                                    </div>
                                    <div class="step-description">\${data.step.description}</div>
                                \`;
                                div.appendChild(stepDiv);
                            } else if (typeof data === 'string') {
                                div.textContent = data;
                            }
                        }
                        
                        messagesContainer.appendChild(div);
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    };

					window.addEventListener('message', event => {
						const message = event.data;
						switch (message.type) {
							case 'addAgentResponse':
								addMessage(message.value, 'agent');
								break;
						}
					});

					document.getElementById('sendBtn').addEventListener('click', () => {
						const text = input.value.trim();
						if (text) {
                            addMessage(text, 'user');
						    vscode.postMessage({ type: 'onInfo', value: text });
                            input.value = '';
                        }
					});

                    document.getElementById('logoutBtn').addEventListener('click', () => {
                        vscode.postMessage({ type: 'logout' });
                    });

                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            document.getElementById('sendBtn').click();
                        }
                    });
				</script>
			</body>
			</html>`;
    }

    private async _updateWebview(webview: vscode.Webview) {
        const isAuthenticated = await this._authProvider.isAuthenticated();
        webview.html = this._getHtmlForWebview(webview, isAuthenticated);
    }
}
