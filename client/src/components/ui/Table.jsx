/**
 * Table.jsx — Responsive data table with loading skeleton, zebra striping, and row hover.
 */

import React from 'react';

/**
 * @param {object} props
 * @param {Array<{key:string, label:string, render?:function}>} props.columns
 * @param {Array<object>} props.data
 * @param {boolean} props.loading
 * @param {string} props.emptyMessage
 */
export default function Table({ columns = [], data = [], loading = false, emptyMessage = 'No data found.' }) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-gray-100">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="bg-sectionBg border-b border-gray-100">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className="px-4 py-3 font-semibold text-primary whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            // Skeleton rows
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-gray-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={row.id || i}
                className={[
                  i % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                  'hover:bg-sectionBg transition-colors',
                ].join(' ')}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                    {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
