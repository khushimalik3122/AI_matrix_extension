My AI Extension - API Documentation
This document outlines the core internal APIs of the extension, intended for developers who wish to contribute or extend its functionality.

Core Concepts
The extension is built around a modular architecture with several key manager classes that handle specific responsibilities.

ProviderManager
Location: src/features/providerManager.ts

This class is the central point of contact for all interactions with external AI language models. It manages multiple provider implementations and handles fallback logic.

Public Interface
async generateResponse(options: GenerationOptions): Promise<string>

Generates a single, non-streaming response from the currently active AI provider.

Will automatically fall back to other configured providers on failure.

async streamResponse(options: GenerationOptions, callbacks: StreamCallbacks): Promise<void>

Generates a streaming response, invoking the callbacks as data chunks are received.

setActiveProvider(providerName: string): void

Sets the primary AI provider to be used for subsequent requests.

getAvailableProviders(): string[]

Returns a list of the names of all successfully configured providers.

ContextRetriever
Location: src/features/contextRetriever.ts

This class is responsible for gathering relevant code snippets from the user's workspace to be used as context in an AI prompt.

Public Interface
async retrieve(options: RetrievalOptions): Promise<RetrievalResult>

The main method for fetching context.

RetrievalOptions:

query: string: The user's query or the code to find context for.

strategy: 'semantic' | 'local': The retrieval strategy to use.

limit?: number: The maximum number of context snippets to return.

buildContextString(snippets: ContextSnippet[]): string

Formats an array of context snippets into a single string suitable for inclusion in an AI prompt.

SettingsManager
Location: src/features/settingsManager.ts

A secure and centralized way to manage all user configurations and API keys.

Public Interface
async getApiKey(provider: 'perplexity' | 'gemini' | 'groq'): Promise<string | undefined>

Securely retrieves the API key for a given provider from VS Code's Secret Storage.

async setApiKey(provider: 'perplexity' | 'gemini' | 'groq', apiKey: string): Promise<void>

Stores an API key securely in Secret Storage.

isInlineCompletionEnabled(): boolean

Checks if the user has enabled the inline completion feature.

getLogLevel(): LogLevel

Returns the configured logging level for the extension.