# DeepSeek VS Code Agent

Autonomous Workspace AI Assistant powered by DeepSeek.

## Features

- **Google OAuth Authentication**: Secure, one-click sign-in using your DeepSeek account.
- **Intelligent Execution**: Perform precision edits (Search & Replace) and run terminal commands.
- **Workspace Awareness**: Recursive scanning and active file snippet extraction for deep context.
- **Premium UI**: Modern "Deep Dark" SaaS aesthetic with real-time thought process visualization.

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Authentication**:
   - Open the DeepSeek sidebar.
   - Click "Sign in with Google".
   - Follow the browser prompt to authorize the extension.

3. **Development**:
   - Press `F5` to open a new VS Code window with the extension loaded.
   - The launch configuration includes `--no-deprecation` to ensure a clean debug console.

## Architecture

- **AuthProvider**: Manages secure sessions via VS Code Secret Storage.
- **DeepSeekUriHandler**: Captures OAuth callbacks from the browser.
- **AgentController**: Coordinates planning, execution, and user permissions.
- **IterativePlanner**: Breaks down complex tasks into autonomous steps.
- **Executor**: Performs file operations and terminal actions.

## Security

- All API keys/sessions are stored in **VS Code Secret Storage**.
- The extension requires explicit user approval for medium/high-risk actions.
- No tokens are ever exposed to the WebView or stored in plain text.