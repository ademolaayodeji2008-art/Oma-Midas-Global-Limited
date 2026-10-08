/**
 * useCycle.js — Fetches the current active cycle from /api/cycle.
 */

import { useState, useEffect } from 'react';
import api from '../lib/api';

export function useCycle() {
  const [cycle, setCycle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/cycle')
      .then((res) => setCycle(res.data.cycle || res.data))
      .catch(() => setCycle(null))
      .finally(() => setLoading(false));
  }, []);

  return { cycle, loading };
}
