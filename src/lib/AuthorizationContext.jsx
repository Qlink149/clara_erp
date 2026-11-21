import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { SUPER_ADMIN_EMAILS, ADMIN_EMAILS } from './constants';

const AuthorizationContext = createContext(null);

function buildAccessPayload(allRecords) {
  const records = allRecords || [];
  const activeRecords = records.filter(r => r.is_active);
  const clientRecord = activeRecords.find(r => r.user_type === 'client');
  const isClient = !!clientRecord;
  const pendingClientRecord = records.find(r => !r.is_active && r.user_type === 'client');
  return {
    records: activeRecords,
    isClient,
    linkedClientId: clientRecord?.linked_client_id || null,
    portalAccessLevel: clientRecord?.portal_access_level || 'full',
    isPendingClient: !isClient && !!pendingClientRecord,
    pendingLinkedClientId: pendingClientRecord?.linked_client_id || null,
    isPendingEmployee: !isClient && !pendingClientRecord && records.some(r => !r.is_active && r.user_type === 'employee'),
    hasSubmittedRequest: records.length > 0,
  };
}

function buildAuthzFromAccessResult(user, res) {
  const records = res.data.records || [];
  const isClientUser = res.data.isClient || false;
  const linkedClientId = res.data.linkedClientId || null;
  const portalAccessLevel = res.data.portalAccessLevel || 'full';
  const isPendingClient = res.data.isPendingClient || false;
  const pendingLinkedClientId = res.data.pendingLinkedClientId || null;
  const isPendingEmployee = res.data.isPendingEmployee || false;
  const hasSubmittedRequest = res.data.hasSubmittedRequest || false;

  // Needs onboarding if no records at all
  if (!hasSubmittedRequest) {
    return { role: 'NEEDS_ONBOARDING', fullAccess: false, authorizedClients: [], email: user.email, user };
  }

  if (records.length === 0) {
    // Has submitted but not yet approved
    if (isPendingClient) {
      return { role: 'PENDING_CLIENT', fullAccess: false, authorizedClients: [], email: user.email, user, pendingLinkedClientId };
    }
    return { role: 'UNAUTHORIZED', fullAccess: false, authorizedClients: [], email: user.email, user };
  }

  if (isClientUser) {
    return { role: 'CLIENT', fullAccess: false, authorizedClients: [], email: user.email, user, linkedClientId, portalAccessLevel };
  }

  const clientMap = {};
  for (const r of records) {
    if (!clientMap[r.client_id]) {
      clientMap[r.client_id] = { clientId: r.client_id, engagementIds: [], allEngagements: false };
    }
    if (!r.engagement_id) {
      clientMap[r.client_id].allEngagements = true;
      clientMap[r.client_id].engagementIds = [];
    } else if (!clientMap[r.client_id].allEngagements) {
      clientMap[r.client_id].engagementIds.push(r.engagement_id);
    }
  }

  return { role: 'AUTHORIZED', fullAccess: false, authorizedClients: Object.values(clientMap), email: user.email, user };
}

export function AuthorizationProvider({ children }) {
  const [authz, setAuthz] = useState(null); // null = loading
  const userRef = useRef(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    async function init() {
      try {
        const isAuthed = await base44.auth.isAuthenticated();
        if (!isAuthed) {
          base44.auth.redirectToLogin(window.location.href);
          return;
        }

        const user = await base44.auth.me();
        userRef.current = user;

        // Record login (fire and forget)
        base44.functions.invoke('recordLogin', {}).catch(() => {});

        // Super admins and app admins see everything
        if (SUPER_ADMIN_EMAILS.includes(user.email) || user.role === 'admin') {
          setAuthz({ role: 'SUPER_ADMIN', fullAccess: true, email: user.email, user });
          return;
        }

        // Fetch initial access records directly from the entity
        const records = await base44.entities.UserAccess.filter({ email: user.email });
        setAuthz(buildAuthzFromAccessResult(user, { data: buildAccessPayload(records) }));

        // No real-time subscription — avoids rate limiting from bulk UserAccess writes
      } catch (err) {
        console.error('Authorization init failed', err);
        setAuthz({ role: 'UNAUTHORIZED', fullAccess: false, authorizedClients: [], email: null, user: null });
      }
    }
    init();

    return () => {};
  }, []);

  return (
    <AuthorizationContext.Provider value={authz}>
      {children}
    </AuthorizationContext.Provider>
  );
}

