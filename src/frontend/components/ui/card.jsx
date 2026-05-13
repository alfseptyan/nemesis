import { cn } from '../../lib/utils.js';

export function Card({ class: className = '', ...props }) {
  return <div class={cn('ui-card', className)} {...props} />;
}

export function CardHeader({ class: className = '', ...props }) {
  return <div class={cn('ui-card-header', className)} {...props} />;
}

export function CardTitle({ class: className = '', ...props }) {
  return <h3 class={cn('ui-card-title', className)} {...props} />;
}

export function CardDescription({ class: className = '', ...props }) {
  return <p class={cn('ui-card-description', className)} {...props} />;
}

export function CardContent({ class: className = '', ...props }) {
  return <div class={cn('ui-card-content', className)} {...props} />;
}

export function CardFooter({ class: className = '', ...props }) {
  return <div class={cn('ui-card-footer', className)} {...props} />;
}
