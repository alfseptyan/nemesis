import { cn } from '../../lib/utils.js';

export function Skeleton({ class: className = '', ...props }) {
  return <div class={cn('ui-skeleton', className)} {...props} />;
}
