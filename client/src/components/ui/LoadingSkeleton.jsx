/**
 * LoadingSkeleton.jsx — Shimmer effect skeleton components.
 */

import React from 'react';

/**
 * Base skeleton component
 * @param {object} props
 * @param {string} props.width - Width (e.g., '100%', '200px')
 * @param {string} props.height - Height (e.g., '20px', '2rem')
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.rounded - Make it circular (for avatars)
 */
export function Skeleton({ width, height, className = '', rounded = false }) {
  return (
    <div
      className={`bg-gray-200 animate-pulse ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

/**
 * Skeleton card - matches the shape of dashboard stat cards
 */
export function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <Skeleton width="80px" height="12px" />
        <Skeleton width="20px" height="20px" rounded />
      </div>
      <Skeleton width="100px" height="32px" className="mb-2" />
      <Skeleton width="60px" height="20px" />
    </div>
  );
}

/**
 * Skeleton table - renders skeleton rows for table loading state
 * @param {number} props.rows - Number of skeleton rows (default: 5)
 * @param {number} props.columns - Number of columns (default: 5)
 */
export function SkeletonTable({ rows = 5, columns = 5 }) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-gray-100">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="bg-sectionBg border-b border-gray-100">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} scope="col" className="px-4 py-3">
                <Skeleton width="80px" height="14px" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {Array.from({ length: columns }).map((_, j) => (
                <td key={j} className="px-4 py-3">
                  <Skeleton width="90%" height="16px" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Skeleton;
