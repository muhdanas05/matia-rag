'use client';
import React, { useRef, useState } from 'react';
import { Conversation, FileEntry } from '../lib/api';
import { FileList } from './FileList';
import { IngestPanel } from './IngestPanel';

interface SidebarProps {
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
  conv: Conversation;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(conv.title);
  const inputRef              = useRef<HTMLInputElement>(null);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft(conv.title);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 10);
  };

  const commit = () => {
    setEditing(false);
    const t = draft.trim();
    if (t && t !== conv.title) onRename(t);
    else setDraft(conv.title);
  };

  return (
    <div
      onClick={onSelect}
      className={`conv-item flex items-center gap-1.5 px-2.5 py-2 rounded-lg cursor-pointer group border ${active ? 'border-l-2' : 'border-transparent hover:border-transparent'}`}
      style={active
        ? { background: 'rgba(232,96,10,0.12)', borderLeftColor: 'var(--accent)', borderColor: 'transparent' }
        : { background: 'transparent' }
      }
    >
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: active ? 'var(--accent)' : 'rgba(255,255,255,0.3)' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
      </svg>

      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setEditing(false); setDraft(conv.title); } }}
          onClick={e => e.stopPropagation()}
          className="flex-1 bg-transparent text-xs outline-none border-b"
          style={{ color: 'rgba(255,255,255,0.85)', borderColor: 'var(--accent)' }}
        />
      ) : (
        <span className="flex-1 text-xs truncate" style={{ color: active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.55)' }}>{conv.title}</span>
      )}

      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button onClick={startEdit} className="p-0.5 rounded transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.3)' }} title="Rename">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
        </button>
        <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-0.5 rounded transition-colors hover:text-red-400" style={{ color: 'rgba(255,255,255,0.3)' }} title="Delete">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    </div>
  );
}

export function Sidebar({
  conversations, activeConvId, onSelectConv, onDeleteConv, onRenameConv, onNewConv,
  storeReady, onCreateStore, onDeleteStore,
  files, onUploadFile, onDeleteFile, onIngestComplete, onError,
}: SidebarProps) {
  const fileInputRef                    = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging]     = useState(false);
  const [isUploading, setIsUploading]   = useState(false);
  const [uploadProg, setUploadProg]     = useState({ done: 0, total: 0 });

  const handleFileUpload = async (fileList: File[]) => {
    try {
      setIsUploading(true);
      setUploadProg({ done: 0, total: fileList.length });
      for (let i = 0; i < fileList.length; i++) {
        await onUploadFile(fileList[i]);
        setUploadProg({ done: i + 1, total: fileList.length });
      }
    } catch (e: any) { onError(e.message || 'Upload failed'); }
    finally { setIsUploading(false); setUploadProg({ done: 0, total: 0 }); }
  };

  return (
    <div className="w-72 flex flex-col h-full overflow-hidden flex-shrink-0" style={{ background: 'var(--sidebar)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

      {/* Logo */}
      <div className="px-4 py-3.5 flex items-center gap-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: 'var(--accent)' }}>
          <span className="text-[8px] font-black leading-none text-center" style={{ color: 'var(--accent)' }}>ROUTE<br/>66</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-none">Route 66 AI</p>
          <p className="text-[10px] mt-0.5 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Document Assistant</p>
        </div>
      </div>

      {/* New chat */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <button
          onClick={onNewConv}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white transition-all active:scale-95"
          style={{ background: 'var(--accent)' }}
          onMouseOver={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
          onMouseOut={e => (e.currentTarget.style.background = 'var(--accent)')}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
          New chat
        </button>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto px-3 pb-2 min-h-0">
        <p className="text-[9px] font-semibold uppercase tracking-widest mb-1.5 px-1" style={{ color: 'rgba(255,255,255,0.25)' }}>Chats</p>
        {conversations.length === 0
          ? <p className="text-xs px-1 italic" style={{ color: 'rgba(255,255,255,0.2)' }}>No conversations yet.</p>
          : conversations.map(c => (
              <ConvItem
                key={c.id}
                conv={c}
                active={c.id === activeConvId}
                onSelect={() => onSelectConv(c.id)}
                onDelete={() => onDeleteConv(c.id)}
                onRename={title => onRenameConv(c.id, title)}
              />
            ))
        }
      </div>

      {/* Knowledge store + files */}
      <div className="flex-shrink-0 px-3 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>Knowledge Store</p>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${storeReady ? 'bg-green-400' : 'bg-red-500'}`} style={storeReady ? { boxShadow: '0 0 5px rgba(74,222,128,0.7)' } : {}} />
          </div>
          {storeReady
            ? <button onClick={onDeleteStore} className="text-[10px] transition-colors" style={{ color: 'rgba(239,68,68,0.6)' }} onMouseOver={e => (e.currentTarget.style.color = 'rgb(239,68,68)')} onMouseOut={e => (e.currentTarget.style.color = 'rgba(239,68,68,0.6)')}>Delete</button>
            : <button onClick={onCreateStore} className="text-[10px] font-medium transition-colors" style={{ color: 'var(--accent)' }}>+ Create</button>
          }
        </div>

        {storeReady && (
          <>
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => { e.preventDefault(); setIsDragging(false); handleFileUpload([...e.dataTransfer.files]); }}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all"
              style={isDragging
                ? { borderColor: 'var(--accent)', background: 'rgba(232,96,10,0.08)' }
                : { borderColor: 'rgba(255,255,255,0.12)', background: 'transparent' }
              }
              onMouseOver={e => { if (!isDragging) (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'); }}
              onMouseOut={e => { if (!isDragging) (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'); }}
            >
              <input type="file" ref={fileInputRef} onChange={e => { if (e.target.files?.length) handleFileUpload([...e.target.files]); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="hidden" multiple />
              <svg className="w-4 h-4 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgba(255,255,255,0.25)' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {isUploading
                  ? uploadProg.total > 1 ? `${uploadProg.done + 1} / ${uploadProg.total}…` : 'Uploading…'
                  : 'Click or drag to upload'}
              </p>
            </div>

            <FileList files={files} onDelete={onDeleteFile} storeReady={storeReady} />
            <IngestPanel storeReady={storeReady} onComplete={onIngestComplete} onError={onError} />
          </>
        )}
      </div>
    </div>
  );
}
