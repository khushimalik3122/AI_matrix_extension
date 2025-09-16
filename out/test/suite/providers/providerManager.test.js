"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const providerManager_1 = require("../../../features/providerManager");
const apiMocks_1 = require("../../mocks/apiMocks");
suite('ProviderManager Integration Tests', () => {
    let settingsManager;
    setup(() => {
        // Mock the SettingsManager to control which providers are loaded
        settingsManager = {
            getApiKey: async (provider) => `fake-key-for-${provider}`
        };
    });
    teardown(() => {
        (0, apiMocks_1.resetApiMock)();
    });
    test('should load configured providers', async () => {
        const providerManager = new providerManager_1.ProviderManager(settingsManager);
        await new Promise(resolve => setTimeout(resolve, 100)); // Allow async loadProviders to run
        const providers = providerManager.providers;
        assert.ok(providers.has('Perplexity'), 'Perplexity provider not loaded');
        assert.ok(providers.has('Gemini'), 'Gemini provider not loaded');
        assert.ok(providers.has('Groq'), 'Groq provider not loaded');
    });
    test('should generate a response using the active provider', async () => {
        (0, apiMocks_1.mockApiSuccess)({ choices: [{ text: 'Hello from mock API' }] });
        const providerManager = new providerManager_1.ProviderManager(settingsManager);
        await new Promise(resolve => setTimeout(resolve, 100));
        const response = await providerManager.generateResponse({ prompt: 'test' });
        assert.strictEqual(response, 'Hello from mock API');
    });
});
//# sourceMappingURL=providerManager.test.js.map