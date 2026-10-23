import React from 'react';

export interface GeminiBadgeProps {
  model?: string;
  ms?: number;
  responseTimeMs?: number; // alias for backwards compatibility
  className?: string;
  variant?: 'subtle' | 'pill' | 'banner';
}

export const GeminiBadge: React.FC<GeminiBadgeProps> = ({
  model = 'gemini-3.5-flash-lite',
  ms,
  responseTimeMs,
  className = '',
  variant = 'pill',
}) => {
  const displayModel = model || 'gemini-3.5-flash-lite';
  const duration = ms !== undefined ? ms : responseTimeMs;

  if (variant === 'banner') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200/80 text-xs text-indigo-900 ${className}`}>
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
        </span>
        <span className="font-semibold">Powered by Gemini Flash-Lite</span>
        {model && (
          <>
            <span className="text-indigo-300">•</span>
            <span className="font-mono text-indigo-700">{displayModel}</span>
          </>
        )}
        {duration !== undefined && duration > 0 && (
          <>
            <span className="text-indigo-300">•</span>
            <span className="text-indigo-600 font-mono">{duration}ms</span>
          </>
        )}
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 border border-indigo-200/70 shadow-2xs ${className}`}
      title={`AI Model: ${displayModel}`}
    >
      <svg className="w-3.5 h-3.5 text-indigo-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
      </svg>
      <span>Powered by Gemini Flash-Lite</span>
      {model && (
        <>
          <span className="text-indigo-300">•</span>
          <span className="font-mono text-[11px] text-indigo-600">{displayModel}</span>
        </>
      )}
      {duration !== undefined && duration > 0 && (
        <span className="text-[11px] text-gray-500 font-normal">({duration}ms)</span>
      )}
    </span>
  );
};
