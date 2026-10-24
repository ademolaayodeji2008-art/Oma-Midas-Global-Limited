/**
 * LoadingSkeleton.jsx — Shimmer loading skeleton component.
 */

import React from 'react';

/**
 * @param {object} props
 * @param {'sm'|'md'|'lg'|'xl'} props.height - Height preset or custom
 * @param {string} props.width - Custom width (e.g., '100%', '50%', '200px')
 * @param {'rectangle'|'circle'|'text'} props.variant
 * @param {string} props.className
 */
export default function LoadingSkeleton({
  height = 'md',
  width = '100%',
  variant = 'rectangle',
  className = '',
}) {
  const heightClasses = {
    sm: 'h-4',
    md: 'h-6',
    lg: 'h-12',
    xl: 'h-24',
  };

  const variantClasses = {
    rectangle: 'rounded-lg',
    circle: 'rounded-full aspect-square',
    text: 'rounded',
  };

  return (
    <div
      className={[
        'bg-gray-200 animate-pulse',
        heightClasses[height] || height,
        variantClasses[variant] || variantClasses.rectangle,
        className,
      ].join(' ')}
      style={{ width }}
      aria-label="Loading"
      role="status"
    />
  );
}

/**
 * Skeleton for a card
 */
export function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <div className={['card-base space-y-3', className].join(' ')}>
      <LoadingSkeleton height="sm" width="60%" />
      {Array.from({ length: lines }).map((_, i) => (
        <LoadingSkeleton key={i} height="sm" width={i === lines - 1 ? '80%' : '100%'} />
      ))}
    </div>
  );
}

/**
 * Skeleton for a table row
 */
export function SkeletonTableRow({ columns = 5 }) {
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <LoadingSkeleton height="sm" />
        </td>
      ))}
    </tr>
  );
}
