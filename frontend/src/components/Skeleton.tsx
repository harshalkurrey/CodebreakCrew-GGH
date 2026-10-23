import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  count = 1,
  className = '',
  style,
  ...props
}) => {
  const variantStyles = {
    text: 'h-4 w-full rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-2xl',
  };

  const customStyle: React.CSSProperties = {
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
    ...style,
  };

  if (count > 1) {
    return (
      <div className="space-y-2.5 w-full">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`animate-pulse bg-gray-200/80 ${variantStyles[variant]} ${className}`}
            style={customStyle}
            {...props}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`animate-pulse bg-gray-200/80 ${variantStyles[variant]} ${className}`}
      style={customStyle}
      {...props}
    />
  );
};
