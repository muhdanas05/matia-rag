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
  conversations,
  activeConvId,
  onSelectConv,
  onDeleteConv,
  onNewConv,
  storeReady,
  onCreateStore,
  onDeleteStore,
  files,
  onUploadFile,
  onDeleteFile,
  onIngestComplete,
  onError
}: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (storeReady) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!storeReady) return;
    
    const file = e.dataTransfer.files[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      await onUploadFile(file);
    } catch (err: any) {
      onError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-80 bg-sidebar border-r border-[#30363d] flex flex-col h-full overflow-hidden">
      
      {/* Conversations Section */}
      <div className="p-4 flex flex-col flex-1 min-h-0">
        <button 
          onClick={onNewConv}
          className="w-full mb-4 bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30 py-2 rounded-md flex items-center justify-center gap-2 transition-colors font-medium text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
          New chat
        </button>
        
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Conversations</h3>
        <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-1">
          {conversations.map(conv => (
            <div 
              key={conv.id} 
              className={`flex items-center group cursor-pointer rounded-md p-2 text-sm transition-colors ${
                activeConvId === conv.id ? 'bg-[#30363d] text-white' : 'text-gray-300 hover:bg-[#21262d]'
              }`}
              onClick={() => onSelectConv(conv.id)}
            >
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
              <span className="flex-1 truncate">{conv.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteConv(conv.id); }}
                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity focus:outline-none"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="text-sm text-gray-500 italic mt-2">No conversations.</div>
          )}
        </div>
      </div>

      {/* Store & Knowledge Section */}
      <div className="p-4 border-t border-[#30363d] bg-sidebar flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-200">Knowledge Store</h3>
            <span className={`w-2.5 h-2.5 rounded-full ${storeReady ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></span>
          </div>
          {storeReady ? (
            <button onClick={onDeleteStore} className="text-xs text-red-400 hover:text-red-300">Delete</button>
          ) : (
            <button onClick={onCreateStore} className="text-xs text-accent hover:text-accent-hover">Create</button>
          )}
        </div>

        {storeReady && (
          <>
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                isDragging ? 'border-accent bg-accent/5' : 'border-[#30363d] hover:border-gray-500 bg-[#0f1115]'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
              />
              <svg className="w-6 h-6 mx-auto mb-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
              <p className="text-xs text-gray-400">
                {isUploading ? 'Uploading...' : 'Click or drag file to upload'}
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
