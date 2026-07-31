import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({
  className = '',
  variant = 'primary',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-colors focus:outline-none';

  const variants = {
    primary: 'border-transparent bg-primary text-primary-foreground',
    secondary: 'border-transparent bg-secondary text-secondary-foreground',
    outline: 'border-border text-foreground',
    success: 'border-transparent bg-emerald-500/25 text-emerald-300 border border-emerald-500/35',
    warning: 'border-transparent bg-amber-500/25 text-amber-300 border border-amber-500/35',
    danger: 'border-transparent bg-rose-500/25 text-rose-300 border border-rose-500/35',
    info: 'border-transparent bg-blue-500/25 text-blue-300 border border-blue-500/35'
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};
