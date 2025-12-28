import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  pulse = false
}: BadgeProps) {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  const pulseClasses = pulse
    ? variant === 'success'
      ? 'pulse-success'
      : variant === 'danger'
      ? 'pulse-danger'
      : ''
    : '';

  return (
    <span
      className={`
        inline-flex items-center justify-center
        font-medium rounded-full
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${pulseClasses}
      `}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: 'pending' | 'in-progress' | 'completed' }) {
  const config = {
    pending: { label: 'Bekliyor', variant: 'warning' as const },
    'in-progress': { label: 'Devam Ediyor', variant: 'info' as const },
    completed: { label: 'Tamamlandı', variant: 'success' as const },
  };

  const { label, variant } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function DecisionBadge({ decision }: { decision: 'accepted' | 'rejected' | null }) {
  if (!decision) return <Badge variant="default">-</Badge>;

  const config = {
    accepted: { label: 'KABUL', variant: 'success' as const },
    rejected: { label: 'RED', variant: 'danger' as const },
  };

  const { label, variant } = config[decision];
  return <Badge variant={variant} pulse>{label}</Badge>;
}

export function SeverityBadge({ severity }: { severity: 'critical' | 'major' | 'minor' }) {
  const config = {
    critical: { label: 'Kritik', variant: 'danger' as const },
    major: { label: 'Büyük', variant: 'warning' as const },
    minor: { label: 'Küçük', variant: 'default' as const },
  };

  const { label, variant } = config[severity];
  return <Badge variant={variant} size="sm">{label}</Badge>;
}
