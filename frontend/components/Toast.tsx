import React, { useEffect } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  variant: ToastVariant;
  onDismiss: (id: string) => void;
}

export function Toast({ id, message, variant, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, 3500);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  const bgColors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-purple-600'
  };

  return (
    <div className={`${bgColors[variant]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between mb-2 animate-in fade-in slide-in-from-bottom-4`}>
      <span className="text-sm font-medium">{message}</span>
      <button 
        onClick={() => onDismiss(id)}
        className="ml-4 text-white/80 hover:text-white focus:outline-none"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }: { toasts: Omit<ToastProps, 'onDismiss'>[], onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
