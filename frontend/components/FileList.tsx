import React from 'react';
import { FileEntry } from '../lib/api';

interface FileListProps {
  files: FileEntry[];
  onDelete: (name: string) => void;
  storeReady: boolean;
}

export function FileList({ files, onDelete, storeReady }: FileListProps) {
  if (!storeReady) return null;

  if (files.length === 0) {
    return <p className="mt-3 text-xs text-white/25 italic">No files uploaded yet.</p>;
  }

  const getState = (raw: string) => raw.replace('STATE_', '');

  const getBadgeStyle = (raw: string) => {
    const s = getState(raw);
    if (s === 'ACTIVE') return { background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' };
    if (s === 'FAILED') return { background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' };
    return { background: 'rgba(234,179,8,0.15)', color: '#facc15', border: '1px solid rgba(234,179,8,0.3)' };
  };

  return (
    <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto">
      {files.map((file) => {
        const displayName = file.displayName || file.name?.split('/').pop() || 'Unknown';
        const fileId = file.name?.split('/').pop() || file.name;
        return (
          <div key={file.name} className="flex items-center gap-2 px-2.5 py-2 rounded-lg group" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <span className="text-xs text-white/60 flex-1 truncate" title={displayName}>{displayName}</span>
            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded flex-shrink-0" style={getBadgeStyle(file.state)}>
              {getState(file.state)}
            </span>
            <button
              onClick={() => onDelete(fileId)}
              className="text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
