import * as vscode from 'vscode';
import { logger, LogLevel } from '../utils/logger';

const CONFIG_SECTION = 'my-ai-extension';
const SECRET_STORAGE_KEYS = {
    perplexity: 'perplexityApiKey',
    gemini: 'geminiApiKey',
    groq: 'groqApiKey',
};
const SETTINGS_VERSION_KEY = 'settingsVersion';
const CURRENT_SETTINGS_VERSION = 1;

export class SettingsManager {
    constructor(private context: vscode.ExtensionContext) {}

    public async initialize(): Promise<void> {
        await this.migrateSettings();
    }

    public async getApiKey(provider: 'perplexity' | 'gemini' | 'groq'): Promise<string | undefined> {
        const secretKey = SECRET_STORAGE_KEYS[provider];
        let apiKey = await this.context.secrets.get(secretKey);

        if (!apiKey) {
            // If not in secret storage, try to migrate from settings.json
            const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
            const apiKeyFromSettings = config.get<string>(`apiKeys.${provider}`);
            
            if (apiKeyFromSettings) {
                await this.setApiKey(provider, apiKeyFromSettings);
                // Clear the setting from settings.json for security
                await config.update(`apiKeys.${provider}`, undefined, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage(`Moved ${provider} API key to secure storage.`);
                return apiKeyFromSettings;
            }
        }
        return apiKey;
    }

    public async setApiKey(provider: 'perplexity' | 'gemini' | 'groq', apiKey: string): Promise<void> {
        const secretKey = SECRET_STORAGE_KEYS[provider];
        await this.context.secrets.store(secretKey, apiKey);
    }

    public isInlineCompletionEnabled(): boolean {
        return vscode.workspace.getConfiguration(CONFIG_SECTION).get<boolean>('inlineCompletion.enabled', true);
    }

    public getLogLevel(): LogLevel {
        const level = vscode.workspace.getConfiguration(CONFIG_SECTION).get<string>('general.logLevel', 'INFO');
        return LogLevel[level as keyof typeof LogLevel] || LogLevel.INFO;
    }

    private async migrateSettings(): Promise<void> {
        const storedVersion = this.context.globalState.get<number>(SETTINGS_VERSION_KEY, 0);

        if (storedVersion < CURRENT_SETTINGS_VERSION) {
            logger.log(`Migrating settings from version ${storedVersion} to ${CURRENT_SETTINGS_VERSION}`);

            if (storedVersion < 1) {
                // Migration logic for version 1: Move API keys from old settings to secret storage.
                // The getApiKey method now handles this automatically, so we just need to call it.
                await this.getApiKey('perplexity');
                await this.getApiKey('gemini');
                await this.getApiKey('groq');
            }

            // Update the stored version
            await this.context.globalState.update(SETTINGS_VERSION_KEY, CURRENT_SETTINGS_VERSION);
            logger.log('Settings migration complete.');
        }
    }
}
