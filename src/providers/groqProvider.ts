import axios, { AxiosError } from 'axios';
import { GenerationOptions } from '../types/aiProvider';
import { BaseAIProvider } from './baseAIProvider';
import { logger } from '../utils/logger';

// ... (GroqModel enum remains the same)
export enum GroqModel {
    LLAMA3_8B = 'llama3-8b-8192',
    LLAMA3_70B = 'llama3-70b-8192',
    MIXTRAL_8X7B = 'mixtral-8x7b-32768',
    GEMMA_7B = 'gemma-7b-it',
}

export class GroqProvider extends BaseAIProvider {
    private static readonly API_URL = 'https://api.groq.com/openai/v1/chat/completions';

    public readonly capabilities = {
        codeGeneration: true,
        textExplanation: true,
        projectScaffolding: true,
        streaming: true,
        vision: false,
    };

    protected async _generate(prompt: string, options?: GenerationOptions): Promise<string> {
        try {
            const response = await axios.post(
                GroqProvider.API_URL,
                {
                    messages: [{ role: 'user', content: prompt }],
                    model: GroqModel.LLAMA3_8B,
                    temperature: options?.temperature ?? 0.7,
                    max_tokens: options?.maxTokens ?? 1024,
                    stream: false,
                },
                { headers: this.getHeaders() }
            );
            return response.data.choices?.[0]?.message?.content ?? '';
        } catch (error) {
            throw this.handleApiError(error as AxiosError);
        }
    }

    protected async *_stream(prompt: string, options?: GenerationOptions): AsyncGenerator<string> {
        try {
            const response = await axios.post(
                GroqProvider.API_URL,
                {
                    messages: [{ role: 'user', content: prompt }],
                    model: GroqModel.LLAMA3_8B,
                    temperature: options?.temperature ?? 0.7,
                    max_tokens: options?.maxTokens ?? 1024,
                    stream: true,
                },
                { headers: this.getHeaders(), responseType: 'stream' }
            );

            for await (const chunk of response.data as any) {
                const lines = chunk.toString('utf8').split('\n').filter((line: string) => line.trim().startsWith('data: '));
                for (const line of lines) {
                    const msg = line.substring(6);
                    if (msg === '[DONE]') return;
                    try {
                        const json = JSON.parse(msg);
                        const content = json.choices?.[0]?.delta?.content;
                        if (content) yield content;
                    } catch (e) {
                        logger.warn('Failed to parse Groq stream chunk');
                    }
                }
            }
        } catch (error) {
            throw this.handleApiError(error as AxiosError);
        }
    }

    protected async _generateVision(prompt: string, images: { mimeType: 'image/png' | 'image/jpeg'; data: string; }[], options?: GenerationOptions): Promise<string> {
        throw new Error('Vision is not supported by GroqProvider.');
    }

    // ... (getContextWindowSize and handleApiError methods remain the same)
    private handleApiError(error: AxiosError): Error {
        if (error.response) {
            const { status, data } = error.response;
            const message = (data as any)?.error?.message || `HTTP error! status: ${status}`;
            return new Error(message);
        } else if (error.request) {
            return new Error('The request was made but no response was received from Groq.');
        } else {
            return new Error(`Error setting up the request to Groq: ${error.message}`);
        }
    }

    private getHeaders() {
        // BaseAIProvider.auth ensures we have config; using apiKey style for Groq
        const apiKey = (this as any).auth?.key;
        return {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
    }
}

