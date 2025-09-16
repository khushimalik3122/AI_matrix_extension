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
exports.ProviderManager = void 0;
const vscode = __importStar(require("vscode"));
const perplexityProvider_1 = require("../providers/perplexityProvider");
const geminiProvider_1 = require("../providers/geminiProvider");
const groqProvider_1 = require("../providers/groqProvider");
const logger_1 = require("../utils/logger");
class ProviderManager {
    constructor(settingsManager) {
        this.settingsManager = settingsManager;
        this.providers = new Map();
        this.activeProvider = null;
        this.fallbackProviders = [];
        this.loadProviders();
        // Listen for configuration changes to reload providers
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('my-ai-extension.apiKeys')) {
                this.loadProviders();
            }
        });
    }
    async loadProviders() {
        this.providers.clear();
        const perplexityKey = await this.settingsManager.getApiKey('perplexity');
        if (perplexityKey) {
            this.providers.set('Perplexity', new perplexityProvider_1.PerplexityProvider({ apiKey: perplexityKey }));
        }
        const geminiKey = await this.settingsManager.getApiKey('gemini');
        if (geminiKey) {
            this.providers.set('Gemini', new geminiProvider_1.GeminiProvider({ apiKey: geminiKey }));
        }
        const groqKey = await this.settingsManager.getApiKey('groq');
        if (groqKey) {
            this.providers.set('Groq', new groqProvider_1.GroqProvider({ apiKey: groqKey }));
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
}
exports.ProviderManager = ProviderManager;
//# sourceMappingURL=providerManager.js.map