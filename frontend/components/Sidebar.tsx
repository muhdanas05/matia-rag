'use client';
import React, { useRef, useState } from 'react';
import { Plus, Pencil, X, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Conversation, FileEntry } from '../lib/api';
import { FileList } from './FileList';
import { IngestPanel } from './IngestPanel';

interface Props {
  conversations: Conversation[];
  activeConvId: string | null;
  onSelectConv: (id: string) => void;
  onDeleteConv: (id: string) => void;
  onRenameConv: (id: string, title: string) => void;
  onNewConv: () => void;
  storeReady: boolean;
  onCreateStore: () => void;
  onDeleteStore: () => void;
  files: FileEntry[];
  onUploadFile: (file: File) => Promise<void>;
  onDeleteFile: (name: string) => void;
  onIngestComplete: () => void;
  onError: (msg: string) => void;
}

function ConvItem({ conv, active, onSelect, onDelete, onRename }: {
  conv: Conversation; active: boolean;
  onSelect: () => void; onDelete: () => void; onRename: (t: string) => void;
}) {
  const [editing, setEdit] = useState(false);
  const [draft, setDraft]  = useState(conv.title);
  const inputRef           = useRef<HTMLInputElement>(null);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); setDraft(conv.title); setEdit(true);
    setTimeout(() => inputRef.current?.select(), 10);
  };
  const commit = () => {
    setEdit(false);
    const t = draft.trim();
    if (t && t !== conv.title) onRename(t); else setDraft(conv.title);
  };

  return (
    <div
      onClick={onSelect}
      className="group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
      style={active
        ? { background: 'rgba(232,96,10,0.14)', color: 'rgba(255,255,255,0.92)' }
        : { background: 'transparent', color: 'rgba(255,255,255,0.5)' }
      }
      onMouseOver={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
      onMouseOut={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setEdit(false); setDraft(conv.title); } }}
          onClick={e => e.stopPropagation()}
          className="flex-1 bg-transparent text-xs outline-none border-b"
          style={{ borderColor: 'var(--accent)', color: 'rgba(255,255,255,0.9)' }}
        />
      ) : (
        <span className="flex-1 text-xs truncate">{conv.title}</span>
      )}
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={startEdit} title="Rename" className="p-1 rounded hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}>
          <Pencil size={11} />
        </button>
        <button onClick={e => { e.stopPropagation(); onDelete(); }} title="Delete" className="p-1 rounded hover:text-red-400 transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}>
          <X size={11} />
        </button>
      </div>
    </div>
  );
}

export function Sidebar({ conversations, activeConvId, onSelectConv, onDeleteConv, onRenameConv, onNewConv, storeReady, onCreateStore, onDeleteStore, files, onUploadFile, onDeleteFile, onIngestComplete, onError }: Props) {
  const fileInputRef              = useRef<HTMLInputElement>(null);
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [upProg, setUpProg]       = useState({ done: 0, total: 0 });
  const [storeOpen, setStoreOpen] = useState(true);

  const handleUpload = async (list: File[]) => {
    try {
      setUploading(true); setUpProg({ done: 0, total: list.length });
      for (let i = 0; i < list.length; i++) {
        await onUploadFile(list[i]);
        setUpProg({ done: i + 1, total: list.length });
      }
    } catch (e: any) { onError(e.message || 'Upload failed'); }
    finally { setUploading(false); setUpProg({ done: 0, total: 0 }); }
  };

  return (
    <div className="flex flex-col h-full flex-shrink-0 sidebar-enter" style={{ width: '268px', background: 'var(--sidebar-bg)', borderRight: '1px solid rgba(255,255,255,0.07)' }}>

      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-dim)', border: '1.5px solid var(--accent)' }}>
          <span className="text-[8px] font-black leading-none text-center" style={{ color: 'var(--accent)' }}>ROUTE<br/>66</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white leading-none truncate">Route 66 AI</p>
          <p className="text-[9px] mt-0.5 uppercase tracking-widest truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>Document Assistant</p>
        </div>
      </div>

      {/* New chat */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <button
          onClick={onNewConv}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium text-white transition-all active:scale-95 hover:opacity-90"
          style={{ background: 'var(--accent)' }}
        >
          <Plus size={15} />
          New chat
        </button>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 min-h-0">
        <p className="text-[9px] font-semibold uppercase tracking-widest mb-1 px-2 pt-1" style={{ color: 'rgba(255,255,255,0.22)' }}>Recent</p>
        {conversations.length === 0
          ? <p className="text-xs px-3 py-2 italic" style={{ color: 'rgba(255,255,255,0.2)' }}>No conversations yet</p>
          : conversations.map(c => (
              <ConvItem key={c.id} conv={c} active={c.id === activeConvId}
                onSelect={() => onSelectConv(c.id)}
                onDelete={() => onDeleteConv(c.id)}
                onRename={t => onRenameConv(c.id, t)}
              />
            ))
        }
      </div>

      {/* Store section */}
      <div className="flex-shrink-0 px-3 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>

        {/* Header row */}
        <button className="w-full flex items-center justify-between mb-2 px-1" onClick={() => setStoreOpen(v => !v)}>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>Knowledge Store</span>
            <span className={`w-1.5 h-1.5 rounded-full ${storeReady ? 'bg-emerald-400' : 'bg-red-500'}`}
              style={storeReady ? { boxShadow: '0 0 5px rgba(52,211,153,0.8)' } : {}} />
          </div>
          <div className="flex items-center gap-2">
            {!storeReady
              ? <button onClick={e => { e.stopPropagation(); onCreateStore(); }} className="text-[10px] font-medium transition-colors" style={{ color: 'var(--accent)' }}>+ Create</button>
              : <button onClick={e => { e.stopPropagation(); onDeleteStore(); }} className="p-0.5 rounded transition-colors hover:text-red-400" style={{ color: 'rgba(255,255,255,0.25)' }} title="Delete store"><Trash2 size={11} /></button>
            }
            {storeReady && (storeOpen ? <ChevronUp size={12} style={{ color: 'rgba(255,255,255,0.25)' }} /> : <ChevronDown size={12} style={{ color: 'rgba(255,255,255,0.25)' }} />)}
          </div>
        </button>

        {storeReady && storeOpen && (
          <div className="space-y-2">
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); handleUpload([...e.dataTransfer.files]); }}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all"
              style={dragging
                ? { borderColor: 'var(--accent)', background: 'rgba(232,96,10,0.1)' }
                : { borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }
              }
              onMouseOver={e => { if (!dragging) (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'); }}
              onMouseOut={e => { if (!dragging) (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'); }}
            >
              <input ref={fileInputRef} type="file" multiple className="hidden"
                onChange={e => { if (e.target.files?.length) handleUpload([...e.target.files]); if (fileInputRef.current) fileInputRef.current.value = ''; }} />
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {uploading
                  ? upProg.total > 1 ? `Uploading ${upProg.done}/${upProg.total}…` : 'Uploading…'
                  : 'Drop files or click to upload'}
              </p>
            </div>

            <FileList files={files} onDelete={onDeleteFile} storeReady={storeReady} />
            <IngestPanel storeReady={storeReady} onComplete={onIngestComplete} onError={onError} />
          </div>
        )}
      </div>
    </div>
  );
}
