/**
 * Button.jsx — Reusable button with variants, sizes, loading state, and Framer Motion animations.
 */

import React from 'react';
import { motion } from 'framer-motion';

const variants = {
  primary: 'bg-primary text-white hover:bg-opacity-90 focus:ring-accent',
  secondary: 'bg-accent text-white hover:bg-opacity-90 focus:ring-accent',
  outline: 'border border-primary text-primary hover:bg-blush focus:ring-primary',
  ghost: 'text-primary hover:bg-blush focus:ring-primary',
  danger: 'bg-error text-white hover:bg-opacity-90 focus:ring-error',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-xl',
  md: 'px-5 py-2.5 text-base rounded-xl',
  lg: 'px-7 py-3.5 text-lg rounded-2xl',
};

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * @param {object} props
 * @param {'primary'|'secondary'|'outline'|'ghost'|'danger'} props.variant
 * @param {'sm'|'md'|'lg'} props.size
 * @param {boolean} props.loading
 * @param {boolean} props.disabled
 * @param {string} props.type
 * @param {string} props.className
 * @param {React.ReactNode} props.children
 * @param {function} props.onClick
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  children,
  onClick,
  ...rest
}) {
  const isDisabled = disabled || loading;

  const motionProps = prefersReducedMotion
    ? {}
    : {
        whileHover: isDisabled ? {} : { y: -2, boxShadow: '0 4px 24px rgba(74,29,79,0.18)' },
        whileTap: isDisabled ? {} : { scale: 0.97 },
      };

  return (
    <motion.button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      aria-disabled={isDisabled}
      aria-busy={loading}
      className={[
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
        className,
      ].join(' ')}
      {...motionProps}
      {...rest}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4 flex-shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children}
    </motion.button>
  );
}
