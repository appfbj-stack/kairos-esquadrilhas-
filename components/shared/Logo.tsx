import { cn } from '@/lib/utils';

export function Logo({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 'h-8', md: 'h-10', lg: 'h-14' } as const;
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'grid place-items-center rounded-md bg-primary text-primary-foreground font-bold tracking-tight',
          sizeMap[size],
          size === 'sm' ? 'w-8 text-sm' : size === 'md' ? 'w-10 text-base' : 'w-14 text-xl'
        )}
        aria-hidden
      >
        K
      </div>
      <div className="flex flex-col leading-tight">
        <span className={cn('font-semibold', size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg')}>
          Kairos
        </span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Esquadrilhas 3D</span>
      </div>
    </div>
  );
}
