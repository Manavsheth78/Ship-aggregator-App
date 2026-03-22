import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[#1B5E20] text-white',
        secondary: 'border-transparent bg-gray-200 text-gray-900',
        destructive: 'border-transparent bg-red-600 text-white',
        outline: 'text-gray-700 border-gray-300',
        'in-transit': 'border-transparent bg-yellow-100 text-yellow-800',
        delivered: 'border-transparent bg-green-100 text-green-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
