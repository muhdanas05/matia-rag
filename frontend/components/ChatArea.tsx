'use client';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Message } from '../lib/api';

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (msg: string) => void;
  isTyping: boolean;
  storeReady: boolean;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

// ── Markdown renderer ──────────────────────────────────────────────────────────
function renderMarkdown(raw: string): string {
  const lines = raw.split('\n');
  let html = '';
  let inUl = false, inOl = false, inPre = false, codeLines: string[] = [];

  const closeList = () => {
    if (inUl) { html += '</ul>'; inUl = false; }
    if (inOl) { html += '</ol>'; inOl = false; }
  };

  const inline = (s: string) =>
    s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
     .replace(/`([^`]+)`/g, '<code>$1</code>')
     .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
     .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
     .replace(/\*(.+?)\*/g, '<em>$1</em>');

  for (const raw_line of lines) {
    const line = raw_line;

    // Code fence
    if (line.startsWith('```')) {
      if (!inPre) { closeList(); inPre = true; codeLines = []; continue; }
      else {
        const escaped = codeLines.join('\n').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        html += `<pre><code>${escaped}</code></pre>`;
        inPre = false; continue;
      }
    }
    if (inPre) { codeLines.push(line); continue; }

    const isUl = /^[-*] /.test(line);
    const isOl = /^\d+\. /.test(line);
    if (!isUl && inUl) { html += '</ul>'; inUl = false; }
    if (!isOl && inOl) { html += '</ol>'; inOl = false; }

    if (line.startsWith('### '))     { closeList(); html += `<h3>${inline(line.slice(4))}</h3>`; continue; }
    if (line.startsWith('## '))      { closeList(); html += `<h2>${inline(line.slice(3))}</h2>`; continue; }
    if (line.startsWith('# '))       { closeList(); html += `<h1>${inline(line.slice(2))}</h1>`; continue; }
    if (line.match(/^---+$/))        { closeList(); html += '<hr>'; continue; }
    if (isUl) { if (!inUl) { html += '<ul>'; inUl = true; } html += `<li>${inline(line.slice(2))}</li>`; continue; }
    if (isOl) { if (!inOl) { html += '<ol>'; inOl = true; } html += `<li>${inline(line.replace(/^\d+\. /, ''))}</li>`; continue; }
    if (line.trim() === '')          { closeList(); html += '<br>'; continue; }
    html += `<p>${inline(line)}</p>`;
  }
  closeList();
  if (inPre) {
    const escaped = codeLines.join('\n').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    html += `<pre><code>${escaped}</code></pre>`;
  }
  return html;
}

