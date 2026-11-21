import { useState, useRef, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

// Buffered auto-save: queue(entity, id, key, value) buffers changes;
// flush() writes them; auto-flush every 5s; offline changes buffer until reconnect.
export default function useAutoSave() {
  const [status, setStatus] = useState('saved'); // saved | saving | offline
  const [lastSaved, setLastSaved] = useState(null);
  const pending = useRef(new Map());

  const flush = useCallback(async () => {
    if (pending.current.size === 0) return;
    if (!navigator.onLine) { setStatus('offline'); return; }
    const entries = [...pending.current.entries()];
    pending.current.clear();
    setStatus('saving');
    try {
      await Promise.all(entries.map(([mapKey, patch]) => {
        const [entityName, id] = mapKey.split('|');
        return base44.entities[entityName].update(id, patch);
      }));
      setStatus('saved');
      setLastSaved(new Date());
    } catch {
      // Re-buffer failed patches (newer buffered values win)
      entries.forEach(([mapKey, patch]) => {
        pending.current.set(mapKey, { ...patch, ...(pending.current.get(mapKey) || {}) });
      });
      setStatus('offline');
    }
  }, []);

  useEffect(() => {
    const iv = setInterval(flush, 5000);
    const onOnline = () => flush();
    const onOffline = () => setStatus('offline');
    const onUnload = () => flush();
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('beforeunload', onUnload);
    return () => {
      clearInterval(iv);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('beforeunload', onUnload);
    };
  }, [flush]);

  const queue = useCallback((entityName, id, key, value) => {
    const mapKey = `${entityName}|${id}`;
    pending.current.set(mapKey, { ...(pending.current.get(mapKey) || {}), [key]: value });
    if (!navigator.onLine) setStatus('offline');
  }, []);

  const markSaved = useCallback(() => { setStatus('saved'); setLastSaved(new Date()); }, []);

  return { queue, flush, status, lastSaved, markSaved };
}