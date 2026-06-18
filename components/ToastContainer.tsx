'use client';

import type { Toast } from '@/hooks/useToast';

interface ToastContainerProps {
  toasts: Toast[];
}

export function ToastContainer({ toasts }: ToastContainerProps) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type} show`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
