// Define a placeholder for AIProviderConfig if not available from a shared types file
export type AIProviderConfig = Record<string, any>;

/**
 * Defines the structure of messages sent FROM the webview TO the extension.
 */
export type WebviewToExtensionMessage =
  | { type: 'ready' }
  | { type: 'sendMessage'; payload: { message: string; contextStrategy: string } }
  | { type: 'setActiveProvider'; payload: { provider: string } }
  | { type: 'saveSettings'; payload: { provider: string; config: AIProviderConfig } }
  | { type: 'openSettings' }
  | { type: 'clearHistory' }
  | { type: 'exportHistory' }
  | { type: 'importHistory'; payload: { history: any[] } }
  | { type: 'cancelRequest' };

/**
 * Defines the structure of messages sent FROM the extension TO the webview.
 */
export type ExtensionToWebviewMessage =
  | { type: 'historyLoaded'; payload: { history: any[] } }
  | { type: 'providersLoaded'; payload: { providers: string[]; activeProvider: string } }
  | { type: 'streamStart'; payload: { conversationId: string } }
  | { type: 'streamChunk'; payload: { conversationId: string; chunk: string } }
  | { type: 'streamEnd'; payload: { conversationId: string; fullResponse: string } }
  | { type: 'error'; payload: { message: string } }
  | { type: 'typingIndicator'; payload: { active: boolean } };

