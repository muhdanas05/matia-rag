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
    return (
      <div className="mt-4 text-sm text-gray-500 italic">
        No files uploaded yet.
      </div>
    );
  }

  const getBadgeColor = (state: string) => {
    switch (state) {
      case 'ACTIVE': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'FAILED': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="mt-4 space-y-2 max-h-64 overflow-y-auto pr-2">
      {files.map((file) => (
        <div key={file.name} className="flex items-center justify-between p-2 rounded-md bg-[#21262d] border border-[#30363d] group">
          <div className="flex flex-col flex-1 min-w-0 mr-3">
            <span className="text-sm text-gray-200 truncate" title={file.name}>
              {file.name}
            </span>
            <span className={`text-[10px] uppercase font-semibold border px-1.5 py-0.5 rounded w-max mt-1 ${getBadgeColor(file.state)}`}>
              {file.state}
            </span>
          </div>
          <button
            onClick={() => onDelete(file.name)}
            className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
            title="Delete file"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
