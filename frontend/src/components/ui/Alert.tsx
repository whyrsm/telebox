import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertVariant = 'error' | 'success' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

const variantStyles: Record<AlertVariant, { icon: React.ElementType; bg: string; border: string; iconColor: string }> = {
  error: {
    icon: AlertCircle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconColor: 'text-[var(--accent-red)]',
  },
  success: {
    icon: CheckCircle,
    bg: 'bg-green-50',
    border: 'border-green-200',
    iconColor: 'text-[var(--accent-green)]',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconColor: 'text-[var(--accent-blue)]',
  },
};

export function Alert({ variant = 'error', title, message, onDismiss, className }: AlertProps) {
  const styles = variantStyles[variant];
  const Icon = styles.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border',
        styles.bg,
        styles.border,
        'animate-in fade-in slide-in-from-top-1 duration-200',
        className
      )}
      role="alert"
    >
      <Icon size={18} className={cn('flex-shrink-0 mt-0.5', styles.iconColor)} />
      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-sm font-medium text-[var(--text-primary)] mb-0.5">{title}</p>
        )}
        <p className="text-sm text-[var(--text-secondary)]">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
          aria-label="Dismiss"
        >
          <X size={14} className="text-[var(--text-tertiary)]" />
        </button>
      )}
    </div>
  );
}
