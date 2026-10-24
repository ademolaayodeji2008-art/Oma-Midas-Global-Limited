/**
 * EmptyState.jsx — Friendly empty state component with icon and message.
 */

import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * @param {object} props
 * @param {React.ComponentType} props.icon - Lucide icon component (default: Inbox)
 * @param {string} props.title - Main heading
 * @param {string} props.message - Descriptive message
 * @param {React.ReactNode} props.action - Optional CTA button or link
 * @param {string} props.className
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No data found',
  message = 'There are no items to display at this time.',
  action = null,
  className = '',
}) {
  return (
    <div className={['flex flex-col items-center justify-center py-12 px-6 text-center', className].join(' ')}>
      <div className="w-16 h-16 rounded-full bg-sectionBg flex items-center justify-center mb-4">
        <Icon size={32} className="text-gray-400" aria-hidden="true" />
      </div>
      <h3 className="font-heading text-lg font-semibold text-charcoal mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-md mb-4">{message}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
