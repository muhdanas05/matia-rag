import React, { useRef, useState } from 'react';
import { Conversation, FileEntry } from '../lib/api';
import { FileList } from './FileList';
import { IngestPanel } from './IngestPanel';

interface SidebarProps {
  conversations: Conversation[];
  activeConvId: string | null;
  onSelectConv: (id: string) => void;
  onDeleteConv: (id: string) => void;
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

export function Sidebar({
  conversations, activeConvId, onSelectConv, onDeleteConv, onNewConv,
  storeReady, onCreateStore, onDeleteStore,
  files, onUploadFile, onDeleteFile, onIngestComplete, onError
}: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); if (storeReady) setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (!storeReady) return;
    await handleFileUpload([...e.dataTransfer.files]);
  };
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? [...e.target.files] : [];
    if (files.length) await handleFileUpload(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const handleFileUpload = async (files: File[]) => {
    try {
      setIsUploading(true);
      setUploadProgress({ done: 0, total: files.length });
      for (let i = 0; i < files.length; i++) {
        await onUploadFile(files[i]);
        setUploadProgress({ done: i + 1, total: files.length });
      }
    } catch (err: any) { onError(err.message || 'Upload failed'); }
    finally { setIsUploading(false); setUploadProgress({ done: 0, total: 0 }); }
  };

  return (
    <div className="w-80 flex flex-col h-full overflow-hidden" style={{ background: 'var(--sidebar)' }}>

      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-full border-2 border-[#E8600A] flex items-center justify-center">
            <span className="text-[9px] font-black text-[#E8600A] leading-none text-center">ROUTE<br/>66</span>
          </div>
          <div>
            <div className="text-white font-bold text-sm tracking-tight leading-none">Route 66 AI</div>
            <div className="text-white/40 text-[10px] mt-0.5 tracking-wide uppercase">Document Assistant</div>
          </div>
        </div>
      </div>

      {/* New Chat */}
      <div className="px-4 pt-4 pb-2 flex-shrink-0">
        <button
          onClick={onNewConv}
          className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
          style={{ background: 'var(--accent)', color: '#fff' }}
          onMouseOver={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
          onMouseOut={e => (e.currentTarget.style.background = 'var(--accent)')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
          New Chat
        </button>
      </div>

      {/* Conversations */}
      <div className="px-4 flex flex-col flex-1 min-h-0 pb-2">
        <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Conversations</p>
        <div className="flex-1 overflow-y-auto space-y-0.5 -mx-1 px-1">
          {conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => onSelectConv(conv.id)}
              className={`flex items-center group cursor-pointer rounded-lg px-3 py-2.5 text-sm transition-all ${
                activeConvId === conv.id
                  ? 'bg-[#E8600A]/15 border-l-2 border-[#E8600A] pl-2.5'
                  : 'hover:bg-white/5 border-l-2 border-transparent'
              }`}
            >
              <svg className="w-3.5 h-3.5 mr-2 flex-shrink-0 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
              <span className={`flex-1 truncate ${activeConvId === conv.id ? 'text-[#E8600A]' : 'text-white/60'}`}>{conv.title}</span>
              <button
                onClick={e => { e.stopPropagation(); onDeleteConv(conv.id); }}
                className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all ml-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          ))}
          {conversations.length === 0 && (
            <p className="text-xs text-white/25 italic px-2 pt-1">No conversations yet.</p>
          )}
        </div>
      </div>

      {/* Knowledge Store */}
      <div className="px-4 py-4 border-t border-white/10 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Knowledge Store</p>
            <span className={`w-2 h-2 rounded-full ${storeReady ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]' : 'bg-red-500'}`} />
          </div>
          {storeReady ? (
            <button onClick={onDeleteStore} className="text-xs text-red-400/70 hover:text-red-400 transition-colors">Delete</button>
          ) : (
            <button onClick={onCreateStore} className="text-xs text-[#E8600A] hover:text-[#C5501A] transition-colors font-medium">+ Create</button>
          )}
        </div>

        {storeReady && (
          <>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-all ${
                isDragging ? 'border-[#E8600A] bg-[#E8600A]/10' : 'border-white/15 hover:border-white/30'
              }`}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple />
              <svg className="w-5 h-5 mx-auto mb-1 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
              <p className="text-[11px] text-white/40">
                {isUploading
                  ? uploadProgress.total > 1
                    ? `Uploading ${uploadProgress.done + 1} / ${uploadProgress.total}…`
                    : 'Uploading…'
                  : 'Click or drag files to upload'}
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
