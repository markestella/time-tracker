import { Leaf } from 'lucide-react';

interface BrandMarkProps {
  compact?: boolean;
  className?: string;
}

export function BrandMark({ compact = false, className = '' }: BrandMarkProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Leaf className="h-5 w-5" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="text-base font-semibold tracking-normal">Mckbyte</p>
          <p className="text-xs font-medium text-muted-foreground">TimeTracker</p>
        </div>
      )}
    </div>
  );
}
