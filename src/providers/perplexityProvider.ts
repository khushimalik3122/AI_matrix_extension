import axios, { AxiosError } from 'axios';
import { AuthenticationConfig, GenerationOptions } from "../types/aiProvider";
import { BaseAIProvider } from "./baseAIProvider";
import { logger } from '../utils/logger';

// Define available Perplexity models
export type PerplexityModel =
    | 'pplx-7b-online'
    | 'pplx-70b-online'
    | 'pplx-7b-chat'
    | 'pplx-70b-chat'
    | 'mistral-7b-instruct'
    | 'codellama-34b-instruct'
    | 'llama-2-70b-chat'
    | 'replit-code-v1-3b';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

/**
 * An AI Provider implementation for the Perplexity API.
 */
export class PerplexityProvider extends BaseAIProvider {
    private readonly model: PerplexityModel;
    private readonly apiKey: string;

    public readonly capabilities = {
        codeGeneration: true,
        textExplanation: true,
        projectScaffolding: true,
        streaming: true,
        vision: false,
    };

    constructor(
        auth: AuthenticationConfig,
        model: PerplexityModel = 'pplx-70b-online'
    ) {
        // Enforce API key authentication for this provider
        if (auth.type !== 'apiKey' || !auth.key) {
            throw new Error("PerplexityProvider requires an API key for authentication.");
        }
        
        super(auth);
        this.model = model;
        this.apiKey = auth.key;
    }

    /**
     * Implements the core logic for a single, non-streaming API request.
     */
    protected async _generate(prompt: string, options?: GenerationOptions): Promise<string> {
        const payload = {
            model: this.model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: options?.maxTokens,
            temperature: options?.temperature,
        };

        try {
            const response = await axios.post(PERPLEXITY_API_URL, payload, {
                headers: this.getAuthHeaders(),
            });
            return response.data.choices[0].message.content;
        } catch (error) {
            this.handleApiError(error, 'Error during generate response');
            // This return is for type safety, as handleApiError will throw.
            return ''; 
        }
    }

    /**
     * Implements the core logic for a streaming API request.
     */
    protected async *_stream(prompt: string, options?: GenerationOptions): AsyncGenerator<string> {
        const payload = {
            model: this.model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: options?.maxTokens,
            temperature: options?.temperature,
            stream: true,
        };

        try {
            const response = await axios.post(PERPLEXITY_API_URL, payload, {
                headers: this.getAuthHeaders(),
                responseType: 'stream',
            });
            
            for await (const chunk of response.data) {
                const lines = chunk.toString('utf8').split('\n').filter((line: string) => line.trim().startsWith('data: '));
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
        } catch (error) {
            this.handleApiError(error, 'Error during stream response');
        }
    }

    protected async _generateVision(prompt: string, images: { mimeType: 'image/png' | 'image/jpeg'; data: string }[], options?: GenerationOptions): Promise<string> {
        // Not supported in this example provider
        throw new Error('Vision is not supported by PerplexityProvider.');
    }



    /**
     * Creates the authorization headers for API requests.
     */
    private getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
    }

    /**
     * A centralized error handler for Axios requests to log and re-throw standardized errors.
     */
    private handleApiError(error: any, contextMessage: string): never {
        if (error instanceof AxiosError && error.response) {
            const { status, data } = error.response;
            const errorMessage = data?.error?.message || JSON.stringify(data);
            logger.error(`${contextMessage}: [${status}] ${errorMessage}`);
            throw new Error(`API Error: [${status}] ${errorMessage}`);
        } else {
            logger.error(`${contextMessage}: ${error.message}`);
            throw new Error(`An unexpected error occurred: ${error.message}`);
        }
    }
}
