My AI Extension - Configuration Guide
This guide provides a detailed overview of all the available settings for My AI Extension, allowing you to tailor its behavior to your specific needs.

Accessing Settings
You can configure the extension in two ways:

Settings UI: Press Ctrl+, to open the Settings editor, then search for "My AI Extension".

settings.json: Open the Command Palette (Ctrl+Shift+P), type "Open User Settings (JSON)", and modify the JSON file directly.

General Settings
my-ai-extension.general.logLevel
Description: Controls the verbosity of the extension's logs in the Output panel. This is useful for debugging.

Values: "DEBUG", "INFO", "WARN", "ERROR"

Default: "INFO"

API Key Management
my-ai-extension.apiKeys.<provider>
Example: my-ai-extension.apiKeys.groq

Description: This is where you initially enter your API key for a provider (e.g., Groq, Gemini, Perplexity).

Security: For your security, after you enter an API key here, the extension will automatically move it to VS Code's encrypted Secret Storage, and this setting will be cleared from your settings.json file. The extension will use the securely stored key from then on.

Feature Toggles
my-ai-extension.inlineCompletion.enabled
Description: A master switch to enable or disable the inline code completion feature. If you find the suggestions distracting, you can turn them off here without disabling the rest of the extension.

Values: true, false

Default: true

my-ai-extension.testing.defaultFramework
Description: Sets the default testing framework used by the "Generate Unit Tests" command.

Values: "jest", "vitest", "mocha", "pytest", "junit"

Default: "jest"

Workspace-Specific Settings
All settings can be configured at the workspace level. This is useful for team projects where you want to enforce a specific testing framework or share non-sensitive configurations.

To create workspace-specific settings:

Create a .vscode folder in your project's root directory.

Create a settings.json file inside .vscode.

Add your desired settings to this file. They will override your global user settings for this project only.

Example: .vscode/settings.json

{
    "my-ai-extension.testing.defaultFramework": "vitest",
    "my-ai-extension.general.logLevel": "DEBUG"
}
