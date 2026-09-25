import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/src/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        <input
          ref={ref}
          className={cn(
            'flex h-11 w-full rounded-[12px] border-2 border-slate-200 bg-white px-4 py-2 text-[14px] font-sans text-slate-900 shadow-none transition-colors file:border-0 file:bg-transparent file:text-[14px] file:font-medium placeholder:text-[14px] placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 hover:border-slate-300',
            error && 'border-red-500 focus-visible:ring-red-500/20 focus-visible:border-red-500 hover:border-red-500',
            className
          )}
          {...props}
        />
        {helperText && (
          <p className={cn('text-[12px] font-medium font-sans', error ? 'text-red-500' : 'text-slate-500')}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };

