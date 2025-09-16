"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAIProvider = void 0;
const logger_1 = require("../utils/logger");
/**
 * An abstract base class that provides common functionality for AIProvider implementations.
 * It handles storing configuration, retry logic, and defines the structure
 * that concrete providers must follow.
 */
class BaseAIProvider {
    /**
     * Initializes the base provider with authentication and policy configuration.
     * @param auth The authentication configuration.
     * @param policy Optional custom policies. Uses defaults if not provided.
     */
    constructor(auth, policy) {
        this.auth = auth;
        // Set default policies and merge any overrides
        this.policy = {
            rateLimiting: {
                requestsPerMinute: 60,
                ...policy?.rateLimiting,
            },
            errorHandling: {
                maxRetries: 3,
                initialRetryDelayMs: 1000,
                ...policy?.errorHandling,
            },
        };
    }
    // --- Public methods implementing the AIProvider interface ---
    async generateResponse(prompt, options) {
        // Use the retry wrapper around the actual generation logic
        return this.requestWithRetries(() => this._generate(prompt, options));
    }
    async *streamResponse(prompt, options) {
        if (!this.capabilities.streaming) {
            throw new Error("This provider does not support streaming responses.");
        }
        // Note: Retry logic for streams is more complex and might involve re-establishing
        // the connection. For simplicity, we delegate directly here but a robust implementation
        // would handle stream interruptions.
        yield* this._stream(prompt, options);
    }
    async generateVisionResponse(prompt, images, options) {
        if (!this.capabilities.vision) {
            throw new Error("This provider does not support vision capabilities.");
        }
        return this.requestWithRetries(() => this._generateVision(prompt, images, options));
    }
    // --- Common Helper Methods ---
    /**
     * A wrapper function that adds retry logic with exponential backoff to an async operation.
     * @param fn The async function to execute.
     * @returns The result of the async function.
     */
    async requestWithRetries(fn) {
        let attempts = 0;
        let delay = this.policy.errorHandling.initialRetryDelayMs;
        while (attempts < this.policy.errorHandling.maxRetries) {
            try {
                return await fn();
            }
            catch (error) {
                attempts++;
                if (attempts >= this.policy.errorHandling.maxRetries) {
                    logger_1.logger.error(`Request failed after ${attempts} attempts. Error: ${error.message}`);
                    throw error; // Re-throw the final error
                }
                logger_1.logger.log(`Attempt ${attempts} failed. Retrying in ${delay}ms...`);
                await new Promise(res => setTimeout(res, delay));
                delay *= 2; // Exponential backoff
            }
        }
        // This line should theoretically not be reached, but is a fallback.
        throw new Error("Request failed after maximum retries.");
    }
}
exports.BaseAIProvider = BaseAIProvider;
//# sourceMappingURL=baseAIProvider.js.map