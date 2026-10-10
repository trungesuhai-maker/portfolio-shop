import { Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface LoadingProps {
  fullScreen?: boolean;
  className?: string;
  size?: number;
}

export function Loading({ fullScreen, className, size = 24 }: LoadingProps) {
  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-3 text-brand-500', className)}>
      <Loader2 className="animate-spin" size={size} />
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}
