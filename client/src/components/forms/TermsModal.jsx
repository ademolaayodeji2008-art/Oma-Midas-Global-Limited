/**
 * TermsModal.jsx — Terms & Conditions modal.
 * Checkbox enables only after user scrolls to bottom.
 * Fetches T&C from /api/admin/settings/terms_and_conditions.
 */

import React, { useState, useRef, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import api from '../../lib/api';

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {function} props.onClose
 * @param {function} props.onAgree - Called when user confirms agreement
 */
export default function TermsModal({ isOpen, onClose, onAgree }) {
  const [termsHtml, setTermsHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [checked, setChecked] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setScrolledToBottom(false);
    setChecked(false);
    setLoading(true);
    api.get('/api/admin/settings/terms_and_conditions')
      .then((res) => setTermsHtml(res.data.value || res.data.setting?.value || 'Terms and conditions not found.'))
      .catch(() => setTermsHtml('Terms and conditions not available at this time.'))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
      setScrolledToBottom(true);
    }
  };

  const handleConfirm = () => {
    if (checked) {
      onAgree();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Terms & Conditions" size="lg">
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
        </div>
      ) : (
        <>
          {/* Scrollable content */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="h-72 overflow-y-auto border border-gray-200 rounded-xl p-4 text-sm text-charcoal leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: termsHtml }}
          />

          {!scrolledToBottom && (
            <p className="text-xs text-gray-400 mt-2 text-center">
              Scroll to the bottom to enable the checkbox.
            </p>
          )}

          {/* Checkbox */}
          <label className={['flex items-start gap-3 mt-4 cursor-pointer', !scrolledToBottom ? 'opacity-40' : ''].join(' ')}>
            <input
              type="checkbox"
              disabled={!scrolledToBottom}
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 accent-primary w-4 h-4"
            />
            <span className="text-sm">I have read and agree to the Terms & Conditions</span>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-5">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button variant="primary" size="sm" disabled={!checked} onClick={handleConfirm}>
              Confirm Agreement
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
