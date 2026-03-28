import { ReactNode } from 'react';
import { X } from 'lucide-react';

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClassName?: string;
};

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  maxWidthClassName = 'max-w-2xl',
}: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-on-surface/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className={`mx-auto my-8 w-full ${maxWidthClassName} bg-surface-container-lowest rounded-2xl shadow-2xl ring-1 ring-outline-variant/10`}>
        <div className="px-6 py-5 border-b border-outline-variant/10 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-on-surface">{title}</h3>
            {description ? (
              <p className="text-sm text-on-surface-variant mt-1">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container-high text-outline transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">{children}</div>

        {footer ? (
          <div className="px-6 py-5 border-t border-outline-variant/10 bg-surface-container-low rounded-b-2xl">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  isPending?: boolean;
  tone?: 'danger' | 'primary';
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
  isPending = false,
  tone = 'danger',
}: ConfirmDialogProps) {
  const confirmClassName =
    tone === 'danger'
      ? 'bg-error text-white hover:brightness-95'
      : 'bg-primary text-white hover:bg-primary/90';

  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={onClose}
      maxWidthClassName="max-w-lg"
      footer={(
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 ${confirmClassName}`}
          >
            {isPending ? 'Working...' : confirmLabel}
          </button>
        </div>
      )}
    >
      <p className="text-sm text-on-surface-variant leading-relaxed">{description}</p>
    </Modal>
  );
}
