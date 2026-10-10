/**
 * Pagination.jsx — Prev/next + page numbers with ellipsis.
 */

import React from 'react';

/**
 * @param {object} props
 * @param {number} props.page - Current page (1-indexed)
 * @param {number} props.totalPages
 * @param {function} props.onPageChange
 */
export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  /** Build page number list with ellipsis */
  const buildPages = () => {
    const pages = [];
    const delta = 2;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= page - delta && i <= page + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    return pages;
  };

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1 mt-4">
      {/* Prev */}
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="px-3 py-1.5 rounded-xl text-sm font-medium border border-gray-200 text-primary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-sectionBg transition-colors"
      >
        ← Prev
      </button>

      {buildPages().map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-gray-400">…</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
            className={[
              'px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors',
              p === page
                ? 'bg-primary text-white border-primary'
                : 'border-gray-200 text-primary hover:bg-sectionBg',
            ].join(' ')}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="px-3 py-1.5 rounded-xl text-sm font-medium border border-gray-200 text-primary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-sectionBg transition-colors"
      >
        Next →
      </button>
    </nav>
  );
}
