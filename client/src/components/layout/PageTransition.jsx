/**
 * PageTransition.jsx — Wraps page content in a Framer Motion fade+slide transition.
 */

import React from 'react';
import { motion } from 'framer-motion';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function PageTransition({ children }) {
  if (prefersReducedMotion) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
