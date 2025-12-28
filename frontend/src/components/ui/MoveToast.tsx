import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MoveToastProps {
  message: string;
  onClose: () => void;
}

export function MoveToast({ message, onClose }: MoveToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setIsVisible(true));
    
    // Auto dismiss after 2s
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 200); // Wait for exit animation
    }, 2000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg',
        'bg-[var(--bg-secondary)] border border-[var(--border-color)]',
        'transition-all duration-200 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      )}
    >
      <CheckCircle size={16} className="text-green-500" />
      <span className="text-sm text-[var(--text-primary)]">{message}</span>
    </div>
  );
}
