My AI Extension - Troubleshooting FAQ
This guide provides solutions to common issues you might encounter while using the extension.

Q: Why isn't the AI Chat responding?
No API Key: The most common reason is a missing or incorrect API key. Go to the settings (Ctrl+,), search for "My AI Extension", and ensure you have entered a valid key for at least one provider.

Network Issues: Check your internet connection. The extension needs to connect to external AI services.

API Service Outage: The AI provider's service may be temporarily down. You can check their status page (e.g., status.openai.com, status.anthropic.com). Try switching to a different provider in the chat UI.

Check the Logs: Open the Output panel (Ctrl+Shift+U), and select "My AI Extension" from the dropdown. Look for any error messages.

Q: Inline code completions are not appearing.
Feature Disabled: Make sure the feature is enabled in the settings. Check that my-ai-extension.inlineCompletion.enabled is set to true.

Unsupported Language: While many languages are supported, completions may not be available for all file types.

Insufficient Context: The AI needs enough context to provide a suggestion. Try typing a few more lines of code.

Conflict with Another Extension: Another code completion extension (like GitHub Copilot) might be interfering. Try temporarily disabling other similar extensions to see if that resolves the issue.

Q: The "Generate Unit Tests" command fails or produces bad code.
No Code Selected: Ensure you have a valid function or class selected in the editor before running the command.

Complex Code: For highly complex or domain-specific code, the AI may struggle. Try selecting a smaller, more self-contained piece of logic.

Provider Quality: The quality of the generated code can vary between AI providers. Try switching to a different provider in the chat UI and running the command again.

Q: After entering my API key, the setting disappeared!
This is expected behavior. For your security, the extension moves your API keys from the text-based settings.json file into VS Code's encrypted Secret Storage. The extension can still access the key, but it is no longer visible in your settings file.

Q: How do I report a bug or suggest a feature?
We'd love to hear from you! Please open an issue on our GitHub repository. Provide a detailed description of the bug, including steps to reproduce it and any relevant error messages from the Output panel.