My AI Extension - User Guide
Welcome to the User Guide for My AI Extension! This guide will walk you through installing, configuring, and using the powerful features of your new AI assistant for VS Code.

1. Installation
Open Visual Studio Code.

Navigate to the Extensions view by clicking on the square icon in the sidebar or pressing Ctrl+Shift+X.

Search for "My AI Extension".

Click the Install button.

Once installed, you may need to reload VS Code.

2. Configuration: Setting Up Your API Keys
To use the AI features, you need to connect to at least one AI provider (like Groq, Gemini, or Perplexity).

Open the Settings editor by pressing Ctrl+, or navigating to File > Preferences > Settings.

Search for "My AI Extension".

Under My Ai Extension: Api Keys, you will see fields for each provider.

Enter your API key into the desired field.

Security Note: The first time you enter an API key, the extension will automatically move it to VS Code's secure Secret Storage for your protection. The setting in settings.json will be cleared.

3. Core Features
3.1. AI Chat Panel
The chat panel is your central hub for interacting with the AI.

How to Open:

Press Ctrl+Shift+P to open the Command Palette.

Type "Start AI Chat" and press Enter.

Using the Chat:

Select a Provider: Use the dropdown at the top to choose your active AI provider.

Choose a Context:

Workspace: The AI will perform a semantic search across your entire codebase to find relevant context for your question. This is best for general questions about your project.

Current File: The AI will only use the content of your currently active file as context. This is best for specific questions about the code in front of you.

Ask a Question: Type your question in the input box and press Enter. The AI will stream its response.

3.2. Inline Code Completions
Get real-time, context-aware code suggestions as you type.

How it Works: Simply start typing in a supported file (like TypeScript, Python, or Java). The extension will automatically analyze the surrounding code and your workspace to suggest completions.

Accepting a Suggestion: Press the Tab key to accept the grayed-out suggestion.

3.3. Code Refactoring & Analysis (Right-Click Menu)
Access powerful AI actions directly from the context menu in your editor.

Select a block of code in your editor.

Right-click on the selection.

Navigate to the AI Assistant submenu.

Choose an action:

Generate Unit Tests: Creates a new test file for the selected code.

Suggest Optimizations: Provides suggestions to improve the performance of the code.

Detect Vulnerabilities: Scans the selection for common security issues.

Generate Docstring: Creates a documentation comment for the selected function or class.

Thank you for using My AI Extension! We hope it boosts your productivity.