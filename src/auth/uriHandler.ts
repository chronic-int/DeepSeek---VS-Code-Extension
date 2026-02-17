import * as vscode from 'vscode';

export class DeepSeekUriHandler implements vscode.UriHandler {
    private _onDidReceiveAuth = new vscode.EventEmitter<vscode.Uri>();
    public readonly onDidReceiveAuth = this._onDidReceiveAuth.event;

    public handleUri(uri: vscode.Uri): void {
        console.log(`[DeepSeek Auth] Captured URI: ${uri.toString()}`);
        if (uri.path === '/auth') {
            this._onDidReceiveAuth.fire(uri);
        }
    }
}
