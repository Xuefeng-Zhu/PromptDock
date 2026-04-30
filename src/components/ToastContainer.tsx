import { useToastStore, type Toast } from '../stores/toast-store';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

// ─── Toast Item ────────────────────────────────────────────────────────────────

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const iconMap = {
    error: <AlertCircle size={16} className="shrink-0 text-red-500" />,
    success: <CheckCircle2 size={16} className="shrink-0 text-green-500" />,
    info: <Info size={16} className="shrink-0 text-blue-500" />,
  };

  const bgMap = {
    error: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
    success: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
    info: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
  };

  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded-lg border p-3 shadow-lg ${bgMap[toast.type]}`}
    >
      {iconMap[toast.type]}
      <p className="flex-1 text-sm text-gray-800 dark:text-gray-200">
        {toast.message}
      </p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ─── ToastContainer ────────────────────────────────────────────────────────────

/**
 * Renders all active toast notifications in a fixed position at the bottom-right
 * of the viewport. Should be rendered once in the app layout (e.g., in AppShell).
 */
export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
}
