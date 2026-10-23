import React from 'react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = '',
}) => {
  return (
    <div className={`p-10 sm:p-12 bg-white rounded-3xl border border-gray-200/90 text-center max-w-lg mx-auto space-y-4 shadow-2xs ${className}`}>
      <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-2xl shadow-2xs">
        {icon || (
          <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-bold text-gray-900 tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="pt-2">
          {action.href ? (
            <a
              href={action.href}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-xs"
            >
              {action.label}
            </a>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-xs"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
