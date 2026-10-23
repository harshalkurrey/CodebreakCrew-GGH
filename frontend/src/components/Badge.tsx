import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  const variantStyles = {
    primary: {
      wrap: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
      dot: 'bg-indigo-500',
    },
    secondary: {
      wrap: 'bg-purple-50 text-purple-700 border-purple-200/80',
      dot: 'bg-purple-500',
    },
    success: {
      wrap: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    warning: {
      wrap: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
    },
    danger: {
      wrap: 'bg-rose-50 text-rose-800 border-rose-200',
      dot: 'bg-rose-500',
    },
    neutral: {
      wrap: 'bg-gray-100 text-gray-700 border-gray-200',
      dot: 'bg-gray-400',
    },
  };

  const currentVariant = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${sizeStyles[size]} ${currentVariant.wrap} ${className}`}
      {...props}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${currentVariant.dot}`} />}
      {children}
    </span>
  );
};
