import * as vscode from 'vscode';

export class DeepSeekUriHandler implements vscode.UriHandler {
    private _onDidReceiveToken = new vscode.EventEmitter<string>();
    public readonly onDidReceiveToken = this._onDidReceiveToken.event;

    public handleUri(uri: vscode.Uri): void {
        if (uri.path === '/auth') {
            const queryParams = new URLSearchParams(uri.query);
            const token = queryParams.get('token');
            if (token) {
                this._onDidReceiveToken.fire(token);
            }
        }
    }
}
