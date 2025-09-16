import * as vscode from 'vscode';
import { AIProvider } from '../types/aiProvider';
import { PerplexityProvider } from '../providers/perplexityProvider';
import { GeminiProvider } from '../providers/geminiProvider';
import { GroqProvider } from '../providers/groqProvider';
import { logger } from '../utils/logger';
import { SettingsManager } from './settingsManager';

export class ProviderManager implements AIProvider {
    private providers = new Map<string, AIProvider>();
    private activeProvider: AIProvider | null = null;
    private fallbackProviders: AIProvider[] = [];

    constructor(private settingsManager: SettingsManager) {
        this.loadProviders();
        // Listen for configuration changes to reload providers
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('my-ai-extension.apiKeys')) {
                this.loadProviders();
            }
        });
    }

    private async loadProviders(): Promise<void> {
        this.providers.clear();
        
        const perplexityKey = await this.settingsManager.getApiKey('perplexity');
        if (perplexityKey) {
            this.providers.set('Perplexity', new PerplexityProvider({ apiKey: perplexityKey }));
        }
        
        const geminiKey = await this.settingsManager.getApiKey('gemini');
        if (geminiKey) {
            this.providers.set('Gemini', new GeminiProvider({ apiKey: geminiKey }));
        }

        const groqKey = await this.settingsManager.getApiKey('groq');
        if (groqKey) {
            this.providers.set('Groq', new GroqProvider({ apiKey: groqKey }));
        }

        if (this.providers.size > 0) {
            this.setActiveProvider(this.providers.keys().next().value);
            logger.log(`Loaded ${this.providers.size} AI providers.`);
        } else {
            this.activeProvider = null;
            this.fallbackProviders = [];
            logger.warn("No AI providers configured. Extension functionality will be limited.");
        }
    }
    
    // ... (rest of the class remains the same)
}

