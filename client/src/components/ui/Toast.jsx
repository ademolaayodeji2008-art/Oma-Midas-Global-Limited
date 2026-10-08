/**
 * Toast.jsx — Toast notification system.
 * Provides ToastProvider context and useToast hook.
 * Stacked top-right, slide-in animation, 4s auto-dismiss.
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const ToastContext = createContext(null);

const typeStyles = {
  success: 'bg-success text-white',
  error: 'bg-error text-white',
  warning: 'bg-warning text-white',
  info: 'bg-primary text-white',
};

const TypeIcon = ({ type }) => {
  if (type === 'success') return <span aria-hidden="true">✓</span>;
  if (type === 'error') return <span aria-hidden="true">✕</span>;
  if (type === 'warning') return <span aria-hidden="true">⚠</span>;
  return <span aria-hidden="true">ℹ</span>;
};

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const toast = useCallback(({ message, type = 'info', duration = 4000 }) => {
    const id = ++counterRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}

      {/* Toast container */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              role="alert"
              initial={prefersReducedMotion ? {} : { opacity: 0, x: 80 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? {} : { opacity: 0, x: 80 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={[
                'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-hover min-w-[260px] max-w-sm',
                typeStyles[t.type] || typeStyles.info,
              ].join(' ')}
            >
              <TypeIcon type={t.type} />
              <span className="flex-1 text-sm font-medium">{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="opacity-70 hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

/** useToast hook — returns { toast, dismiss } */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
