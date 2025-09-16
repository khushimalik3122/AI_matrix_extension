import * as vscode from 'vscode';
import { AIProvider, AuthenticationConfig, GenerationOptions, ProviderPolicy } from '../types/aiProvider';
import { PerplexityProvider } from '../providers/perplexityProvider';
import { GeminiProvider } from '../providers/geminiProvider';
import { GroqProvider } from '../providers/groqProvider';
import { logger } from '../utils/logger';
import { SettingsManager } from './settingsManager';

// Helper type used for overload normalization
type PromptObj = { prompt: string } & Record<string, any>;

export class ProviderManager implements AIProvider {
    public capabilities = {
        codeGeneration: true,
        textExplanation: true,
        projectScaffolding: true,
        streaming: true,
        vision: true, // add missing property
    };

    public auth: AuthenticationConfig = {} as AuthenticationConfig;
    public policy: ProviderPolicy = {
        rateLimiting: { requestsPerMinute: 60 }, // Set appropriate requests per minute
        errorHandling: { maxRetries: 3, initialRetryDelayMs: 1000 } // Provide appropriate error handling config here
    };

    public providers: Map<string, AIProvider> = new Map();
    public activeProvider: AIProvider | null = null;
    public fallbackProviders: AIProvider[] = [];
    public settingsManager: SettingsManager;

    constructor(settingsManager: SettingsManager) {
        this.settingsManager = settingsManager;
        // Fire-and-forget provider loading
        void this.loadProviders();
    }

    // Overloads to allow legacy calls with an options object containing prompt
    public async generateResponse(prompt: string, options?: GenerationOptions): Promise<string>;
    public async generateResponse(options: PromptObj): Promise<string>;
    public async generateResponse(arg1: string | PromptObj, options?: GenerationOptions): Promise<string> {
        const prompt = typeof arg1 === 'string' ? arg1 : arg1.prompt;
        let opts: GenerationOptions | undefined;
        if (typeof arg1 === 'string') {
            opts = options;
        } else {
            const { prompt: _p, ...rest } = arg1;
            opts = rest as GenerationOptions;
        }
        if (this.activeProvider) {
            return this.activeProvider.generateResponse(prompt, opts);
        }
        throw new Error("No active provider");
    }

    public async *streamResponse(prompt: string, options?: GenerationOptions): AsyncGenerator<string, any, any> {
        if (this.activeProvider && typeof this.activeProvider.streamResponse === 'function') {
            for await (const token of this.activeProvider.streamResponse(prompt, options)) {
                yield token;
            }
            return;
        }
        throw new Error("No active provider or streamResponse not implemented");
    }

    public async generateVisionResponse(prompt: string, images: { mimeType: "image/png" | "image/jpeg"; data: string; }[], options?: GenerationOptions): Promise<string> {
        if (this.activeProvider && typeof this.activeProvider.generateVisionResponse === 'function') {
            return this.activeProvider.generateVisionResponse(prompt, images, options);
        }
        throw new Error("No active provider or generateVisionResponse not implemented");
    }

    public setActiveProvider(providerName: string): void {
        const provider = this.providers.get(providerName);
        if (provider) {
            this.activeProvider = provider;
        }
    }

    private async loadProviders(): Promise<void> {
        this.providers.clear();


        
        const perplexityKey = await this.settingsManager.getApiKey('perplexity');
        if (perplexityKey) {
            const auth: AuthenticationConfig = { type: 'apiKey', key: perplexityKey };
            this.providers.set('Perplexity', new PerplexityProvider(auth));
        }
        
        const geminiKey = await this.settingsManager.getApiKey('gemini');
        if (geminiKey) {
            const auth: AuthenticationConfig = { type: 'apiKey', key: geminiKey };
            this.providers.set('Gemini', new GeminiProvider(auth));
        }

        const groqKey = await this.settingsManager.getApiKey('groq');
        if (groqKey) {
            const auth: AuthenticationConfig = { type: 'apiKey', key: groqKey };
            this.providers.set('Groq', new GroqProvider(auth));
        }

        if (this.providers.size > 0) {
            this.setActiveProvider(this.providers.keys().next().value as string);
            logger.log(`Loaded ${this.providers.size} AI providers.`);
        } else {
            this.activeProvider = null;
            this.fallbackProviders = [];
            logger.warn("No AI providers configured. Extension functionality will be limited.");
        }
    }

    public getAvailableProviders(): string[] {
        return Array.from(this.providers.keys());
    }

    public getActiveProviderName(): string {
        for (const [name, provider] of this.providers.entries()) {
            if (provider === this.activeProvider) return name;
        }
        return '';
    }
}
