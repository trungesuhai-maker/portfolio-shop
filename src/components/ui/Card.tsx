import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/src/lib/utils';
import { motion, HTMLMotionProps } from 'motion/react';

export interface CardProps extends Omit<HTMLMotionProps<"div">, 'ref'> {
  hoverable?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={hoverable ? { y: -2, transition: { duration: 0.2 } } : undefined}
        className={cn(
          'rounded-[12px] border-2 border-slate-200 bg-white shadow-none text-slate-900',
          hoverable && 'hover:border-slate-300 transition-colors duration-200',
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

export { Card };

