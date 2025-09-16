export interface WebviewState {
  messages: { author: string; content: string }[];
  availableProviders: string[];
  activeProvider: string;
  isLoading: boolean;
  contextStrategy: 'semantic' | 'local';
}
