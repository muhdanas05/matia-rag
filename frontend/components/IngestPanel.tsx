import React, { useState, useEffect } from 'react';
import { IngestStatus, startIngest, getIngestStatus } from '../lib/api';

interface IngestPanelProps {
  storeReady: boolean;
  onComplete: () => void;
  onError: (msg: string) => void;
}

export function IngestPanel({ storeReady, onComplete, onError }: IngestPanelProps) {
  const [folderPath, setFolderPath] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [status, setStatus] = useState<IngestStatus | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const checkStatus = async () => {
      try {
        const res = await getIngestStatus();
        setStatus(res);
        
        if (res && !res.active && isIngesting) {
          setIsIngesting(false);
          if (res.error) {
            onError(res.error);
          } else {
            onComplete();
          }
        }
      } catch (err: any) {
        console.error('Failed to get status:', err);
      }
    };

    if (isIngesting) {
      interval = setInterval(checkStatus, 2000);
      checkStatus(); // Check immediately
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isIngesting, onComplete, onError]);

  const handleIngest = async () => {
    if (!folderPath.trim()) return;
    
    try {
      setIsIngesting(true);
      await startIngest(folderPath);
    } catch (err: any) {
      setIsIngesting(false);
      onError(err.message || 'Failed to start ingestion');
    }
  };

  if (!storeReady) return null;

  return (
    <div className="mt-6 border-t border-[#30363d] pt-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-2">Bulk Ingest</h3>
      <div className="flex gap-2">
        <input
          type="text"
          value={folderPath}
          onChange={(e) => setFolderPath(e.target.value)}
          placeholder="Absolute folder path..."
          disabled={isIngesting}
          className="flex-1 bg-[#0f1115] border border-[#30363d] rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-accent"
        />
        <button
          onClick={handleIngest}
          disabled={isIngesting || !folderPath.trim()}
          className="bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-gray-200 px-3 py-1.5 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isIngesting ? 'Starting...' : 'Ingest'}
        </button>
      </div>

      {status?.active && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Uploading {status.processed_files} / {status.total_files}</span>
            <span className="truncate ml-2 max-w-[150px]">{status.current_file || 'Processing...'}</span>
          </div>
          <div className="h-1.5 w-full bg-[#0f1115] rounded overflow-hidden">
            <div 
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${status.total_files > 0 ? (status.processed_files / status.total_files) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
