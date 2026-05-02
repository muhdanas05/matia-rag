export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface FileEntry {
  name: string;        // full resource path e.g. fileSearchStores/xxx/documents/yyy
  displayName?: string; // friendly filename
  state: string;       // e.g. STATE_ACTIVE, STATE_PENDING, STATE_FAILED
}

export interface IngestStatus {
  active: boolean;
  total_files: number;
  processed_files: number;
  current_file: string | null;
  error: string | null;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Citation {
  uri: string;
  title: string;
  snippet: string;
}

export interface Message {
  id?: string;
  role: 'user' | 'model';
  content: string;
  citations?: Citation[];
  created_at?: string;
}

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let msg = 'API error';
    try {
      const err = await response.json();
      msg = err.detail || err.error || msg;
    } catch {
      msg = response.statusText;
    }
    throw new Error(msg);
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) return null;
  return JSON.parse(text);
}

// Store API
export const getStore = () => fetchApi('/api/store');
export const createStore = () => fetchApi('/api/store', { method: 'POST' });
export const deleteStore = () => fetchApi('/api/store', { method: 'DELETE' });

// Files API
export const listFiles = () => fetchApi('/api/files');
export const deleteFile = (name: string) => fetchApi(`/api/files/${encodeURIComponent(name)}`, { method: 'DELETE' });

// Upload API
export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Upload failed');
  }

  return response.json();
};

export const startIngest = (folder_path: string) => 
  fetchApi('/api/ingest-folder', { 
    method: 'POST', 
    body: JSON.stringify({ folder_path }) 
  });

export const getIngestStatus = () => fetchApi('/api/ingest-status');

// Conversations API
export const listConversations = () => fetchApi('/api/conversations');
export const createConversation = () => fetchApi('/api/conversations', { method: 'POST' });
export const deleteConversation = (id: string) => fetchApi(`/api/conversations/${id}`, { method: 'DELETE' });
export const getMessages = (id: string) => fetchApi(`/api/conversations/${id}/messages`);

// Chat API
export const sendMessage = (message: string, conversation_id?: string | null) => 
  fetchApi('/api/chat', { 
    method: 'POST', 
    body: JSON.stringify({ message, conversation_id }) 
  });
