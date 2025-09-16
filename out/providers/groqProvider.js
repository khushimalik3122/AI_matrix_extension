"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroqProvider = exports.GroqModel = void 0;
const axios_1 = __importDefault(require("axios"));
const baseAIProvider_1 = require("./baseAIProvider");
const logger_1 = require("../utils/logger");
// ... (GroqModel enum remains the same)
var GroqModel;
(function (GroqModel) {
    GroqModel["LLAMA3_8B"] = "llama3-8b-8192";
    GroqModel["LLAMA3_70B"] = "llama3-70b-8192";
    GroqModel["MIXTRAL_8X7B"] = "mixtral-8x7b-32768";
    GroqModel["GEMMA_7B"] = "gemma-7b-it";
})(GroqModel || (exports.GroqModel = GroqModel = {}));
class GroqProvider extends baseAIProvider_1.BaseAIProvider {
    constructor() {
        super(...arguments);
        this.capabilities = {
            codeGeneration: true,
            textExplanation: true,
            projectScaffolding: true,
            streaming: true,
            vision: false,
        };
    }
    async _generate(prompt, options) {
        try {
            const response = await axios_1.default.post(GroqProvider.API_URL, {
                messages: [{ role: 'user', content: prompt }],
                model: GroqModel.LLAMA3_8B,
                temperature: options?.temperature ?? 0.7,
                max_tokens: options?.maxTokens ?? 1024,
                stream: false,
            }, { headers: this.getHeaders() });
            return response.data.choices?.[0]?.message?.content ?? '';
        }
        catch (error) {
            throw this.handleApiError(error);
        }
    }
    async *_stream(prompt, options) {
        try {
            const response = await axios_1.default.post(GroqProvider.API_URL, {
                messages: [{ role: 'user', content: prompt }],
                model: GroqModel.LLAMA3_8B,
                temperature: options?.temperature ?? 0.7,
                max_tokens: options?.maxTokens ?? 1024,
                stream: true,
            }, { headers: this.getHeaders(), responseType: 'stream' });
            for await (const chunk of response.data) {
                const lines = chunk.toString('utf8').split('\n').filter((line) => line.trim().startsWith('data: '));
                for (const line of lines) {
                    const msg = line.substring(6);
                    if (msg === '[DONE]')
                        return;
                    try {
                        const json = JSON.parse(msg);
                        const content = json.choices?.[0]?.delta?.content;
                        if (content)
                            yield content;
                    }
                    catch (e) {
                        logger_1.logger.warn('Failed to parse Groq stream chunk');
                    }
                }
            }
        }
        catch (error) {
            throw this.handleApiError(error);
        }
    }
    async _generateVision(prompt, images, options) {
        throw new Error('Vision is not supported by GroqProvider.');
    }
    // ... (getContextWindowSize and handleApiError methods remain the same)
    handleApiError(error) {
        if (error.response) {
            const { status, data } = error.response;
            const message = data?.error?.message || `HTTP error! status: ${status}`;
            return new Error(message);
        }
        else if (error.request) {
            return new Error('The request was made but no response was received from Groq.');
        }
        else {
            return new Error(`Error setting up the request to Groq: ${error.message}`);
        }
    }
    getHeaders() {
        // BaseAIProvider.auth ensures we have config; using apiKey style for Groq
        const apiKey = this.auth?.key;
        return {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
    }
}
exports.GroqProvider = GroqProvider;
GroqProvider.API_URL = 'https://api.groq.com/openai/v1/chat/completions';
//# sourceMappingURL=groqProvider.js.map