// ── Component ──────────────────────────────────────────────────────────────────
export function ChatArea({ messages, onSendMessage, isTyping, storeReady, sidebarOpen, onToggleSidebar }: ChatAreaProps) {
  const [input, setInput] = useState('');
  const messagesEndRef  = useRef<HTMLDivElement>(null);
  const textareaRef     = useRef<HTMLTextAreaElement>(null);
  const scrollRef       = useRef<HTMLDivElement>(null);
  const isNearBottom    = useRef(true);

  // Track if user is near the bottom
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    isNearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }, []);

  // Only auto-scroll when near bottom
  useEffect(() => {
    if (isNearBottom.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    const msg = input.trim();
    if (!msg || !storeReady) return;
    onSendMessage(msg);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
    isNearBottom.current = true;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  };

  const isEmpty = messages.length === 0 && !isTyping;

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-5 h-12 border-b" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
        <button
          onClick={onToggleSidebar}
          className="w-7 h-7 flex items-center justify-center rounded-md transition-colors hover:bg-black/5"
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            {sidebarOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M18 19l-7-7 7-7"/>
              : <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M6 5l7 7-7 7"/>}
          </svg>
        </button>
        <span className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Route 66 AI</span>
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border" style={{ color: 'var(--accent)', borderColor: 'var(--accent)', background: 'var(--accent-light)' }}>Docs Only</span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6"
        style={{ background: 'var(--bg)' }}
      >
        <div className="max-w-3xl mx-auto space-y-5">

          {isEmpty && (
            <div className="flex flex-col items-center justify-center py-24 gap-4" style={{ color: 'var(--text-muted)' }}>
              <div className="w-14 h-14 rounded-full border-2 flex items-center justify-center" style={{ borderColor: 'var(--border)' }}>
                <span className="text-[10px] font-black leading-none text-center" style={{ color: 'var(--text-muted)' }}>ROUTE<br/>66</span>
              </div>
              <div className="text-center space-y-1">
                <p className="text-base font-semibold" style={{ color: 'var(--text)' }}>Ask your Route 66 guides</p>
                <p className="text-sm max-w-xs" style={{ color: 'var(--text-muted)' }}>
                  {storeReady ? 'Every answer comes from the uploaded guides.' : 'Create a knowledge store to get started.'}
                </p>
              </div>
              {storeReady && (
                <div className="grid grid-cols-2 gap-2 mt-2 w-full max-w-sm">
                  {['Best diners on Route 66?', 'Where to stay under $100?', 'Top motorcycle roads?', 'Hidden gems to visit?'].map(q => (
                    <button
                      key={q}
                      onClick={() => { if (storeReady) onSendMessage(q); }}
                      className="text-left text-xs px-3 py-2.5 rounded-xl border transition-all hover:border-orange-300"
                      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex msg-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'model' && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mr-2.5 mt-0.5 border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                  <span className="text-[7px] font-black leading-none" style={{ color: 'var(--accent)' }}>R66</span>
                </div>
              )}
              <div className={`max-w-[78%] ${msg.role === 'user' ? 'max-w-[65%]' : ''}`}>
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'rounded-br-sm text-white' : 'rounded-bl-sm border'}`}
                  style={msg.role === 'user'
                    ? { background: 'var(--user-bubble)' }
                    : { background: 'var(--bot-bubble)', borderColor: 'var(--border)', color: 'var(--text)' }
                  }
                >
                  {msg.role === 'user'
                    ? <p className="whitespace-pre-wrap">{msg.content}</p>
                    : <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                  }

                  {/* Citations */}
                  {msg.role === 'model' && msg.citations && msg.citations.length > 0 && (
                    <details className="mt-3 pt-3 border-t group" style={{ borderColor: 'var(--border)' }}>
                      <summary className="cursor-pointer text-xs font-medium select-none flex items-center gap-1.5 list-none" style={{ color: 'var(--accent)' }}>
                        <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                        {msg.citations.length} source{msg.citations.length > 1 ? 's' : ''}
                      </summary>
                      <div className="mt-2 space-y-1.5 pl-2">
                        {msg.citations.map((c, j) => (
                          <div key={j} className="text-xs p-2.5 rounded-lg border" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                            {c.snippet && <p className="italic leading-relaxed" style={{ color: 'var(--text-muted)' }}>"{c.snippet}"</p>}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-start gap-2.5 msg-in">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                <span className="text-[7px] font-black" style={{ color: 'var(--accent)' }}>R66</span>
              </div>
              <div className="px-4 py-3.5 rounded-2xl rounded-bl-sm border flex items-center gap-1.5" style={{ background: 'var(--bot-bubble)', borderColor: 'var(--border)' }}>
                <span className="w-1.5 h-1.5 rounded-full dot1" style={{ background: 'var(--accent)' }} />
                <span className="w-1.5 h-1.5 rounded-full dot2" style={{ background: 'var(--accent)', opacity: 0.6 }} />
                <span className="w-1.5 h-1.5 rounded-full dot3" style={{ background: 'var(--accent)', opacity: 0.35 }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 pb-4 pt-3 border-t" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
        <div className="max-w-3xl mx-auto flex items-end gap-2.5">
          <div className="flex-1 flex items-end rounded-2xl border transition-all px-4 py-2.5" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
            onFocusCapture={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlurCapture={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={storeReady ? 'Ask about Route 66…' : 'Create a knowledge store to start chatting'}
              disabled={!storeReady}
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-sm leading-relaxed disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: 'var(--text)', maxHeight: '160px' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || !storeReady || isTyping}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            style={{ background: input.trim() && storeReady ? 'var(--accent)' : '#D1CEC9' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
        <p className="max-w-3xl mx-auto mt-1.5 text-center text-[10px]" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
