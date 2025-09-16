import { AIProvider, AuthenticationConfig, GenerationOptions, ProviderPolicy } from "../types/aiProvider";
import { logger } from "../utils/logger";

/**
 * An abstract base class that provides common functionality for AIProvider implementations.
 * It handles storing configuration, retry logic, and defines the structure
 * that concrete providers must follow.
 */
export abstract class BaseAIProvider implements AIProvider {
    public readonly auth: AuthenticationConfig;
    public readonly policy: ProviderPolicy;
    
    /**
     * Each concrete provider MUST define its specific capabilities.
     */
    public abstract readonly capabilities: {
        codeGeneration: boolean;
        textExplanation: boolean;
        projectScaffolding: boolean;
        streaming: boolean;
        vision: boolean;
    };

    /**
     * Initializes the base provider with authentication and policy configuration.
     * @param auth The authentication configuration.
     * @param policy Optional custom policies. Uses defaults if not provided.
     */
    constructor(
        auth: AuthenticationConfig,
        policy?: Partial<ProviderPolicy>
    ) {
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

    public async generateResponse(prompt: string, options?: GenerationOptions): Promise<string> {
        // Use the retry wrapper around the actual generation logic
        return this.requestWithRetries(
            () => this._generate(prompt, options)
        );
    }

    public async *streamResponse(prompt: string, options?: GenerationOptions): AsyncGenerator<string> {
        if (!this.capabilities.streaming) {
            throw new Error("This provider does not support streaming responses.");
        }
        // Note: Retry logic for streams is more complex and might involve re-establishing
        // the connection. For simplicity, we delegate directly here but a robust implementation
        // would handle stream interruptions.
        yield* this._stream(prompt, options);
    }

    public async generateVisionResponse(prompt: string, images: { mimeType: 'image/png' | 'image/jpeg', data: string }[], options?: GenerationOptions): Promise<string> {
        if (!this.capabilities.vision) {
            throw new Error("This provider does not support vision capabilities.");
        }
        return this.requestWithRetries(
            () => this._generateVision(prompt, images, options)
        );
    }

    // --- Abstract methods for concrete implementations ---

    /**
     * The core logic for making a single, complete API request.
     * Concrete classes MUST implement this method.
     * @param prompt The user's prompt.
     * @param options Generation options.
     * @returns The full text response.
     */
    protected abstract _generate(prompt: string, options?: GenerationOptions): Promise<string>;

    /**
     * The core logic for making a streaming API request.
     * Concrete classes that support streaming MUST implement this method.
     * @param prompt The user's prompt.
     * @param options Generation options.
     * @returns An async generator yielding text chunks.
     */
    protected abstract _stream(prompt: string, options?: GenerationOptions): AsyncGenerator<string>;

    /**
     * The core logic for making a vision-based API request.
     * Concrete classes that support vision MUST implement this method.
     * @param prompt The user's prompt.
     * @param images Array of image objects with mimeType and base64 data.
     * @param options Generation options.
     * @returns The full text response.
     */
    protected abstract _generateVision(prompt: string, images: { mimeType: 'image/png' | 'image/jpeg', data: string }[], options?: GenerationOptions): Promise<string>;


    // --- Common Helper Methods ---

    /**
     * A wrapper function that adds retry logic with exponential backoff to an async operation.
     * @param fn The async function to execute.
     * @returns The result of the async function.
     */
    protected async requestWithRetries<T>(fn: () => Promise<T>): Promise<T> {
        let attempts = 0;
        let delay = this.policy.errorHandling.initialRetryDelayMs;

        while (attempts < this.policy.errorHandling.maxRetries) {
            try {
                return await fn();
            } catch (error: any) {
                attempts++;
                if (attempts >= this.policy.errorHandling.maxRetries) {
                    logger.error(`Request failed after ${attempts} attempts. Error: ${error.message}`);
                    throw error; // Re-throw the final error
                }
                
                logger.log(`Attempt ${attempts} failed. Retrying in ${delay}ms...`);
                await new Promise(res => setTimeout(res, delay));
                delay *= 2; // Exponential backoff
            }
        }
        // This line should theoretically not be reached, but is a fallback.
        throw new Error("Request failed after maximum retries.");
    }
}

