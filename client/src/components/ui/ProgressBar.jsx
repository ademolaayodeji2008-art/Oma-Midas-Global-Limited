/**
 * ProgressBar.jsx — Horizontal progress bar with mount animation.
 */

import React from 'react';
import { motion } from 'framer-motion';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * @param {object} props
 * @param {number} props.value - 0 to 100
 * @param {string} props.color - Tailwind bg class (default: 'bg-accent')
 * @param {string} props.label
 * @param {boolean} props.showLabel
 */
export default function ProgressBar({
  value = 0,
  color = 'bg-accent',
  label = '',
  showLabel = true,
}) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{label}</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div
        className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || `Progress: ${clamped}%`}
      >
        <motion.div
          className={['h-full rounded-full', color].join(' ')}
          initial={{ width: '0%' }}
          animate={{ width: `${clamped}%` }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.8, ease: 'easeOut' }
          }
        />
      </div>
    </div>
  );
}
