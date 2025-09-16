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
        this.providerId = "groq";
        this.capabilities = {
            streaming: true,
            codeGeneration: true,
            contextWindow: true,
        };
    }
    async generateResponse(options) {
        // ... (implementation remains the same)
        return "Not implemented for streaming example";
    }
    async streamResponse(options, onData, cancellationToken) {
        const model = options.model || GroqModel.LLAMA3_8B;
        const source = axios_1.default.CancelToken.source();
        const registration = cancellationToken.onCancellationRequested(() => {
            logger_1.logger.log("Cancellation requested for Groq stream. Aborting request.");
            source.cancel("Operation canceled by the user.");
        });
        try {
            const response = await this.axiosInstance.post(GroqProvider.API_URL, {
                messages: [{ role: 'user', content: options.prompt }],
                model: model,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.maxTokens ?? 1024,
                stream: true,
            }, {
                responseType: 'stream',
                cancelToken: source.token,
            });
            // The promise will resolve when headers are received, but the stream is ongoing.
            // We wrap the stream handling in a new promise to await its completion.
            await new Promise((resolve, reject) => {
                response.data.on('data', (chunk) => {
                    if (cancellationToken.isCancellationRequested) {
                        return; // Stop processing if cancelled
                    }
                    const lines = chunk.toString('utf8').split('\n').filter(line => line.trim() !== '');
                    for (const line of lines) {
                        if (line.trim() === 'data: [DONE]') {
                            resolve();
                            return;
                        }
                        if (line.startsWith('data: ')) {
                            try {
                                const json = JSON.parse(line.substring(6));
                                const content = json.choices[0]?.delta?.content;
                                if (content) {
                                    onData(content);
                                }
                            }
                            catch (error) {
                                logger_1.logger.error('Error parsing Groq stream chunk:', error);
                                // Don't reject here, just log and continue
                            }
                        }
                    }
                });
                response.data.on('error', (error) => {
                    logger_1.logger.error("Error in Groq stream:", error);
                    reject(error);
                });
                response.data.on('end', () => {
                    resolve();
                });
            });
        }
        catch (error) {
            if (axios_1.default.isCancel(error)) {
                logger_1.logger.log('Groq stream request was cancelled.');
            }
            else {
                logger_1.logger.error('Error in Groq stream request:', error);
                throw this.handleApiError(error);
            }
        }
        finally {
            registration.dispose();
        }
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
}
exports.GroqProvider = GroqProvider;
GroqProvider.API_URL = 'https://api.groq.com/openai/v1/chat/completions';
//# sourceMappingURL=groqProvider.js.map