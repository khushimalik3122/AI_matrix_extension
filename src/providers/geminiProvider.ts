import axios, { AxiosError } from 'axios';
import { AuthenticationConfig, GenerationOptions } from "../types/aiProvider";
import { BaseAIProvider } from "./baseAIProvider";
import { logger } from '../utils/logger';

// Available Gemini models
export type GeminiModel = 'gemini-pro' | 'gemini-pro-vision';

// Safety settings categories for Gemini
type SafetyCategory = 'HARM_CATEGORY_HARASSMENT' | 'HARM_CATEGORY_HATE_SPEECH' | 'HARM_CATEGORY_SEXUALLY_EXPLICIT' | 'HARM_CATEGORY_DANGEROUS_CONTENT';
type SafetyThreshold = 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_LOW_AND_ABOVE' | 'BLOCK_MEDIUM_AND_ABOVE';

export type SafetySetting = {
    category: SafetyCategory;
    threshold: SafetyThreshold;
};

const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';

/**
 * An AI Provider implementation for Google's Gemini API.
 */
export class GeminiProvider extends BaseAIProvider {
    private readonly model: GeminiModel;
    private readonly apiKey: string;
    private readonly safetySettings?: SafetySetting[];

    public readonly capabilities: {
        codeGeneration: boolean;
        textExplanation: boolean;
        projectScaffolding: boolean;
        streaming: boolean;
        vision: boolean;
    };

    constructor(
        auth: AuthenticationConfig,
        model: GeminiModel = 'gemini-pro',
        safetySettings?: SafetySetting[]
    ) {
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

    protected async _generate(prompt: string, options?: GenerationOptions): Promise<string> {
        const url = `${GEMINI_API_BASE_URL}${this.model}:generateContent?key=${this.apiKey}`;
        const payload = this.createPayload(prompt, options);

        try {
            const response = await axios.post(url, payload);
            // Successful response may still be blocked by safety settings
            if (!response.data.candidates || response.data.candidates.length === 0) {
                const blockReason = response.data.promptFeedback?.blockReason || 'No content';
                throw new Error(`Request was blocked by API. Reason: ${blockReason}`);
            }
            return response.data.candidates[0].content.parts[0].text;
        } catch (error) {
            this.handleApiError(error, 'Error during generate response');
        }
    }

    protected async *_stream(prompt: string, options?: GenerationOptions): AsyncGenerator<string> {
        const url = `${GEMINI_API_BASE_URL}${this.model}:streamGenerateContent?key=${this.apiKey}`;
        const payload = this.createPayload(prompt, options);

        try {
            const response = await axios.post(url, payload, { responseType: 'stream' });
            for await (const chunk of response.data) {
                // The stream sends back arrays of JSON objects.
                const chunkStr = chunk.toString('utf8').replace(/^data: /, '');
                 try {
                    const parsed = JSON.parse(chunkStr);
                    const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (content) {
                        yield content;
                    }
                 } catch (e) {
                    logger.log(`Could not parse streaming chunk: ${chunkStr}`);
                 }
            }
        } catch (error) {
            this.handleApiError(error, 'Error during stream response');
        }
    }

    protected async _generateVision(prompt: string, images: { mimeType: 'image/png' | 'image/jpeg', data: string }[], options?: GenerationOptions): Promise<string> {
        if (this.model !== 'gemini-pro-vision') {
            throw new Error(`_generateVision is only available for gemini-pro-vision model.`);
        }
        const url = `${GEMINI_API_BASE_URL}${this.model}:generateContent?key=${this.apiKey}`;
        
        const imageParts = images.map(img => ({
            inline_data: { mime_type: img.mimeType, data: img.data }
        }));
        
        const payload = this.createPayload([{ text: prompt }, ...imageParts], options);

        try {
            const response = await axios.post(url, payload);
            if (!response.data.candidates || response.data.candidates.length === 0) {
                 const blockReason = response.data.promptFeedback?.blockReason || 'No content';
                throw new Error(`Request was blocked by API. Reason: ${blockReason}`);
            }
            return response.data.candidates[0].content.parts[0].text;
        } catch (error) {
            this.handleApiError(error, 'Error during vision response');
        }
    }

    private createPayload(promptOrParts: string | object[], options?: GenerationOptions) {
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
    
    private handleApiError(error: any, contextMessage: string): never {
        if (error instanceof AxiosError && error.response) {
            const { status, data } = error.response;
            const errorMessage = data?.error?.message || JSON.stringify(data);
            logger.error(`${contextMessage}: [${status}] ${errorMessage}`);
            throw new Error(`API Error: [${status}] ${errorMessage}`);
        } else {
            logger.error(`${contextMessage}: ${error.message}`);
            throw error;
        }
    }
}
