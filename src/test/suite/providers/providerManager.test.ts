import * as assert from 'assert';
import * as vscode from 'vscode';
import { ProviderManager } from '../../../features/providerManager';
import { SettingsManager } from '../../../features/settingsManager';
import { mockApiSuccess, resetApiMock } from '../../mocks/apiMocks';

suite('ProviderManager Integration Tests', () => {
    let settingsManager: SettingsManager;
    
    setup(() => {
        // Mock the SettingsManager to control which providers are loaded
        settingsManager = {
            getApiKey: async (provider: string) => `fake-key-for-${provider}`
        } as any;
    });

    teardown(() => {
        resetApiMock();
    });

    test('should load configured providers', async () => {
        const providerManager = new ProviderManager(settingsManager);
        await new Promise(resolve => setTimeout(resolve, 100)); // Allow async loadProviders to run
        
        const providers = (providerManager as any).providers;
        assert.ok(providers.has('Perplexity'), 'Perplexity provider not loaded');
        assert.ok(providers.has('Gemini'), 'Gemini provider not loaded');
        assert.ok(providers.has('Groq'), 'Groq provider not loaded');
    });

    test('should generate a response using the active provider', async () => {
        mockApiSuccess({ choices: [{ text: 'Hello from mock API' }] });

        const providerManager = new ProviderManager(settingsManager);
        await new Promise(resolve => setTimeout(resolve, 100));

        const response = await providerManager.generateResponse({ prompt: 'test' });
        assert.strictEqual(response, 'Hello from mock API');
    });
});

