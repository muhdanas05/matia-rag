import React, { useRef, useEffect, useState } from 'react';
import { Message } from '../lib/api';

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (msg: string) => void;
  isTyping: boolean;
  storeReady: boolean;
}

function formatMessage(content: string) {
  // Simple markdown-like formatting for bold, code, and pre blocks
  // Escape HTML
  let html = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  // Pre blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-[#0d1117] p-3 rounded-md overflow-x-auto text-sm my-2 border border-[#30363d]"><code>$1</code></pre>');
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-[#161b22] px-1.5 py-0.5 rounded text-sm font-mono border border-[#30363d]">$1</code>');
  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // New lines
  html = html.replace(/\n/g, '<br/>');

  return <div dangerouslySetInnerHTML={{ __html: html }} className="prose-invert" />;
}

export function ChatArea({ messages, onSendMessage, isTyping, storeReady }: ChatAreaProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim() || !storeReady) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0f1115] h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 h-14 border-b border-[#30363d] flex items-center px-6 justify-between bg-[#161b22]">
        <h2 className="text-lg font-semibold text-gray-200">Document Q&A</h2>
        <span className="text-[10px] bg-accent/20 text-accent px-2 py-1 rounded font-bold tracking-wider">DOCS ONLY</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <svg className="w-16 h-16 mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm mt-2 max-w-md text-center">
              Ask a question about your documents. Ensure you have created a store and uploaded files first.
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-[var(--user-msg)] text-white rounded-br-sm' 
                    : 'bg-[#21262d] border border-[#30363d] text-gray-200 rounded-bl-sm'
                }`}
              >
                {formatMessage(msg.content)}

                {msg.role === 'model' && msg.citations && msg.citations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#30363d]">
                    <details className="text-xs group">
                      <summary className="cursor-pointer text-gray-400 hover:text-gray-300 font-medium select-none flex items-center">
                        <svg className="w-3 h-3 mr-1 inline-block transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                        View Sources ({msg.citations.length})
                      </summary>
                      <div className="mt-2 space-y-2 pl-4">
                        {msg.citations.map((cite, j) => (
                          <div key={j} className="bg-[#0f1115] p-2 rounded border border-[#30363d]">
                            <div className="font-semibold text-gray-300 mb-1">{cite.title || cite.uri}</div>
                            <div className="text-gray-500 italic">"...{cite.snippet}..."</div>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[#21262d] border border-[#30363d] rounded-2xl rounded-bl-sm px-5 py-4 flex items-center gap-1 shadow-sm">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-[#161b22] border-t border-[#30363d]">
        <div className="max-w-4xl mx-auto relative flex items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={storeReady ? "Ask about your documents... (Shift+Enter for new line)" : "Create a knowledge store first to start chatting"}
            disabled={!storeReady}
            rows={1}
            className="w-full bg-[#0f1115] text-gray-200 border border-[#30363d] rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none disabled:opacity-50 disabled:cursor-not-allowed custom-scrollbar"
            style={{ maxHeight: '150px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !storeReady || isTyping}
            className="absolute right-2 bottom-2 p-2 text-white bg-accent hover:bg-accent-hover rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
