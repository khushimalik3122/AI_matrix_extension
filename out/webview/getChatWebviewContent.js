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
exports.getChatWebviewContent = getChatWebviewContent;
const vscode = __importStar(require("vscode"));
function getChatWebviewContent(webview, extensionUri, initialState) {
    const nonce = getNonce();
    // URIs for local resources
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'main.js'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'styles.css'));
    const toolkitUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'node_modules', '@vscode', 'webview-ui-toolkit', 'dist', 'toolkit.js'));
    // URIs for CDNs
    const reactUri = "https://unpkg.com/react@18/umd/react.development.js";
    const reactDOMUri = "https://unpkg.com/react-dom@18/umd/react-dom.development.js";
    const babelUri = "https://unpkg.com/@babel/standalone/babel.min.js";
    const highlightJsUri = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js";
    const highlightJsCssUri = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css";
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="
        default-src 'none';
        script-src 'nonce-${nonce}' 'unsafe-eval' https://unpkg.com https://cdnjs.cloudflare.com;
        style-src ${webview.cspSource} 'unsafe-inline' https://cdnjs.cloudflare.com;
        font-src https://cdnjs.cloudflare.com;
        img-src ${webview.cspSource} https:;
    ">
    <title>AI Chat</title>
    <link href="${highlightJsCssUri}" rel="stylesheet">
    <style>
        /* Basic styles - you can move this to a separate CSS file */
        body, html {
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
            font-family: var(--vscode-font-family);
            color: var(--vscode-editor-foreground);
            background-color: var(--vscode-editor-background);
        }
        #root {
            height: 100%;
            display: flex;
            flex-direction: column;
        }
        .header {
            padding: 8px;
            border-bottom: 1px solid var(--vscode-side-bar-border);
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .message-list {
            flex-grow: 1;
            overflow-y: auto;
            padding: 10px;
        }
        .message {
            margin-bottom: 15px;
            display: flex;
        }
        .message .author {
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
            margin-right: 10px;
        }
        .message .content {
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .input-area {
            border-top: 1px solid var(--vscode-side-bar-border);
            padding: 10px;
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        textarea {
            width: 100%;
            box-sizing: border-box;
            padding: 8px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
        }
        pre code {
            border-radius: 5px;
        }
        .context-toggles { display: flex; gap: 10px; align-items: center; }
        .icon-button { background: none; border: none; color: var(--vscode-icon-foreground); cursor: pointer; }
    </style>
</head>
<body>
    <div id="root"></div>

    <script nonce="${nonce}" src="${reactUri}"></script>
    <script nonce="${nonce}" src="${reactDOMUri}"></script>
    <script nonce="${nonce}" src="${babelUri}"></script>
    <script nonce="${nonce}" src="${highlightJsUri}"></script>

    <script nonce="${nonce}" type="text/babel">
        const vscode = acquireVsCodeApi();

        const App = () => {
            const [state, setState] = React.useState(${JSON.stringify(initialState)});
            const [inputValue, setInputValue] = React.useState('');
            const messageListRef = React.useRef(null);

            React.useEffect(() => {
                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.type) {
                        case 'updateState':
                            setState(message.state);
                            break;
                        case 'addMessage':
                            setState(prevState => ({...prevState, messages: [...prevState.messages, message.message]}));
                            break;
                        case 'streamMessageChunk':
                            setState(prevState => {
                                const newMessages = [...prevState.messages];
                                const lastMessage = newMessages[newMessages.length - 1];
                                if (lastMessage && lastMessage.author === 'AI') {
                                    lastMessage.content += message.chunk;
                                } else {
                                    newMessages.push({ author: 'AI', content: message.chunk });
                                }
                                return {...prevState, messages: newMessages};
                            });
                            break;
                        case 'showLoading':
                            setState(prevState => ({...prevState, isLoading: true}));
                            break;
                         case 'hideLoading':
                            setState(prevState => ({...prevState, isLoading: false}));
                            break;
                    }
                });
            }, []);

            React.useEffect(() => {
                if (messageListRef.current) {
                    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
                }
                if (state.messages.length > 0 && state.messages[state.messages.length - 1].author === 'AI') {
                    document.querySelectorAll('pre code').forEach((block) => {
                        hljs.highlightElement(block);
                    });
                }
            }, [state.messages]);

            const handleSend = () => {
                if (inputValue.trim()) {
                    vscode.postMessage({ type: 'sendMessage', text: inputValue, contextStrategy: state.contextStrategy });
                    setState(prevState => ({...prevState, messages: [...prevState.messages, { author: 'You', content: inputValue }]}));
                    setInputValue('');
                }
            };
            
            const MessageContent = ({ message }) => {
                if (message.author !== 'AI') {
                    return <span>{message.content}</span>;
                }
                // Split AI messages to find and highlight code blocks
                const contentWithCodeBlocks = message.content.split(/(\`\`\`[\s\S]*?\`\`\`)/g);

                return contentWithCodeBlocks.map((part, index) => {
                    // Check if the part is a code block
                    const codeMatch = part.match(/\`\`\`(\w*)\n?([\s\S]*?)\`\`\`/);
                    if (codeMatch) {
                        const language = codeMatch[1] || 'plaintext';
                        const code = codeMatch[2];
                        return (
                            <pre key={index}>
                                <code className={\`language-\${language}\`}>{code}</code>
                            </pre>
                        );
                    }
                    return <span key={index}>{part}</span>;
                });
            };

            return (
                <>
                    <div className="header">
                        <select
                            value={state.activeProvider}
                            onChange={e => vscode.postMessage({ type: 'setActiveProvider', provider: e.target.value })}
                        >
                            {state.availableProviders.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <button className="icon-button" title="New Chat" onClick={() => vscode.postMessage({ type: 'clearHistory' })}>&#x2795;</button>
                        <button className="icon-button" title="Settings" onClick={() => vscode.postMessage({ type: 'openSettings' })}>&#x2699;</button>
                    </div>

                    <div className="message-list" ref={messageListRef}>
                        {state.messages.map((msg, index) => (
                            <div key={index} className="message">
                                <div className="author">{msg.author}:</div>
                                <div className="content">
                                    <MessageContent message={msg} />
                                </div>
                            </div>
                        ))}
                         {state.isLoading && <div className="message"><div className="author">AI:</div><div className="content">Thinking...</div></div>}
                    </div>

                    <div className="input-area">
                        <textarea
                            rows="4"
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                            placeholder="Ask a question about your code..."
                        />
                         <div className="context-toggles">
                            <span>Context:</span>
                            <input type="radio" id="workspace" name="context" value="semantic" checked={state.contextStrategy === 'semantic'} onChange={e => vscode.postMessage({ type: 'setContextStrategy', strategy: e.target.value })} />
                            <label htmlFor="workspace">Workspace</label>
                            <input type="radio" id="currentFile" name="context" value="local" checked={state.contextStrategy === 'local'} onChange={e => vscode.postMessage({ type: 'setContextStrategy', strategy: e.target.value })} />
                            <label htmlFor="currentFile">Current File</label>
                        </div>
                        <button onClick={handleSend} disabled={state.isLoading}>Send</button>
                    </div>
                </>
            );
        };

        ReactDOM.render(<App />, document.getElementById('root'));
    </script>
</body>
</html>`;
}
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=getChatWebviewContent.js.map