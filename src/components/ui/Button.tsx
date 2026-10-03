import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/src/lib/utils';
import { motion, HTMLMotionProps } from 'motion/react';

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, 'ref'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap font-bold ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 rounded-[12px] text-sm md:text-base',
          {
            'bg-indigo-600 text-white hover:bg-indigo-700 border-2 border-indigo-600 shadow-[0_2px_3px_0_rgba(0,0,0,0.25)] [&_svg]:text-white': variant === 'primary',
            'bg-white text-indigo-600 hover:bg-indigo-50 border-2 border-indigo-600 shadow-none [&_svg]:text-indigo-600': variant === 'secondary',
            'border-2 border-indigo-600 bg-white hover:bg-indigo-50 text-indigo-600 shadow-none [&_svg]:text-indigo-600': variant === 'outline',
            'bg-red-600 text-white hover:bg-red-700 border-2 border-red-600 shadow-[0_2px_3px_0_rgba(0,0,0,0.25)] [&_svg]:text-white': variant === 'danger',
            'hover:bg-slate-100 hover:text-slate-900 text-slate-600 bg-transparent border-2 border-transparent shadow-none': variant === 'ghost',
            'h-9 px-4 text-sm md:text-base': size === 'sm',
            'h-11 px-5 text-sm md:text-base': size === 'md',
            'h-13 px-7 text-sm md:text-base': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };

