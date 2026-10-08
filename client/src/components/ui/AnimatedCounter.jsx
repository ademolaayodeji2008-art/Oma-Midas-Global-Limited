/**
 * AnimatedCounter.jsx — Spring-animated number counter from 0 to target value.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * @param {object} props
 * @param {number} props.value - Target value
 * @param {string} props.prefix - e.g. '₦'
 * @param {string} props.suffix - e.g. '%'
 * @param {function} props.formatter - Custom number formatter
 * @param {number} props.duration - Animation duration in ms (default 1200)
 */
export default function AnimatedCounter({
  value = 0,
  prefix = '',
  suffix = '',
  formatter,
  duration = 1200,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-20px' });
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!isInView) return;

    if (prefersReducedMotion) {
      setDisplay(value);
      return;
    }

    const start = performance.now();
    const startValue = 0;

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (value - startValue) * eased);
      setDisplay(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isInView, value, duration]);

  const formatted = formatter
    ? formatter(display)
    : display.toLocaleString('en-NG');

  return (
    <span ref={ref} aria-label={`${prefix}${value.toLocaleString('en-NG')}${suffix}`}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
