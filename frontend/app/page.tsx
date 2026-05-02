'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from '../components/Sidebar';
import { ChatArea } from '../components/ChatArea';
import { ToastContainer, ToastProps } from '../components/Toast';
import {
  getStore, createStore, deleteStore,
  listFiles, deleteFile, uploadFile,
  listConversations, deleteConversation, renameConversation,
  getMessages, sendMessage,
  Conversation, FileEntry, Message,
} from '../lib/api';

export default function Home() {
  const [storeReady, setStoreReady]       = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId]   = useState<string | null>(null);
  const [messages, setMessages]           = useState<Message[]>([]);
  const [files, setFiles]                 = useState<FileEntry[]>([]);
  const [toasts, setToasts]               = useState<Omit<ToastProps, 'onDismiss'>[]>([]);
  const [isTyping, setIsTyping]           = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const skipMsgLoad                       = useRef(false);

  const addToast = useCallback((message: string, variant: ToastProps['variant'] = 'info') => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts(prev => [...prev, { id, message, variant }]);
  }, []);

  const refreshFiles = useCallback(async () => {
    const d = await listFiles();
    setFiles(d?.documents || d?.files || []);
  }, []);

  const refreshConvs = useCallback(async () => {
    const d = await listConversations();
    setConversations(Array.isArray(d) ? d : []);
  }, []);

  // Initial load
  useEffect(() => {
    (async () => {
      try {
        const store = await getStore();
        setStoreReady(!!store?.name);
        if (store?.name) {
          const [fd, cd] = await Promise.all([listFiles(), listConversations()]);
          setFiles(fd?.documents || fd?.files || []);
          const convs = Array.isArray(cd) ? cd : [];
          setConversations(convs);
        }
      } catch (e: any) {
        addToast(e.message || 'Failed to load', 'error');
      } finally {
        setIsInitialized(true);
      }
    })();
  }, [addToast]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (skipMsgLoad.current) { skipMsgLoad.current = false; return; }
    if (!activeConvId) { setMessages([]); return; }
    getMessages(activeConvId)
      .then(d => setMessages(Array.isArray(d) ? d : []))
      .catch(() => setMessages([]));
  }, [activeConvId]);

  const handleCreateStore = async () => {
    try {
      await createStore();
      setStoreReady(true);
      await refreshFiles();
      addToast('Knowledge store created!', 'success');
    } catch (e: any) { addToast(e.message, 'error'); }
  };

  const handleDeleteStore = async () => {
    if (!confirm('Delete store and all files?')) return;
    try {
      await deleteStore();
      setStoreReady(false);
      setFiles([]);
      addToast('Store deleted', 'info');
    } catch (e: any) { addToast(e.message, 'error'); }
  };

  const handleUploadFile = async (file: File) => {
    await uploadFile(file);
    addToast(`${file.name} uploaded`, 'success');
    await refreshFiles();
  };

  const handleDeleteFile = async (name: string) => {
    try {
      await deleteFile(name);
      await refreshFiles();
      addToast('File deleted', 'info');
    } catch (e: any) { addToast(e.message, 'error'); }
  };

  // New chat — just clear state, backend creates conversation on first send
  const handleNewConversation = () => {
    setActiveConvId(null);
    setMessages([]);
  };

  const handleSelectConv = (id: string) => {
    if (id === activeConvId) return;
    setActiveConvId(id);
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConvId === id) { setActiveConvId(null); setMessages([]); }
    } catch (e: any) { addToast(e.message, 'error'); }
  };

  const handleRenameConversation = async (id: string, title: string) => {
    try {
      await renameConversation(id, title);
      setConversations(prev => prev.map(c => c.id === id ? { ...c, title } : c));
    } catch (e: any) { addToast(e.message, 'error'); }
  };

  const handleSendMessage = async (content: string) => {
    // Optimistically add user message
    setMessages(prev => [...prev, { role: 'user', content }]);
    setIsTyping(true);

    try {
      const res = await sendMessage(content, activeConvId);

      // If backend created a new conversation, update ID without reloading messages
      if (res.conversation_id && res.conversation_id !== activeConvId) {
        skipMsgLoad.current = true;
        setActiveConvId(res.conversation_id);
      }

      setMessages(prev => [...prev, {
        role: 'model',
        content: res.response,
        citations: res.citations,
      }]);

      // Refresh sidebar conversations (picks up auto-generated title)
      await refreshConvs();
    } catch (e: any) {
      addToast(e.message || 'Failed to send', 'error');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsTyping(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: 'var(--bg)' }}>
        <div className="w-7 h-7 rounded-full border-2 border-t-transparent spin" style={{ borderColor: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <main className="flex h-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      {sidebarOpen && (
        <Sidebar
          conversations={conversations}
          activeConvId={activeConvId}
          onSelectConv={handleSelectConv}
          onDeleteConv={handleDeleteConversation}
          onRenameConv={handleRenameConversation}
          onNewConv={handleNewConversation}
          storeReady={storeReady}
          onCreateStore={handleCreateStore}
          onDeleteStore={handleDeleteStore}
          files={files}
          onUploadFile={handleUploadFile}
          onDeleteFile={handleDeleteFile}
          onIngestComplete={refreshFiles}
          onError={msg => addToast(msg, 'error')}
        />
      )}
      <ChatArea
        messages={messages}
        onSendMessage={handleSendMessage}
        isTyping={isTyping}
        storeReady={storeReady}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(v => !v)}
      />
      <ToastContainer toasts={toasts} onDismiss={id => setToasts(prev => prev.filter(t => t.id !== id))} />
    </main>
  );
}
