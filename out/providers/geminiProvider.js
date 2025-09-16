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
exports.GeminiProvider = void 0;
const axios_1 = __importStar(require("axios"));
const baseAIProvider_1 = require("./baseAIProvider");
const logger_1 = require("../utils/logger");
const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';
/**
 * An AI Provider implementation for Google's Gemini API.
 */
class GeminiProvider extends baseAIProvider_1.BaseAIProvider {
    constructor(auth, model = 'gemini-pro', safetySettings) {
        if (auth.type !== 'apiKey' || !auth.key) {
            throw new Error("GeminiProvider requires an API key for authentication.");
        }
        super(auth);
        this.model = model;
        this.apiKey = auth.key;
        this.safetySettings = safetySettings;
        // Set capabilities dynamically based on the selected model
        this.capabilities = {
            codeGeneration: true,
            textExplanation: true,
            projectScaffolding: true,
            streaming: model === 'gemini-pro', // vision model does not support streaming
            vision: model === 'gemini-pro-vision',
        };
    }
    async _generate(prompt, options) {
        const url = `${GEMINI_API_BASE_URL}${this.model}:generateContent?key=${this.apiKey}`;
        const payload = this.createPayload(prompt, options);
        try {
            const response = await axios_1.default.post(url, payload);
            // Successful response may still be blocked by safety settings
            if (!response.data.candidates || response.data.candidates.length === 0) {
                const blockReason = response.data.promptFeedback?.blockReason || 'No content';
                throw new Error(`Request was blocked by API. Reason: ${blockReason}`);
            }
            return response.data.candidates[0].content.parts[0].text;
        }
        catch (error) {
            this.handleApiError(error, 'Error during generate response');
        }
    }
    async *_stream(prompt, options) {
        const url = `${GEMINI_API_BASE_URL}${this.model}:streamGenerateContent?key=${this.apiKey}`;
        const payload = this.createPayload(prompt, options);
        try {
            const response = await axios_1.default.post(url, payload, { responseType: 'stream' });
            for await (const chunk of response.data) {
                // The stream sends back arrays of JSON objects.
                const chunkStr = chunk.toString('utf8').replace(/^data: /, '');
                try {
                    const parsed = JSON.parse(chunkStr);
                    const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (content) {
                        yield content;
                    }
                }
                catch (e) {
                    logger_1.logger.log(`Could not parse streaming chunk: ${chunkStr}`);
                }
            }
        }
        catch (error) {
            this.handleApiError(error, 'Error during stream response');
        }
    }
    async _generateVision(prompt, images, options) {
        if (this.model !== 'gemini-pro-vision') {
            throw new Error(`_generateVision is only available for gemini-pro-vision model.`);
        }
        const url = `${GEMINI_API_BASE_URL}${this.model}:generateContent?key=${this.apiKey}`;
        const imageParts = images.map(img => ({
            inline_data: { mime_type: img.mimeType, data: img.data }
        }));
        const payload = this.createPayload([{ text: prompt }, ...imageParts], options);
        try {
            const response = await axios_1.default.post(url, payload);
            if (!response.data.candidates || response.data.candidates.length === 0) {
                const blockReason = response.data.promptFeedback?.blockReason || 'No content';
                throw new Error(`Request was blocked by API. Reason: ${blockReason}`);
            }
            return response.data.candidates[0].content.parts[0].text;
        }
        catch (error) {
            this.handleApiError(error, 'Error during vision response');
        }
    }
    createPayload(promptOrParts, options) {
        const parts = typeof promptOrParts === 'string' ? [{ text: promptOrParts }] : promptOrParts;
        return {
            contents: [{ parts }],
            safetySettings: this.safetySettings,
            generationConfig: {
                maxOutputTokens: options?.maxTokens,
                temperature: options?.temperature,
            },
        };
    }
    handleApiError(error, contextMessage) {
        if (error instanceof axios_1.AxiosError && error.response) {
            const { status, data } = error.response;
            const errorMessage = data?.error?.message || JSON.stringify(data);
            logger_1.logger.error(`${contextMessage}: [${status}] ${errorMessage}`);
            throw new Error(`API Error: [${status}] ${errorMessage}`);
        }
        else {
            logger_1.logger.error(`${contextMessage}: ${error.message}`);
            throw error;
        }
    }
}
exports.GeminiProvider = GeminiProvider;
//# sourceMappingURL=geminiProvider.js.map