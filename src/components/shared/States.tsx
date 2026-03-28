import { ReactNode } from 'react';
import { AlertCircle, Inbox, LoaderCircle } from 'lucide-react';

type InlineAlertProps = {
  message?: string | null;
  tone?: 'error' | 'success' | 'info';
};

export function InlineAlert({ message, tone = 'info' }: InlineAlertProps) {
  if (!message) {
    return null;
  }

  const toneClassName =
    tone === 'error'
      ? 'bg-error-container/40 text-error border-error/20'
      : tone === 'success'
        ? 'bg-primary/8 text-primary border-primary/15'
        : 'bg-surface-container-low text-on-surface-variant border-outline-variant/20';

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm flex items-start gap-3 ${toneClassName}`}>
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function LoadingState({ title = 'Loading workspace...' }: { title?: string }) {
  return (
    <div className="min-h-[280px] rounded-2xl border border-outline-variant/15 bg-surface-container-lowest flex items-center justify-center">
      <div className="text-center">
        <LoaderCircle className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-on-surface">{title}</p>
      </div>
    </div>
  );
}

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-lowest px-6 py-10 text-center">
      <Inbox className="w-10 h-10 text-outline mx-auto mb-4" />
      <h3 className="text-base font-bold text-on-surface">{title}</h3>
      <p className="text-sm text-on-surface-variant mt-2 max-w-md mx-auto">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
