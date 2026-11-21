import { cn, getStatusColor, getPriorityColor } from '@/lib/utils';

export default function Badge({ children, className }) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border', className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  return (
    <Badge className={getStatusColor(status)}>{status}</Badge>
  );
}

export function PriorityBadge({ priority }) {
  return (
    <Badge className={getPriorityColor(priority)}>{priority}</Badge>
  );
}