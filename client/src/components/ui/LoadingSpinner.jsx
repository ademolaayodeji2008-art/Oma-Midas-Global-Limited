/**
 * LoadingSpinner.jsx — Reusable spinner component with size variants.
 */

import React from 'react';

/**
 * @param {object} props
 * @param {'sm'|'md'|'lg'} props.size - Spinner size (sm: w-4 h-4, md: w-10 h-10, lg: w-16 h-16)
 * @param {string} props.className - Additional CSS classes
 */
export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        className={`${sizeClasses[size]} border-4 border-primary border-t-transparent rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}
