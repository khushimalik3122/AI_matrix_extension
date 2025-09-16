"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderManager = void 0;
const perplexityProvider_1 = require("../providers/perplexityProvider");
const geminiProvider_1 = require("../providers/geminiProvider");
const groqProvider_1 = require("../providers/groqProvider");
const logger_1 = require("../utils/logger");
class ProviderManager {
    constructor(settingsManager) {
        this.capabilities = {
            codeGeneration: true,
            textExplanation: true,
            projectScaffolding: true,
            streaming: true,
            vision: true, // add missing property
        };
        this.auth = {};
        this.policy = {
            rateLimiting: { requestsPerMinute: 60 }, // Set appropriate requests per minute
            errorHandling: { maxRetries: 3, initialRetryDelayMs: 1000 } // Provide appropriate error handling config here
        };
        this.providers = new Map();
        this.activeProvider = null;
        this.fallbackProviders = [];
        this.settingsManager = settingsManager;
        // Fire-and-forget provider loading
        void this.loadProviders();
    }
    async generateResponse(arg1, options) {
        const prompt = typeof arg1 === 'string' ? arg1 : arg1.prompt;
        let opts;
        if (typeof arg1 === 'string') {
            opts = options;
        }
        else {
            const { prompt: _p, ...rest } = arg1;
            opts = rest;
        }
        if (this.activeProvider) {
            return this.activeProvider.generateResponse(prompt, opts);
        }
        throw new Error("No active provider");
    }
    async *streamResponse(prompt, options) {
        if (this.activeProvider && typeof this.activeProvider.streamResponse === 'function') {
            for await (const token of this.activeProvider.streamResponse(prompt, options)) {
                yield token;
            }
            return;
        }
        throw new Error("No active provider or streamResponse not implemented");
    }
    async generateVisionResponse(prompt, images, options) {
        if (this.activeProvider && typeof this.activeProvider.generateVisionResponse === 'function') {
            return this.activeProvider.generateVisionResponse(prompt, images, options);
        }
        throw new Error("No active provider or generateVisionResponse not implemented");
    }
    setActiveProvider(providerName) {
        const provider = this.providers.get(providerName);
        if (provider) {
            this.activeProvider = provider;
        }
    }
    async loadProviders() {
        this.providers.clear();
        const perplexityKey = await this.settingsManager.getApiKey('perplexity');
        if (perplexityKey) {
            const auth = { type: 'apiKey', key: perplexityKey };
            this.providers.set('Perplexity', new perplexityProvider_1.PerplexityProvider(auth));
        }
        const geminiKey = await this.settingsManager.getApiKey('gemini');
        if (geminiKey) {
            const auth = { type: 'apiKey', key: geminiKey };
            this.providers.set('Gemini', new geminiProvider_1.GeminiProvider(auth));
        }
        const groqKey = await this.settingsManager.getApiKey('groq');
        if (groqKey) {
            const auth = { type: 'apiKey', key: groqKey };
            this.providers.set('Groq', new groqProvider_1.GroqProvider(auth));
        }
        if (this.providers.size > 0) {
            this.setActiveProvider(this.providers.keys().next().value);
            logger_1.logger.log(`Loaded ${this.providers.size} AI providers.`);
        }
        else {
            this.activeProvider = null;
            this.fallbackProviders = [];
            logger_1.logger.warn("No AI providers configured. Extension functionality will be limited.");
        }
    }
    getAvailableProviders() {
        return Array.from(this.providers.keys());
    }
    getActiveProviderName() {
        for (const [name, provider] of this.providers.entries()) {
            if (provider === this.activeProvider)
                return name;
        }
        return '';
    }
}
exports.ProviderManager = ProviderManager;
//# sourceMappingURL=providerManager.js.map