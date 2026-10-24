/**
 * Newsletter.jsx — Admin newsletter/broadcast feature.
 * Admin can send notifications to all active members.
 */

import React, { useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PageTransition from '../../components/layout/PageTransition';
import { useToast } from '../../components/ui/Toast';
import api from '../../lib/api';

export default function Newsletter() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sendEmail, setSendEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (!title.trim()) {
      toast({ message: 'Title is required', type: 'error' });
      return;
    }
    if (title.length > 100) {
      toast({ message: 'Title must be 100 characters or less', type: 'error' });
      return;
    }
    if (!message.trim()) {
      toast({ message: 'Message is required', type: 'error' });
      return;
    }
    if (message.length > 500) {
      toast({ message: 'Message must be 500 characters or less', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/admin/newsletter', {
        title: title.trim(),
        message: message.trim(),
        sendEmail,
      });

      toast({
        message: res.data.message || `Newsletter sent to ${res.data.count} members`,
        type: 'success',
      });

      // Clear form
      setTitle('');
      setMessage('');
      setSendEmail(false);
    } catch (err) {
      toast({
        message: err.response?.data?.error || 'Failed to send newsletter',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <AppLayout title="Newsletter">
        <Card>
          <h2 className="text-2xl font-heading font-bold text-primary mb-2">Send Newsletter</h2>
          <p className="text-textSecondary text-sm mb-6">
            Send a broadcast notification to all active members. Optionally send via email as well.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-textPrimary mb-1.5">
                Title <span className="text-error">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                placeholder="e.g., Important Update"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              />
              <p className="text-xs text-textSecondary mt-1">{title.length}/100 characters</p>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-textPrimary mb-1.5">
                Message <span className="text-error">*</span>
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Enter your newsletter message here..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow resize-none"
              />
              <p className="text-xs text-textSecondary mt-1">{message.length}/500 characters</p>
            </div>

            {/* Send Email Checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sendEmail"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary/50"
              />
              <label htmlFor="sendEmail" className="text-sm text-textPrimary">
                Also send via email
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button type="submit" variant="primary" loading={loading} disabled={loading}>
                Send Newsletter
              </Button>
            </div>
          </form>
        </Card>
      </AppLayout>
    </PageTransition>
  );
}
