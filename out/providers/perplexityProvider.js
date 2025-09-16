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
exports.PerplexityProvider = void 0;
const axios_1 = __importStar(require("axios"));
const baseAIProvider_1 = require("./baseAIProvider");
const logger_1 = require("../utils/logger");
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
/**
 * An AI Provider implementation for the Perplexity API.
 */
class PerplexityProvider extends baseAIProvider_1.BaseAIProvider {
    constructor(auth, model = 'pplx-70b-online') {
        // Enforce API key authentication for this provider
        if (auth.type !== 'apiKey' || !auth.key) {
            throw new Error("PerplexityProvider requires an API key for authentication.");
        }
        super(auth);
        this.capabilities = {
            codeGeneration: true,
            textExplanation: true,
            projectScaffolding: true,
            streaming: true,
            vision: false,
        };
        this.model = model;
        this.apiKey = auth.key;
    }
    /**
     * Implements the core logic for a single, non-streaming API request.
     */
    async _generate(prompt, options) {
        const payload = {
            model: this.model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: options?.maxTokens,
            temperature: options?.temperature,
        };
        try {
            const response = await axios_1.default.post(PERPLEXITY_API_URL, payload, {
                headers: this.getAuthHeaders(),
            });
            return response.data.choices[0].message.content;
        }
        catch (error) {
            this.handleApiError(error, 'Error during generate response');
            // This return is for type safety, as handleApiError will throw.
            return '';
        }
    }
    /**
     * Implements the core logic for a streaming API request.
     */
    async *_stream(prompt, options) {
        const payload = {
            model: this.model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: options?.maxTokens,
            temperature: options?.temperature,
            stream: true,
        };
        try {
            const response = await axios_1.default.post(PERPLEXITY_API_URL, payload, {
                headers: this.getAuthHeaders(),
                responseType: 'stream',
            });
            for await (const chunk of response.data) {
                const lines = chunk.toString('utf8').split('\n').filter((line) => line.trim().startsWith('data: '));
                for (const line of lines) {
                    const message = line.replace(/^data: /, '');
                    if (message === '[DONE]') {
                        return; // Stream finished
                    }
                    const parsed = JSON.parse(message);
                    const content = parsed.choices[0]?.delta?.content;
                    if (content) {
                        yield content;
                    }
                }
            }
        }
        catch (error) {
            this.handleApiError(error, 'Error during stream response');
        }
    }
    async _generateVision(prompt, images, options) {
        // Not supported in this example provider
        throw new Error('Vision is not supported by PerplexityProvider.');
    }
    /**
     * Creates the authorization headers for API requests.
     */
    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
    }
    /**
     * A centralized error handler for Axios requests to log and re-throw standardized errors.
     */
    handleApiError(error, contextMessage) {
        if (error instanceof axios_1.AxiosError && error.response) {
            const { status, data } = error.response;
            const errorMessage = data?.error?.message || JSON.stringify(data);
            logger_1.logger.error(`${contextMessage}: [${status}] ${errorMessage}`);
            throw new Error(`API Error: [${status}] ${errorMessage}`);
        }
        else {
            logger_1.logger.error(`${contextMessage}: ${error.message}`);
            throw new Error(`An unexpected error occurred: ${error.message}`);
        }
    }
}
exports.PerplexityProvider = PerplexityProvider;
//# sourceMappingURL=perplexityProvider.js.map