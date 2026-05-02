import React, { useRef, useEffect, useState } from 'react';
import { Message } from '../lib/api';

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (msg: string) => void;
  isTyping: boolean;
  storeReady: boolean;
}

function formatMessage(content: string) {
  let html = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-[#1A1A18] text-[#F5F3EF] p-3 rounded-lg overflow-x-auto text-sm my-2 border border-[#333]"><code>$1</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code class="bg-[#F0EDE8] text-[#C5501A] px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\n/g, '<br/>');
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export function ChatArea({ messages, onSendMessage, isTyping, storeReady }: ChatAreaProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim() || !storeReady) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: 'var(--background)' }}>

      {/* Header */}
      <div className="flex-shrink-0 h-14 border-b flex items-center px-6 justify-between bg-white" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>Document Q&amp;A</h2>
          <span className="text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded-full border" style={{ color: 'var(--accent)', borderColor: 'var(--accent)', background: 'rgba(232,96,10,0.06)' }}>DOCS ONLY</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--accent)' }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          <span className="font-medium">Strict RAG Mode</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5" style={{ background: 'var(--background)' }}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4" style={{ color: 'var(--foreground)', opacity: 0.35 }}>
            <div className="w-16 h-16 rounded-full border-2 border-current flex items-center justify-center">
              <span className="text-[13px] font-black leading-none text-center">ROUTE<br/>66</span>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">Ask your Route 66 documents</p>
              <p className="text-sm mt-1 max-w-xs">Every answer is sourced strictly from your uploaded guides — no guessing.</p>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'text-white rounded-br-sm'
                  : 'border rounded-bl-sm'
              }`}
              style={msg.role === 'user'
                ? { background: 'var(--user-msg)' }
                : { background: 'var(--bot-msg)', borderColor: 'var(--border)', color: 'var(--foreground)' }
              }>
                {formatMessage(msg.content)}

                {msg.role === 'model' && msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                    <details className="text-xs group">
                      <summary className="cursor-pointer font-semibold select-none flex items-center gap-1.5 transition-colors" style={{ color: 'var(--accent)' }}>
                        <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                        View Sources ({msg.citations.length})
                      </summary>
                      <div className="mt-2 space-y-2 pl-4">
                        {msg.citations.map((cite, j) => (
                          <div key={j} className="p-2.5 rounded-lg border" style={{ background: 'var(--background)', borderColor: 'var(--border)' }}>
                            <div className="font-semibold mb-0.5 flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                              {cite.title || cite.uri}
                            </div>
                            <div className="italic leading-relaxed" style={{ color: 'var(--foreground)', opacity: 0.55 }}>"{cite.snippet}"</div>
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
            <div className="border rounded-2xl rounded-bl-sm px-5 py-4 flex items-center gap-1.5 shadow-sm" style={{ background: 'var(--bot-msg)', borderColor: 'var(--border)' }}>
              <div className="w-2 h-2 rounded-full animate-bounce [animation-delay:-0.3s]" style={{ background: 'var(--accent)' }} />
              <div className="w-2 h-2 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ background: 'var(--accent)', opacity: 0.6 }} />
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--accent)', opacity: 0.3 }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-4xl mx-auto relative flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={storeReady ? 'Ask about your Route 66 documents… (Shift+Enter for new line)' : 'Create a knowledge store first to start chatting'}
            disabled={!storeReady}
            rows={1}
            className="flex-1 rounded-xl pl-4 pr-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            style={{
              background: 'var(--background)',
              color: 'var(--foreground)',
              border: '1.5px solid var(--border)',
              maxHeight: '150px',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !storeReady || isTyping}
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: 'var(--accent)' }}
            onMouseOver={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'var(--accent-hover)'; }}
            onMouseOut={e => (e.currentTarget.style.background = 'var(--accent)')}
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
