# DeepSeek VS Code Agent
## Authentication Flow Review

---

# 🚨 Issue Identified

The extension did not request authentication on first use.

The user was able to start the Agent without being asked to log in to a DeepSeek account.

This breaks the intended architecture.

---

# 🎯 Expected Authentication Behavior

On first extension use:

1. Check if token exists in secure storage
2. If token does NOT exist:
   - Show login screen
   - Block Agent execution
3. If token exists:
   - Allow full functionality

Authentication must be mandatory before any AI interaction.

---

# 🔐 Correct Authentication Architecture

Use VS Code Secret Storage:

context.secrets.store("deepseekToken", token)
context.secrets.get("deepseekToken")
context.secrets.delete("deepseekToken")

Never:
- Store token in localStorage
- Store token in settings.json
- Expose token to WebView
- Send token to frontend

All API calls must happen in extension backend.

---

# 🧭 Correct First-Run Flow

Extension Activated
        ↓
Check for stored token
        ↓
IF token exists
        → Open Agent UI
ELSE
        → Show Login Screen

Agent Mode must be locked until authentication is complete.

---

# 🖥 Required Login UI

The first-time UI should show:

DeepSeek Agent

Please log in to your DeepSeek account.

[ Login with API Key ]
or
[ Login with DeepSeek Account ]

Optional:
Small explanation about secure storage.

---

# 🔄 Persistent Session Rules

Once logged in:

- Token remains stored
- User stays logged in
- Only logout removes token
- Extension reload must not remove session

Logout button must:

- Delete token from secrets
- Return UI to login screen
- Stop active agent session

---

# 🛡 Security Enforcement

AgentController must verify authentication before execution.

Before starting:

if (!authProvider.isAuthenticated()) {
   blockExecution();
}

No Planner or DeepSeekService call should run without token.

---

# 🔎 Possible Causes of Current Issue

1. Authentication check not implemented in activate()
2. AgentController not validating auth state
3. DeepSeekService not validating token existence
4. UI skipping login screen
5. Using mock service during development

---

# 🏗 Required Fix Implementation Steps

1. Implement AuthProvider
2. Enforce authentication check in extension activation
3. Block AgentController.start() if not authenticated
4. Add Login UI
5. Add Logout button
6. Add token validation before every API call

---

# 🎯 UX Goal

Authentication must feel:

- Secure
- Clear
- Mandatory
- Persistent
- Professional

User must never wonder:

"Am I logged in?"

---

# 🏁 Final Requirement

No AI interaction must be possible
without valid DeepSeek authentication.
