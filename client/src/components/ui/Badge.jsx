/**
 * Badge.jsx — Small pill badge with semantic color variants.
 */

import React from 'react';

const variantClasses = {
  success: 'bg-green-100 text-success border-green-200',
  warning: 'bg-amber-100 text-warning border-amber-200',
  error: 'bg-red-100 text-error border-red-200',
  info: 'bg-purple-100 text-primary border-purple-200',
  neutral: 'bg-gray-100 text-gray-600 border-gray-200',
};

/**
 * @param {object} props
 * @param {'success'|'warning'|'error'|'info'|'neutral'} props.variant
 * @param {React.ReactNode} props.children
 * @param {string} props.className
 */
export default function Badge({ variant = 'neutral', children, className = '' }) {
  return (
    <span
      className={[
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        variantClasses[variant] || variantClasses.neutral,
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
