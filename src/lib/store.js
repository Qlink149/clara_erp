import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  INITIAL_TEAM,
  INITIAL_TASKS,
  INITIAL_CURRENT_CLIENTS,
  INITIAL_UPCOMING_CLIENTS,
  INITIAL_PAST_CLIENTS,
  INITIAL_ACTIVITY_LOG,
} from './data';
import { INITIAL_ENGAGEMENTS } from './engagementData';

const useStore = create(
  persist(
    (set, get) => ({
      // Theme
      theme: 'dark',
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

      // Team
      team: INITIAL_TEAM,
      updateTeamMember: (id, updates) =>
        set((s) => ({ team: s.team.map((m) => (m.id === id ? { ...m, ...updates } : m)) })),
      addTeamMember: (member) => set((s) => ({ team: [...s.team, member] })),

      // Tasks
      tasks: INITIAL_TASKS,
      addTask: (task) => {
        const newTask = { ...task, id: `t${Date.now()}`, createdAt: new Date().toISOString() };
        set((s) => ({
          tasks: [...s.tasks, newTask],
          activityLog: [
            {
              id: `al${Date.now()}`,
              date: new Date().toISOString(),
              action: `New task "${newTask.name}" created`,
              actor: newTask.assigneeId || 'system',
              entityType: 'task',
              entityId: newTask.id,
            },
            ...s.activityLog,
          ],
        }));
        return newTask;
      },
      updateTask: (id, updates) => {
        const state = get();
        const oldTask = state.tasks.find((t) => t.id === id);
        const newTask = { ...oldTask, ...updates };
        let logEntry = null;
        if (oldTask && updates.status && updates.status !== oldTask.status) {
          logEntry = {
            id: `al${Date.now()}`,
            date: new Date().toISOString(),
            action: `Task "${newTask.name}" status changed from ${oldTask.status} to ${updates.status}`,
            actor: 'system',
            entityType: 'task',
            entityId: id,
          };
          if (updates.status === 'Completed' && !newTask.dateCompleted) {
            newTask.dateCompleted = new Date().toISOString().split('T')[0];
          }
        }
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? newTask : t)),
          activityLog: logEntry ? [logEntry, ...s.activityLog] : s.activityLog,
        }));
      },
      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      // Current Clients
      currentClients: INITIAL_CURRENT_CLIENTS,
      addCurrentClient: (client) =>
        set((s) => ({ currentClients: [...s.currentClients, { ...client, id: `cc${Date.now()}`, type: 'current' }] })),
      updateCurrentClient: (id, updates) =>
        set((s) => ({
          currentClients: s.currentClients.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),
      deleteCurrentClient: (id) =>
        set((s) => ({ currentClients: s.currentClients.filter((c) => c.id !== id) })),
      addPendingItem: (clientId, item) =>
        set((s) => ({
          currentClients: s.currentClients.map((c) =>
            c.id === clientId
              ? { ...c, pendingItems: [...(c.pendingItems || []), { ...item, id: `pi${Date.now()}` }] }
              : c
          ),
        })),
      updatePendingItem: (clientId, itemId, updates) =>
        set((s) => ({
          currentClients: s.currentClients.map((c) =>
            c.id === clientId
              ? { ...c, pendingItems: c.pendingItems.map((p) => (p.id === itemId ? { ...p, ...updates } : p)) }
              : c
          ),
        })),
      deletePendingItem: (clientId, itemId) =>
        set((s) => ({
          currentClients: s.currentClients.map((c) =>
            c.id === clientId ? { ...c, pendingItems: c.pendingItems.filter((p) => p.id !== itemId) } : c
          ),
        })),
      addActivityLogEntry: (clientId, entry) =>
        set((s) => ({
          currentClients: s.currentClients.map((c) =>
            c.id === clientId
              ? { ...c, activityLog: [{ ...entry, id: `al${Date.now()}`, date: new Date().toISOString() }, ...(c.activityLog || [])] }
              : c
          ),
        })),

      // Upcoming Clients
      upcomingClients: INITIAL_UPCOMING_CLIENTS,
      addUpcomingClient: (client) =>
        set((s) => ({ upcomingClients: [...s.upcomingClients, { ...client, id: `uc${Date.now()}`, type: 'upcoming' }] })),
      updateUpcomingClient: (id, updates) =>
        set((s) => ({
          upcomingClients: s.upcomingClients.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),
      deleteUpcomingClient: (id) =>
        set((s) => ({ upcomingClients: s.upcomingClients.filter((c) => c.id !== id) })),
      convertToCurrentClient: (id) => {
        const state = get();
        const client = state.upcomingClients.find((c) => c.id === id);
        if (!client) return;
        const newCurrent = { ...client, type: 'current', status: 'On Track', pendingItems: [], activityLog: [], communication: { lastCallDate: null, lastSummary: '', nextFollowUp: null, platform: 'WhatsApp' }, billingStatus: 'Pending', projectStartDate: new Date().toISOString().split('T')[0] };
        set((s) => ({
          upcomingClients: s.upcomingClients.filter((c) => c.id !== id),
          currentClients: [...s.currentClients, newCurrent],
        }));
      },

      // Past Clients
      pastClients: INITIAL_PAST_CLIENTS,
      addPastClient: (client) =>
        set((s) => ({ pastClients: [...s.pastClients, { ...client, id: `pc${Date.now()}`, type: 'past' }] })),
      updatePastClient: (id, updates) =>
        set((s) => ({ pastClients: s.pastClients.map((c) => (c.id === id ? { ...c, ...updates } : c)) })),
      reactivateClient: (id) => {
        const state = get();
        const client = state.pastClients.find((c) => c.id === id);
        if (!client) return;
        const newCurrent = { ...client, type: 'current', status: 'On Track', pendingItems: [], activityLog: [], communication: { lastCallDate: null, lastSummary: '', nextFollowUp: null, platform: 'WhatsApp' }, billingStatus: 'Pending', projectStartDate: new Date().toISOString().split('T')[0] };
        set((s) => ({
          pastClients: s.pastClients.filter((c) => c.id !== id),
          currentClients: [...s.currentClients, newCurrent],
        }));
      },

      // Engagements
      engagements: INITIAL_ENGAGEMENTS,
      addEngagement: (engagement) =>
        set((s) => ({ engagements: [...s.engagements, { ...engagement, id: `eng${Date.now()}`, createdAt: new Date().toISOString(), archived: false }] })),
      updateEngagement: (id, updates) =>
        set((s) => ({ engagements: s.engagements.map((e) => (e.id === id ? { ...e, ...updates } : e)) })),
      deleteEngagement: (id) =>
        set((s) => ({ engagements: s.engagements.filter((e) => e.id !== id) })),

      // Documents
      documents: [],
      addDocument: (doc) =>
        set((s) => ({ documents: [...s.documents, { ...doc, id: `doc${Date.now()}`, deleted: false }] })),
      deleteDocument: (id) =>
        set((s) => ({ documents: s.documents.map((d) => (d.id === id ? { ...d, deleted: true } : d)) })),
      restoreDocument: (id) =>
        set((s) => ({ documents: s.documents.map((d) => (d.id === id ? { ...d, deleted: false } : d)) })),

      // Global Activity Log
      activityLog: INITIAL_ACTIVITY_LOG,
      addGlobalLog: (entry) =>
        set((s) => ({
          activityLog: [{ ...entry, id: `gal${Date.now()}`, date: new Date().toISOString() }, ...s.activityLog].slice(0, 100),
        })),

      // Resolved Alerts
      resolvedAlerts: [],
      snoozedAlerts: {},
      resolveAlert: (alertId) =>
        set((s) => ({ resolvedAlerts: [...s.resolvedAlerts, alertId] })),
      snoozeAlert: (alertId, days) =>
        set((s) => ({
          snoozedAlerts: {
            ...s.snoozedAlerts,
            [alertId]: new Date(Date.now() + days * 86400000).toISOString(),
          },
        })),
    }),
    { name: 'clara-erp-store', version: 3 }
  )
);

export default useStore;