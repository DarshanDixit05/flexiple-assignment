"use client";

interface Props {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onRetry, onDismiss }: Props) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center justify-between gap-3 animate-fade-in-up">
      <div className="flex items-center gap-2">
        <span className="text-red-500">⚠</span>
        <p className="text-sm text-red-800">{message}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm font-medium text-red-700 hover:text-red-900"
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss"
            className="text-red-400 hover:text-red-600 text-sm"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
