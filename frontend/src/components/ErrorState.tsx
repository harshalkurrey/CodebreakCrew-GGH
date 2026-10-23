import React from 'react';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while processing your request. Please try again.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`p-8 sm:p-10 bg-rose-50/70 border border-rose-200 rounded-3xl text-center max-w-lg mx-auto space-y-4 shadow-2xs ${className}`}>
      <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100/80 border border-rose-200 flex items-center justify-center text-rose-600 text-2xl">
        <svg className="w-7 h-7 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-bold text-rose-900 tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-rose-700 leading-relaxed max-w-sm mx-auto">
          {message}
        </p>
      </div>

      {onRetry && (
        <div className="pt-2">
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition shadow-xs"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Try Again</span>
          </button>
        </div>
      )}
    </div>
  );
};
