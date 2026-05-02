'use client';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowUpIcon, PanelLeftClose, PanelLeftOpen, Shield } from 'lucide-react';
import { Message } from '../lib/api';
import { Textarea } from '@/components/ui/textarea';
import { useAutoResizeTextarea } from '@/hooks/use-auto-resize-textarea';
import { cn } from '@/lib/utils';

interface Props {
  messages: Message[];
  onSendMessage: (msg: string) => void;
  isTyping: boolean;
  storeReady: boolean;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

// ── Markdown ─────────────────────────────────────────────────────────────────
function md(raw: string): string {
  const lines = raw.split('\n');
  let out = '', inUl = false, inOl = false, inPre = false, code: string[] = [];

  const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const inline = (s: string) =>
    esc(s)
      .replace(/`([^`]+)`/g,'<code>$1</code>')
      .replace(/\*\*\*(.+?)\*\*\*/g,'<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,'<em>$1</em>');

  const closeList = () => {
    if (inUl) { out += '</ul>'; inUl = false; }
    if (inOl) { out += '</ol>'; inOl = false; }
  };

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (!inPre) { closeList(); inPre = true; code = []; continue; }
      out += `<pre><code>${esc(code.join('\n'))}</code></pre>`;
      inPre = false; continue;
    }
    if (inPre) { code.push(line); continue; }

    const isUl = /^[-*] /.test(line);
    const isOl = /^\d+\. /.test(line);
    if (!isUl && inUl) { out += '</ul>'; inUl = false; }
    if (!isOl && inOl) { out += '</ol>'; inOl = false; }

    if (/^#{3} /.test(line))  { closeList(); out += `<h3>${inline(line.slice(4))}</h3>`; continue; }
    if (/^#{2} /.test(line))  { closeList(); out += `<h2>${inline(line.slice(3))}</h2>`; continue; }
    if (/^# /.test(line))     { closeList(); out += `<h1>${inline(line.slice(2))}</h1>`; continue; }
    if (/^-{3,}$/.test(line)) { closeList(); out += '<hr>'; continue; }
    if (isUl) { if (!inUl) { out += '<ul>'; inUl = true; } out += `<li>${inline(line.slice(2))}</li>`; continue; }
    if (isOl) { if (!inOl) { out += '<ol>'; inOl = true; } out += `<li>${inline(line.replace(/^\d+\. /,''))}</li>`; continue; }
    if (!line.trim()) { closeList(); out += '<br>'; continue; }
    out += `<p>${inline(line)}</p>`;
  }
  closeList();
  if (inPre) out += `<pre><code>${esc(code.join('\n'))}</code></pre>`;
  return out;
}

// ── Typewriter ────────────────────────────────────────────────────────────────
const PROMPTS = [
  'Best diners on Route 66?',
  'Where should I stay in Oklahoma?',
  'Top motorcycle roads on the route?',
  'Hidden gems most tourists miss?',
  'What neon signs are worth seeing?',
  'How long does the full route take?',
];

function useTypewriter() {
  const [text, setText]     = useState('');
  const [idx, setIdx]       = useState(0);
  const [deleting, setDel]  = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const full = PROMPTS[idx];
    if (paused) {
      const t = setTimeout(() => { setDel(true); setPaused(false); }, 1800);
      return () => clearTimeout(t);
    }
    if (!deleting) {
      if (text.length < full.length) {
        const t = setTimeout(() => setText(full.slice(0, text.length + 1)), 45);
        return () => clearTimeout(t);
      }
      setPaused(true);
    } else {
      if (text.length > 0) {
        const t = setTimeout(() => setText(text.slice(0, -1)), 22);
        return () => clearTimeout(t);
      }
      setDel(false);
      setIdx(i => (i + 1) % PROMPTS.length);
    }
  }, [text, deleting, paused, idx]);

  return text;
}

// ── Suggestion chips ──────────────────────────────────────────────────────────
const CHIPS = [
  { emoji: '🍔', label: 'Best diners' },
  { emoji: '🏨', label: 'Where to stay' },
  { emoji: '🏍️', label: 'Motorcycle roads' },
  { emoji: '✨', label: 'Hidden gems' },
  { emoji: '🌃', label: 'Neon signs' },
  { emoji: '📍', label: 'Must-see stops' },
];

// ── Input box (v0-chat style from mvpblocks) ──────────────────────────────────
function ChatInput({
  value, onChange, onKeyDown, onSend, disabled, isTyping, placeholder, textareaRef, adjustHeight,
}: {
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  disabled: boolean;
  isTyping: boolean;
  placeholder: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  adjustHeight: (reset?: boolean) => void;
}) {
  return (
    <div
      className={cn(
        'relative rounded-xl border transition-all',
        'focus-within:ring-2',
      )}
      style={{
        background: 'var(--bg)',
        borderColor: 'var(--border)',
      }}
      onFocus={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(232,96,10,0.5)';
        (e.currentTarget as HTMLDivElement).style.boxShadow  = '0 0 0 3px rgba(232,96,10,0.08)';
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
          (e.currentTarget as HTMLDivElement).style.boxShadow  = 'none';
        }
      }}
    >
      <div className="overflow-y-auto">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => { onChange(e.target.value); adjustHeight(); }}
          onKeyDown={onKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            'w-full px-4 py-3.5 resize-none bg-transparent border-none text-sm',
            'focus-visible:ring-0 focus-visible:ring-offset-0',
            'placeholder:text-zinc-400 disabled:opacity-40 disabled:cursor-not-allowed',
            'min-h-[60px]',
          )}
          style={{ color: 'var(--text)', overflow: 'hidden', fontFamily: 'inherit' }}
        />
      </div>

      <div className="flex items-center justify-between px-3 pb-3">
        <span
          className="text-[10px] px-2 py-0.5 rounded-full border font-medium"
          style={{ color: 'var(--muted)', borderColor: 'var(--border)' }}
        >
          Route 66 AI
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px]" style={{ color: 'var(--muted)', opacity: 0.6 }}>
            {value ? `${value.length} chars` : 'Shift+Enter for new line'}
          </span>
          <button
            type="button"
            onClick={onSend}
            disabled={!value.trim() || disabled || isTyping}
            className={cn(
              'flex items-center justify-center rounded-lg p-1.5 border transition-all',
              'disabled:opacity-30 disabled:cursor-not-allowed active:scale-90',
            )}
            style={{
              background: value.trim() && !disabled ? 'var(--accent)' : '#E2DED9',
              color: value.trim() && !disabled ? '#fff' : 'var(--muted)',
              borderColor: 'transparent',
            }}
          >
            <ArrowUpIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ChatArea({ messages, onSendMessage, isTyping, storeReady, sidebarOpen, onToggleSidebar }: Props) {
  const [input, setInput]   = useState('');
  const scrollRef           = useRef<HTMLDivElement>(null);
  const bottomRef           = useRef<HTMLDivElement>(null);
  const nearBottom          = useRef(true);
  const typewriter          = useTypewriter();
  const isEmpty             = messages.length === 0 && !isTyping;

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 60, maxHeight: 200 });

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (el) nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
  }, []);

  useEffect(() => {
    if (nearBottom.current) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const send = () => {
    const msg = input.trim();
    if (!msg || !storeReady) return;
    onSendMessage(msg);
    setInput('');
    adjustHeight(true);
    nearBottom.current = true;
    textareaRef.current?.focus();
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const chip = (label: string) => {
    setInput(label);
    adjustHeight();
    textareaRef.current?.focus();
  };

  const inputPlaceholder = isEmpty && storeReady
    ? (typewriter || 'Ask about Route 66…')
    : storeReady
    ? 'Ask about Route 66…'
    : 'Create a knowledge store first…';

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* Top bar */}
      <div
        className="flex-shrink-0 flex items-center gap-3 px-5 h-11 border-b"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--muted)' }}
          onMouseOver={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')}
          onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
        >
          {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
        </button>
        <span className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Route 66 AI</span>
        <div
          className="ml-auto flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full border"
          style={{ color: 'var(--accent)', borderColor: 'var(--accent)', background: 'var(--accent-dim)' }}
        >
          <Shield size={10} />
          Docs only
        </div>
      </div>

      {isEmpty ? (

        /* ── Empty state — v0-chat centred layout ── */
        <div className="flex-1 flex flex-col items-center justify-center px-4 overflow-y-auto">
          <div className="w-full max-w-2xl flex flex-col items-center gap-8 py-16 anim-in">

            {/* Brand */}
            <div className="text-center space-y-3">
              <div
                className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
                style={{ background: 'var(--accent-dim)', border: '1.5px solid rgba(232,96,10,0.25)' }}
              >
                <span className="text-[9px] font-black leading-none text-center" style={{ color: 'var(--accent)' }}>
                  ROUTE<br/>66
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
                {storeReady ? 'Ask your Route 66 guides' : 'Set up your knowledge store'}
              </h1>
              <p className="text-sm max-w-sm mx-auto leading-relaxed" style={{ color: 'var(--muted)' }}>
                {storeReady
                  ? 'Every answer comes from the official guides — no guessing.'
                  : 'Create a store and upload your guides in the sidebar to get started.'}
              </p>
            </div>

            {/* Input box */}
            <div className="w-full">
              <ChatInput
                value={input}
                onChange={setInput}
                onKeyDown={onKey}
                onSend={send}
                disabled={!storeReady}
                isTyping={isTyping}
                placeholder={inputPlaceholder}
                textareaRef={textareaRef}
                adjustHeight={adjustHeight}
              />

              {/* Suggestion chips */}
              {storeReady && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {CHIPS.map(c => (
                    <button
                      key={c.label}
                      type="button"
                      onClick={() => chip(c.label)}
                      className="flex items-center gap-2 rounded-full border px-4 py-2 text-xs whitespace-nowrap transition-all anim-up"
                      style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--muted)' }}
                      onMouseOver={e => {
                        e.currentTarget.style.borderColor = 'rgba(232,96,10,0.4)';
                        e.currentTarget.style.background  = 'rgba(232,96,10,0.04)';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.background  = 'var(--surface)';
                      }}
                    >
                      <span>{c.emoji}</span>
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      ) : (

        /* ── Chat state ── */
        <>
          {/* Messages */}
          <div
            ref={scrollRef}
            onScroll={onScroll}
            className="flex-1 overflow-y-auto"
            style={{ background: 'var(--bg)' }}
          >
            <div className="w-full max-w-3xl mx-auto px-4 py-8 space-y-6">

              {messages.map((msg, i) => (
                <div key={i} className={cn('flex gap-3 anim-up', msg.role === 'user' ? 'justify-end' : 'justify-start')}>

                  {msg.role === 'model' && (
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border"
                      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                    >
                      <span className="text-[7px] font-black leading-none text-center" style={{ color: 'var(--accent)' }}>R<br/>66</span>
                    </div>
                  )}

                  <div className={msg.role === 'user' ? 'max-w-[60%]' : 'flex-1 min-w-0 max-w-3xl'}>
                    {msg.role === 'user' ? (
                      <div
                        className="px-4 py-3 rounded-2xl rounded-br-sm text-sm text-white leading-relaxed shadow-sm"
                        style={{ background: 'var(--user-bg)' }}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ) : (
                      <div>
                        <div className="prose" dangerouslySetInnerHTML={{ __html: md(msg.content) }} />
                        {msg.citations && msg.citations.length > 0 && (
                          <details className="mt-3 group" open={false}>
                            <summary
                              className="cursor-pointer text-xs font-medium flex items-center gap-1.5 select-none w-fit list-none py-1"
                              style={{ color: 'var(--accent)' }}
                            >
                              <span className="transition-transform group-open:rotate-90 inline-block">▶</span>
                              {msg.citations.length} source{msg.citations.length > 1 ? 's' : ''} referenced
                            </summary>
                            <div className="mt-2 space-y-1.5 border-l-2 pl-3" style={{ borderColor: 'var(--border)' }}>
                              {msg.citations.map((c, j) => c.snippet && (
                                <p key={j} className="text-xs italic leading-relaxed" style={{ color: 'var(--muted)' }}>"{c.snippet}"</p>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border"
                      style={{ background: '#F2EEE9', borderColor: 'var(--border)' }}
                    >
                      <span className="text-[10px]">👤</span>
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3 anim-up">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                  >
                    <span className="text-[7px] font-black leading-none text-center" style={{ color: 'var(--accent)' }}>R<br/>66</span>
                  </div>
                  <div
                    className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-bl-sm border shadow-sm"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full dot1" style={{ background: 'var(--accent)' }} />
                    <span className="w-1.5 h-1.5 rounded-full dot2" style={{ background: 'var(--accent)' }} />
                    <span className="w-1.5 h-1.5 rounded-full dot3" style={{ background: 'var(--accent)' }} />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input bar */}
          <div
            className="flex-shrink-0 px-4 pb-5 pt-3 border-t"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="max-w-3xl mx-auto">
              <ChatInput
                value={input}
                onChange={setInput}
                onKeyDown={onKey}
                onSend={send}
                disabled={!storeReady}
                isTyping={isTyping}
                placeholder="Ask about Route 66…"
                textareaRef={textareaRef}
                adjustHeight={adjustHeight}
              />
              <p className="text-center text-[10px] mt-2" style={{ color: 'var(--muted)', opacity: 0.5 }}>
                Answers sourced strictly from Route 66 guides
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
