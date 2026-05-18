import React from 'react';

export default function ConfirmModal({ 
  isOpen, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel' 
}: { 
  isOpen: boolean, 
  message: string, 
  onConfirm: () => void, 
  onCancel: () => void, 
  confirmText?: string, 
  cancelText?: string 
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <p className="text-slate-800 font-medium mb-6 text-lg">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">
            {cancelText}
          </button>
          <button onClick={onConfirm} className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
