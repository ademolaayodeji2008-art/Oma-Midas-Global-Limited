/**
 * TopProgressBar.jsx — Global loading indicator using nprogress.
 * This is distinct from ProgressBar.jsx which is used for value display.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// Configure nprogress
NProgress.configure({ 
  showSpinner: false,
  trickleSpeed: 200,
  minimum: 0.08,
});

/**
 * TopProgressBar hook - automatically shows progress bar during route transitions
 */
export default function TopProgressBar() {
  const location = useLocation();

  useEffect(() => {
    NProgress.start();
    
    // Complete after a short delay to ensure the page has mounted
    const timer = setTimeout(() => {
      NProgress.done();
    }, 100);

    return () => {
      clearTimeout(timer);
      NProgress.done();
    };
  }, [location.pathname]);

  return null;
}
