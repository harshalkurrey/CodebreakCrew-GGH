import React from 'react';
import { BookingStatus } from '../types';

interface StatusBadgeProps {
  status: BookingStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const configs: Record<BookingStatus, { label: string; bg: string; text: string; dot: string; border: string }> = {
    pending: {
      label: 'Pending Approval',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      dot: 'bg-amber-500',
      border: 'border-amber-200'
    },
    approved: {
      label: 'Approved (Awaiting Start)',
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      dot: 'bg-blue-500',
      border: 'border-blue-200'
    },
    active: {
      label: 'Active (In Rental)',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      dot: 'bg-emerald-500',
      border: 'border-emerald-200'
    },
    completed: {
      label: 'Completed (Returned)',
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      dot: 'bg-gray-500',
      border: 'border-gray-200'
    },
    cancelled: {
      label: 'Cancelled',
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      dot: 'bg-rose-500',
      border: 'border-rose-200'
    },
    rejected: {
      label: 'Declined',
      bg: 'bg-zinc-100',
      text: 'text-zinc-700',
      dot: 'bg-zinc-400',
      border: 'border-zinc-200'
    }
  };

  const config = configs[status] || {
    label: status,
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    dot: 'bg-gray-400',
    border: 'border-gray-200'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};
