'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import { ChatArea } from '../components/ChatArea';
import { ToastContainer, ToastProps } from '../components/Toast';
import { 
  getStore, createStore, deleteStore, 
  listFiles, deleteFile, uploadFile,
  listConversations, createConversation, deleteConversation,
  getMessages, sendMessage,
  Conversation, FileEntry, Message
} from '../lib/api';

export default function Home() {
  const [storeReady, setStoreReady] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [toasts, setToasts] = useState<Omit<ToastProps, 'onDismiss'>[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const addToast = useCallback((message: string, variant: ToastProps['variant'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, variant }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const loadInitialData = useCallback(async () => {
    try {
      const store = await getStore();
      setStoreReady(!!store);

      if (store) {
        const [filesData, convsData] = await Promise.all([
          listFiles(),
          listConversations()
        ]);
        setFiles(filesData?.files || []);
        setConversations(convsData?.conversations || []);
        
        if (convsData?.conversations?.length > 0) {
          setActiveConvId(convsData.conversations[0].id);
        }
      }
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'Failed to load initial data', 'error');
    } finally {
      setIsInitialized(true);
    }
  }, [addToast]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (activeConvId) {
      getMessages(activeConvId)
        .then(res => setMessages(res?.messages || []))
        .catch(err => addToast(err.message || 'Failed to load messages', 'error'));
    } else {
      setMessages([]);
    }
  }, [activeConvId, addToast]);

  const handleCreateStore = async () => {
    try {
      await createStore();
      setStoreReady(true);
      addToast('Knowledge store created successfully!', 'success');
      // Refresh files list
      const filesData = await listFiles();
      setFiles(filesData?.files || []);
    } catch (err: any) {
      addToast(err.message || 'Failed to create store', 'error');
    }
  };

  const handleDeleteStore = async () => {
    if (!confirm('Are you sure you want to delete the store? This will delete all files.')) return;
    try {
      await deleteStore();
      setStoreReady(false);
      setFiles([]);
      addToast('Store deleted', 'info');
    } catch (err: any) {
      addToast(err.message || 'Failed to delete store', 'error');
    }
  };

  const handleUploadFile = async (file: File) => {
    await uploadFile(file);
    addToast(`${file.name} uploaded successfully!`, 'success');
    const filesData = await listFiles();
    setFiles(filesData?.files || []);
  };

  const handleDeleteFile = async (name: string) => {
    try {
      await deleteFile(name);
      addToast(`File ${name} deleted`, 'info');
      const filesData = await listFiles();
      setFiles(filesData?.files || []);
    } catch (err: any) {
      addToast(err.message || 'Failed to delete file', 'error');
    }
  };

  const handleIngestComplete = async () => {
    addToast('Bulk ingestion complete!', 'success');
    const filesData = await listFiles();
    setFiles(filesData?.files || []);
  };

  const handleNewConversation = async () => {
    try {
      const conv = await createConversation();
      setConversations(prev => [conv, ...prev]);
      setActiveConvId(conv.id);
      addToast('New conversation created', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to create conversation', 'error');
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConvId === id) {
        setActiveConvId(null);
      }
      addToast('Conversation deleted', 'info');
    } catch (err: any) {
      addToast(err.message || 'Failed to delete conversation', 'error');
    }
  };

  const handleSendMessage = async (content: string) => {
    let currentConvId = activeConvId;

    if (!currentConvId) {
      try {
        const conv = await createConversation();
        setConversations(prev => [conv, ...prev]);
        currentConvId = conv.id;
        setActiveConvId(conv.id);
      } catch (err: any) {
        addToast(err.message || 'Failed to create conversation', 'error');
        return;
      }
    }

    // Optimistically add user message
    const userMsg: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await sendMessage(content, currentConvId);
      
      // If backend created a new conversation automatically (just in case)
      if (res.conversation_id && res.conversation_id !== currentConvId) {
        setActiveConvId(res.conversation_id);
        const convsData = await listConversations();
        setConversations(convsData?.conversations || []);
      }

      // Re-fetch messages or append
      const botMsg: Message = { 
        role: 'model', 
        content: res.message, 
        citations: res.citations 
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (err: any) {
      addToast(err.message || 'Failed to send message', 'error');
      // Remove optimistic message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsTyping(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0f1115]">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="flex h-full overflow-hidden">
      <Sidebar 
        conversations={conversations}
        activeConvId={activeConvId}
        onSelectConv={setActiveConvId}
        onDeleteConv={handleDeleteConversation}
        onNewConv={handleNewConversation}
        
        storeReady={storeReady}
        onCreateStore={handleCreateStore}
        onDeleteStore={handleDeleteStore}
        
        files={files}
        onUploadFile={handleUploadFile}
        onDeleteFile={handleDeleteFile}
        
        onIngestComplete={handleIngestComplete}
        onError={(msg) => addToast(msg, 'error')}
      />
      
      <ChatArea 
        messages={messages}
        onSendMessage={handleSendMessage}
        isTyping={isTyping}
        storeReady={storeReady}
      />
      
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </main>
  );
}
