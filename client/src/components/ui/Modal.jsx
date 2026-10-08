/**
 * Modal.jsx — Accessible modal dialog with AnimatePresence fade+scale.
 * Traps focus, closes on Escape key and overlay click.
 */

import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {function} props.onClose
 * @param {string} props.title
 * @param {React.ReactNode} props.children
 * @param {'sm'|'md'|'lg'} props.size
 */
export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const panelRef = useRef(null);
  const titleId = React.useId();

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Trap focus within modal
  useEffect(() => {
    if (!isOpen) return;
    const panel = panelRef.current;
    if (!panel) return;

    const focusable = panel.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const trap = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };

    panel.addEventListener('keydown', trap);
    first?.focus();
    return () => panel.removeEventListener('keydown', trap);
  }, [isOpen]);

  const overlayVariants = prefersReducedMotion
    ? {}
    : { hidden: { opacity: 0 }, visible: { opacity: 1 } };

  const panelVariants = prefersReducedMotion
    ? {}
    : { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={overlayVariants}
          transition={{ duration: 0.2 }}
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={[
              'relative bg-white rounded-2xl shadow-hover w-full overflow-hidden',
              sizeClasses[size] || sizeClasses.md,
            ].join(' ')}
            variants={panelVariants}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 id={titleId} className="font-heading text-xl font-bold text-primary">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
