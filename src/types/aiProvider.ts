/**
 * Configuration for AI model generation options.
 */
export interface GenerationOptions {
    /** Maximum number of tokens to generate. */
    maxTokens?: number;
    /** Controls randomness. Lower is more deterministic. */
    temperature?: number;
    /** The user session ID for conversation history. */
    sessionId?: string;
}

/**
 * Defines the authentication method and credentials for an AI provider.
 * This is a discriminated union based on the 'type' property.
 */
export type AuthenticationConfig =
    | {
        type: 'apiKey';
        /** The API key for the service. */
        key: string;
    }
    | {
        type: 'oauth';
        /** The OAuth token for the service. */
        token: string;
    }
    | {
        type: 'none';
        /** For local or unauthenticated models. */
    };

/**
 * Defines policies for interacting with the AI provider's API.
 */
export interface ProviderPolicy {
    rateLimiting: {
        /** Maximum number of requests allowed per minute. */
        requestsPerMinute: number;
    };
    errorHandling: {
        /** The maximum number of times to retry a failed request. */
        maxRetries: number;
        /** The initial delay in milliseconds before the first retry. */
        initialRetryDelayMs: number;
    };
}

/**
 * Interface for a generic AI service provider.
 * It defines the contract that all concrete provider implementations must follow.
 */
export interface AIProvider {
    /**
     * A record of the provider's capabilities.
     * Features in the extension can check these flags to enable/disable functionality.
     */
    readonly capabilities: {
        codeGeneration: boolean;
        textExplanation: boolean;
        projectScaffolding: boolean;
        streaming: boolean;
        vision: boolean; // Supports image analysis
    };

    /**
     * The authentication configuration in use.
     */
    readonly auth: AuthenticationConfig;

    /**
     * The policies for rate limiting and error handling.
     */
    readonly policy: ProviderPolicy;


    /**
     * Generates a complete text-based response from a given prompt.
     * @param prompt The input text to send to the AI.
     * @param options Optional parameters to control the generation.
     * @returns A promise that resolves to the AI's complete response string.
     */
    generateResponse(prompt: string, options?: GenerationOptions): Promise<string>;

    /**
     * Generates a response as a stream of text chunks.
     * This is useful for providing real-time feedback in UIs like chat panels.
     * @param prompt The input text to send to the AI.
     * @param options Optional parameters to control the generation.
     * @returns An async generator that yields response chunks (strings) as they become available.
     */
    streamResponse(prompt: string, options?: GenerationOptions): AsyncGenerator<string>;

    /**
     * Generates a text-based response from a prompt and a set of images.
     * @param prompt The input text to send to the AI.
     * @param images An array of objects containing the image mimeType and base64-encoded data.
     * @param options Optional parameters to control the generation.
     * @returns A promise that resolves to the AI's response string.
     */
    generateVisionResponse(
        prompt: string,
        images: { mimeType: 'image/png' | 'image/jpeg', data: string }[],
        options?: GenerationOptions
    ): Promise<string>;
}

