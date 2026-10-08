/**
 * Card.jsx — Standard card container with optional hover animation.
 */

import React from 'react';
import { motion } from 'framer-motion';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string} props.className
 * @param {boolean} props.hover - Enable hover lift animation
 * @param {function} props.onClick
 */
export default function Card({ children, className = '', hover = false, onClick }) {
  const motionProps =
    hover && !prefersReducedMotion
      ? {
          whileHover: { y: -4, boxShadow: '0 8px 32px rgba(74,29,79,0.14)' },
          transition: { duration: 0.2 },
        }
      : {};

  return (
    <motion.div
      className={['card-base', hover && onClick ? 'cursor-pointer' : '', className].join(' ')}
      onClick={onClick}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