export function useAuthorization() {
  return useContext(AuthorizationContext);
}

// Helper: is this clientId authorized?
export function useIsClientAuthorized() {
  const authz = useAuthorization();
  return (clientId) => {
    if (!authz) return false;
    if (authz.fullAccess) return true;
    return authz.authorizedClients.some(c => c.clientId === clientId);
  };
}

// Filter an array of clients to only authorized ones
export function useFilteredClients(clients) {
  const authz = useAuthorization();
  if (!authz) return [];
  if (authz.fullAccess) return clients;
  const ids = new Set(authz.authorizedClients.map(c => c.clientId));
  return clients.filter(c => ids.has(c.id));
}

// Filter engagements for a given clientId
export function useFilteredEngagements(engagements, clientId) {
  const authz = useAuthorization();
  if (!authz) return [];
  if (authz.fullAccess) return engagements;
  const clientAuth = authz.authorizedClients.find(c => c.clientId === clientId);
  if (!clientAuth) return [];
  if (clientAuth.allEngagements) return engagements;
  return engagements.filter(e => clientAuth.engagementIds.includes(e.id));
}

// Filter tasks to only those in authorized scope
export function useFilteredTasks(tasks, clients, engagements) {
  const authz = useAuthorization();
  if (!authz) return [];

  // Super admin (Yogansh) and admin emails (Laksh) see ALL tasks
  if (authz.fullAccess) return tasks;
  const isAdmin = ADMIN_EMAILS.includes(authz.email?.toLowerCase());
  if (isAdmin) return tasks;

  // Everyone else sees ONLY tasks assigned to themselves
  // We need to find their team member id by matching email
  // Tasks store assigneeId (TeamMember.id), so we filter by matching email → id
  // We pass the team via clients/engagements args — but those aren't available here.
  // Instead, store the current user's email in authz and match against task's assigneeEmail if present.
  // Since tasks only have assigneeId, we rely on the Dashboard/Tasks pages to pass team context.
  // So here we return all visible-by-client tasks, and the per-user task filtering is done at the page level via myMember logic.
  // HOWEVER — the cleanest approach: filter by assigneeId matching the current user's team member record.
  // We don't have team here, so we return tasks scoped to client access AND flag the email for page-level use.

  // For employees: only show tasks assigned to them (assigneeId must match their TeamMember record)
  // Since we don't have team here, we expose the email and let callers filter.
  // But to enforce this centrally, we mark the authz with canSeeAllTasks=false
  // and return all tasks (page-level filtering handles the rest via myMember).

  // Actually: simplest correct solution — return all tasks here but the page-level
  // MyPendingTasks already filters by myMember. For the Tasks page we need to also filter.
  // Let's add canSeeAllTasks to authz and filter here using the team stored in clients arg (reuse it as team).

  // The cleanest fix: treat `clients` param as a signal — if it has email info we can match.
  // Since we can't get team here cleanly, return all authorized tasks and let each page do assignee filter.
  // We add a separate exported helper for this.

  const authorizedClientIds = new Set(authz.authorizedClients.map(c => c.clientId));
  return tasks.filter(task => {
    if (!task.clientId) return true;
    if (!authorizedClientIds.has(task.clientId)) return false;
    if (!task.engagementId) return true;
    const clientAuth = authz.authorizedClients.find(c => c.clientId === task.clientId);
    if (!clientAuth) return false;
    if (clientAuth.allEngagements) return true;
    return clientAuth.engagementIds.includes(task.engagementId);
  });
}

// Check if the current user can see ALL tasks (super admin or admin email)
export function useCanSeeAllTasks() {
  const authz = useAuthorization();
  if (!authz) return false;
  if (authz.fullAccess) return true;
  return ADMIN_EMAILS.includes(authz.email?.toLowerCase());
}

// Filter tasks to only those assigned to the current user (or all if admin/super admin)
// team: array of TeamMember objects (to resolve email → id)
export function useMyTasks(tasks, team) {
  const authz = useAuthorization();
  const canSeeAll = useCanSeeAllTasks();
  if (!authz) return [];
  if (canSeeAll) return tasks;

  // Find current user's TeamMember id by email
  const myMember = team.find(m => m.email && m.email.toLowerCase() === authz.email?.toLowerCase());
  if (!myMember) return tasks; // fallback: show all if member not found
  return tasks.filter(t => t.assigneeId === myMember.id);
}