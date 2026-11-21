/**
 * useCloudStore — replaces the local Zustand store with cloud-backed Base44 entities.
 * Data is fetched from the cloud and mutations are written back immediately.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { seedCloudIfEmpty } from './seedData';

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Helper: write straight to the entity (no backend function needed)
async function mutate(entity, action, { id, data } = {}) {
  const api = base44.entities[entity];
  if (action === 'create') return api.create(data);
  if (action === 'update') return api.update(id, data);
  if (action === 'delete') return api.delete(id);
}

export function useCloudStore() {
  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState([]);
  const [engagements, setEngagements] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [resolvedAlerts, setResolvedAlerts] = useState([]);
  const [snoozedAlerts, setSnoozedAlerts] = useState({});
  const [theme, setThemeState] = useState('dark');
  const [loading, setLoading] = useState(true);
  const settingsIdRef = useRef(null);

  // ── LOAD ALL DATA (via service-role backend function) ─────────────
  const reload = useCallback(async () => {
    try {
      const isAuthed = await base44.auth.isAuthenticated();
      if (!isAuthed) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }

      const [c, t, tm, e, d, settings] = await Promise.all([
        base44.entities.Client.list('-created_date', 200),
        base44.entities.Task.list('-created_date', 500),
        base44.entities.TeamMember.list('name', 50),
        base44.entities.Engagement.list('-created_date', 200),
        base44.entities.Document.list('-created_date', 500),
        base44.entities.AppSettings.filter({ key: 'global' }),
      ]);

      setClients(c || []);
      setTasks(t || []);
      setTeam(tm || []);
      setEngagements(e || []);
      setDocuments(d || []);

      if (settings && settings.length > 0) {
        const s = settings[0];
        settingsIdRef.current = s.id;
        try {
          const parsed = JSON.parse(s.value || '{}');
          if (parsed.resolvedAlerts) setResolvedAlerts(parsed.resolvedAlerts);
          if (parsed.snoozedAlerts) setSnoozedAlerts(parsed.snoozedAlerts);
          if (parsed.theme) setThemeState(parsed.theme);
        } catch {}
      }

      // If no data in cloud yet, seed it then reload
      if (!tm || tm.length === 0) {
        await seedCloudIfEmpty();
        const [c2, t2, tm2, e2, d2] = await Promise.all([
          base44.entities.Client.list('-created_date', 200),
          base44.entities.Task.list('-created_date', 500),
          base44.entities.TeamMember.list('name', 50),
          base44.entities.Engagement.list('-created_date', 200),
          base44.entities.Document.list('-created_date', 500),
        ]);
        setClients(c2 || []);
        setTasks(t2 || []);
        setTeam(tm2 || []);
        setEngagements(e2 || []);
        setDocuments(d2 || []);
      }
    } catch (err) {
      console.error('Failed to load cloud data', err);
      // If rate limited, retry after 5s
      if (err?.response?.status === 429 || err?.message?.includes('429') || err?.message?.includes('Rate limit')) {
        setTimeout(() => reload(), 5000);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // ── SETTINGS PERSISTENCE ──────────────────────────────────────────
  const saveSettings = useCallback(async (patch) => {
    const current = { resolvedAlerts, snoozedAlerts, theme, ...patch };
    const val = JSON.stringify(current);
    if (settingsIdRef.current) {
      await mutate('AppSettings', 'update', { id: settingsIdRef.current, data: { key: 'global', value: val } });
    } else {
      const created = await mutate('AppSettings', 'create', { data: { key: 'global', value: val } });
      settingsIdRef.current = created.id;
    }
  }, [resolvedAlerts, snoozedAlerts, theme]);

  // ── THEME ─────────────────────────────────────────────────────────
  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setThemeState(next);
    saveSettings({ theme: next });
  }, [theme, saveSettings]);

  // ── TEAM ──────────────────────────────────────────────────────────
  const updateTeamMember = useCallback(async (id, updates) => {
    setTeam(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    await mutate('TeamMember', 'update', { id, data: updates });
  }, []);

  const addTeamMember = useCallback(async (member) => {
    const created = await mutate('TeamMember', 'create', { data: member });
    setTeam(prev => [...prev, created]);
    return created;
  }, []);

  // ── TASKS ─────────────────────────────────────────────────────────
  const addTask = useCallback(async (task) => {
    const created = await mutate('Task', 'create', { data: { ...task, createdAt: new Date().toISOString() } });
    setTasks(prev => [created, ...prev]);
    return created;
  }, []);

  const updateTask = useCallback(async (id, updates) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newTask = { ...task, ...updates };
    if (updates.status === 'Completed' && !newTask.dateCompleted) {
      newTask.dateCompleted = new Date().toISOString().split('T')[0];
    }
    setTasks(prev => prev.map(t => t.id === id ? newTask : t));
    await mutate('Task', 'update', { id, data: newTask });
  }, [tasks]);

  const deleteTask = useCallback(async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await mutate('Task', 'delete', { id });
  }, []);

  // ── CLIENTS ───────────────────────────────────────────────────────
  const addClient = useCallback(async (client) => {
    const created = await mutate('Client', 'create', { data: client });
    setClients(prev => [created, ...prev]);
    return created;
  }, []);

  const updateClient = useCallback(async (id, updates) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    await mutate('Client', 'update', { id, data: updates });
  }, []);

  const deleteClient = useCallback(async (id) => {
    setClients(prev => prev.filter(c => c.id !== id));
    await mutate('Client', 'delete', { id });
  }, []);

  // ── PENDING ITEMS (stored inside client) ──────────────────────────
  const addPendingItem = useCallback(async (clientId, item) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    const newItem = { ...item, id: `pi${generateId()}` };
    const updated = { ...client, pendingItems: [...(client.pendingItems || []), newItem] };
    setClients(prev => prev.map(c => c.id === clientId ? updated : c));
    await base44.entities.Client.update(clientId, { pendingItems: updated.pendingItems });
  }, [clients]);

  const updatePendingItem = useCallback(async (clientId, itemId, updates) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    const newItems = (client.pendingItems || []).map(p => p.id === itemId ? { ...p, ...updates } : p);
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, pendingItems: newItems } : c));
    await base44.entities.Client.update(clientId, { pendingItems: newItems });
  }, [clients]);

  const deletePendingItem = useCallback(async (clientId, itemId) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    const newItems = (client.pendingItems || []).filter(p => p.id !== itemId);
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, pendingItems: newItems } : c));
    await base44.entities.Client.update(clientId, { pendingItems: newItems });
  }, [clients]);

  const addActivityLogEntry = useCallback(async (clientId, entry) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    const newEntry = { ...entry, id: `al${generateId()}`, date: new Date().toISOString() };
    const newLog = [newEntry, ...(client.activityLog || [])];
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, activityLog: newLog } : c));
    await base44.entities.Client.update(clientId, { activityLog: newLog });
  }, [clients]);

  // ── DERIVED CLIENT LISTS ──────────────────────────────────────────
  const currentClients = clients.filter(c => c.client_type === 'current');
  const upcomingClients = clients.filter(c => c.client_type === 'upcoming');
  const pastClients = clients.filter(c => c.client_type === 'past');

  const addCurrentClient = useCallback((client) =>
    addClient({ ...client, client_type: 'current' }), [addClient]);

  const updateCurrentClient = updateClient;

  const addUpcomingClient = useCallback((client) =>
    addClient({ ...client, client_type: 'upcoming' }), [addClient]);

  const updateUpcomingClient = updateClient;

  const addPastClient = useCallback((client) =>
    addClient({ ...client, client_type: 'past' }), [addClient]);

  const updatePastClient = updateClient;

  const convertToCurrentClient = useCallback(async (id) => {
    const client = clients.find(c => c.id === id);
    if (!client) return;
    const updates = {
      client_type: 'current',
      status: 'On Track',
      pendingItems: [],
      activityLog: [],
      communication: { lastCallDate: null, lastSummary: '', nextFollowUp: null, platform: 'WhatsApp' },
      billingStatus: 'Pending',
      projectStartDate: new Date().toISOString().split('T')[0],
    };
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    await base44.entities.Client.update(id, updates);
  }, [clients]);

  const moveToPast = useCallback(async (id) => {
    const client = clients.find(c => c.id === id);
    if (!client) return;
    const updates = { client_type: 'past' };
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    await base44.entities.Client.update(id, updates);
  }, [clients]);

  const reactivateClient = useCallback(async (id) => {
    const client = clients.find(c => c.id === id);
    if (!client) return;
    const updates = {
      client_type: 'current',
      status: 'On Track',
      pendingItems: [],
      activityLog: [],
      communication: { lastCallDate: null, lastSummary: '', nextFollowUp: null, platform: 'WhatsApp' },
      billingStatus: 'Pending',
      projectStartDate: new Date().toISOString().split('T')[0],
    };
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    await base44.entities.Client.update(id, updates);
  }, [clients]);

  // ── ENGAGEMENTS ───────────────────────────────────────────────────
  const addEngagement = useCallback(async (engagement) => {
    const created = await mutate('Engagement', 'create', { data: { ...engagement, archived: false, createdAt: new Date().toISOString() } });
    setEngagements(prev => [created, ...prev]);
    return created;
  }, []);

  const updateEngagement = useCallback(async (id, updates) => {
    setEngagements(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    await mutate('Engagement', 'update', { id, data: updates });
  }, []);

  const deleteEngagement = useCallback(async (id) => {
    setEngagements(prev => prev.filter(e => e.id !== id));
    await mutate('Engagement', 'delete', { id });
  }, []);

  // ── DOCUMENTS ─────────────────────────────────────────────────────
  const addDocument = useCallback(async (doc) => {
    const created = await mutate('Document', 'create', { data: { ...doc, deleted: false } });
    setDocuments(prev => [created, ...prev]);
    return created;
  }, []);

  const deleteDocument = useCallback(async (id) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, deleted: true } : d));
    await mutate('Document', 'update', { id, data: { deleted: true } });
  }, []);

  const restoreDocument = useCallback(async (id) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, deleted: false } : d));
    await mutate('Document', 'update', { id, data: { deleted: false } });
  }, []);

  const updateDocumentVisibility = useCallback(async (id, client_visible) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, client_visible } : d));
    await mutate('Document', 'update', { id, data: { client_visible } });
  }, []);

  // ── GLOBAL ACTIVITY LOG (derived from recent client logs) ─────────
  const activityLog = clients
    .flatMap(c => (c.activityLog || []).map(e => ({ ...e, clientId: c.id })))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 50);

  // ── ALERTS ────────────────────────────────────────────────────────
  const resolveAlert = useCallback((alertId) => {
    const next = [...resolvedAlerts, alertId];
    setResolvedAlerts(next);
    saveSettings({ resolvedAlerts: next });
  }, [resolvedAlerts, saveSettings]);

  const snoozeAlert = useCallback((alertId, days) => {
    const next = { ...snoozedAlerts, [alertId]: new Date(Date.now() + days * 86400000).toISOString() };
    setSnoozedAlerts(next);
    saveSettings({ snoozedAlerts: next });
  }, [snoozedAlerts, saveSettings]);

  return {
    loading,
    reload,
    // Theme
    theme,
    toggleTheme,
    // Team
    team,
    updateTeamMember,
    addTeamMember,
    // Tasks
    tasks,
    addTask,
    updateTask,
    deleteTask,
    // Clients (all)
    clients,
    currentClients,
    upcomingClients,
    pastClients,
    addCurrentClient,
    updateCurrentClient,
    addUpcomingClient,
    updateUpcomingClient,
    addPastClient,
    updatePastClient,
    deleteClient,
    convertToCurrentClient,
    moveToPast,
    reactivateClient,
    addPendingItem,
    updatePendingItem,
    deletePendingItem,
    addActivityLogEntry,
    // Engagements
    engagements,
    addEngagement,
    updateEngagement,
    deleteEngagement,
    // Documents
    documents,
    addDocument,
    deleteDocument,
    restoreDocument,
    updateDocumentVisibility,
    // Activity Log
    activityLog,
    // Alerts
    resolvedAlerts,
    snoozedAlerts,
    resolveAlert,
    snoozeAlert,
  };
}