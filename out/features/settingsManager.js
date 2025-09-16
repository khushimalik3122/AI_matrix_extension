"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsManager = void 0;
const vscode = __importStar(require("vscode"));
const logger_1 = require("../utils/logger");
const CONFIG_SECTION = 'my-ai-extension';
const SECRET_STORAGE_KEYS = {
    perplexity: 'perplexityApiKey',
    gemini: 'geminiApiKey',
    groq: 'groqApiKey',
};
const SETTINGS_VERSION_KEY = 'settingsVersion';
const CURRENT_SETTINGS_VERSION = 1;
class SettingsManager {
    constructor(context) {
        this.context = context;
    }
    async initialize() {
        await this.migrateSettings();
    }
    async getApiKey(provider) {
        const secretKey = SECRET_STORAGE_KEYS[provider];
        let apiKey = await this.context.secrets.get(secretKey);
        if (!apiKey) {
            // If not in secret storage, try to migrate from settings.json
            const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
            const apiKeyFromSettings = config.get(`apiKeys.${provider}`);
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
    async setApiKey(provider, apiKey) {
        const secretKey = SECRET_STORAGE_KEYS[provider];
        await this.context.secrets.store(secretKey, apiKey);
    }
    isInlineCompletionEnabled() {
        return vscode.workspace.getConfiguration(CONFIG_SECTION).get('inlineCompletion.enabled', true);
    }
    getLogLevel() {
        const level = vscode.workspace.getConfiguration(CONFIG_SECTION).get('general.logLevel', 'INFO');
        return logger_1.LogLevel[level] || logger_1.LogLevel.INFO;
    }
    async migrateSettings() {
        const storedVersion = this.context.globalState.get(SETTINGS_VERSION_KEY, 0);
        if (storedVersion < CURRENT_SETTINGS_VERSION) {
            logger_1.logger.log(`Migrating settings from version ${storedVersion} to ${CURRENT_SETTINGS_VERSION}`);
            if (storedVersion < 1) {
                // Migration logic for version 1: Move API keys from old settings to secret storage.
                // The getApiKey method now handles this automatically, so we just need to call it.
                await this.getApiKey('perplexity');
                await this.getApiKey('gemini');
                await this.getApiKey('groq');
            }
            // Update the stored version
            await this.context.globalState.update(SETTINGS_VERSION_KEY, CURRENT_SETTINGS_VERSION);
            logger_1.logger.log('Settings migration complete.');
        }
    }
}
exports.SettingsManager = SettingsManager;
//# sourceMappingURL=settingsManager.js.map