import { cn } from '../../lib/utils.js';

export function Tabs({ class: className = '', ...props }) {
  return <div class={cn('ui-tabs', className)} {...props} />;
}

export function TabsList({ class: className = '', ...props }) {
  return <div class={cn('ui-tabs-list', className)} {...props} />;
}

export function TabsTrigger({ class: className = '', active = false, ...props }) {
  return <button class={cn('ui-tabs-trigger', active && 'a', className)} {...props} />;
}
