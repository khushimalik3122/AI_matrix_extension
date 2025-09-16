import axios, { AxiosError } from 'axios';
import { AIProvider, GenerationOptions } from '../types/aiProvider';
import { BaseAIProvider } from './baseAIProvider';
import { logger } from '../utils/logger';
import * as vscode from 'vscode';

// ... (GroqModel enum remains the same)
export enum GroqModel {
    LLAMA3_8B = 'llama3-8b-8192',
    LLAMA3_70B = 'llama3-70b-8192',
    MIXTRAL_8X7B = 'mixtral-8x7b-32768',
    GEMMA_7B = 'gemma-7b-it',
}

export class GroqProvider extends BaseAIProvider implements AIProvider {
    private static readonly API_URL = 'https://api.groq.com/openai/v1/chat/completions';
    
    public providerId = "groq";

    public capabilities = {
        streaming: true,
        codeGeneration: true,
        contextWindow: true,
    };

    public async generateResponse(options: GenerationOptions): Promise<string> {
        // ... (implementation remains the same)
        return "Not implemented for streaming example";
    }

    public async streamResponse(
        options: GenerationOptions,
        onData: (chunk: string) => void,
        cancellationToken: vscode.CancellationToken
    ): Promise<void> {
        const model = options.model || GroqModel.LLAMA3_8B;

        const source = axios.CancelToken.source();
        const registration = cancellationToken.onCancellationRequested(() => {
            logger.log("Cancellation requested for Groq stream. Aborting request.");
            source.cancel("Operation canceled by the user.");
        });

        try {
            const response = await this.axiosInstance.post(
                GroqProvider.API_URL,
                {
                    messages: [{ role: 'user', content: options.prompt }],
                    model: model,
                    temperature: options.temperature ?? 0.7,
                    max_tokens: options.maxTokens ?? 1024,
                    stream: true,
                },
                {
                    responseType: 'stream',
                    cancelToken: source.token,
                }
            );

            // The promise will resolve when headers are received, but the stream is ongoing.
            // We wrap the stream handling in a new promise to await its completion.
            await new Promise<void>((resolve, reject) => {
                response.data.on('data', (chunk: Buffer) => {
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
                            } catch (error) {
                                logger.error('Error parsing Groq stream chunk:', error);
                                // Don't reject here, just log and continue
                            }
                        }
                    }
                });

                response.data.on('error', (error: any) => {
                    logger.error("Error in Groq stream:", error);
                    reject(error);
                });

                response.data.on('end', () => {
                    resolve();
                });
            });

        } catch (error) {
            if (axios.isCancel(error)) {
                logger.log('Groq stream request was cancelled.');
            } else {
                logger.error('Error in Groq stream request:', error);
                throw this.handleApiError(error as AxiosError);
            }
        } finally {
            registration.dispose();
        }
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
}

