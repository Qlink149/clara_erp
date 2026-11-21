/**
 * Seeds initial data into the cloud database (runs once when cloud is empty).
 */
import { base44 } from '@/api/base44Client';
import { INITIAL_TEAM, INITIAL_TASKS, INITIAL_CURRENT_CLIENTS, INITIAL_UPCOMING_CLIENTS, INITIAL_PAST_CLIENTS } from './data';
import { INITIAL_ENGAGEMENTS } from './engagementData';

export async function seedCloudIfEmpty() {
  // Check if data already exists
  const existing = await base44.entities.TeamMember.list('name', 1);
  if (existing && existing.length > 0) {
    return; // Already seeded
  }

  console.log('[Clara] Seeding initial data into cloud...');

  // Seed team members (keep original IDs by storing them as a field)
  const teamMap = {};
  for (const m of INITIAL_TEAM) {
    const { id: localId, ...rest } = m;
    const created = await base44.entities.TeamMember.create({ ...rest, localId });
    teamMap[localId] = created.id;
  }

  // Seed clients
  const clientMap = {};
  const allClients = [
    ...INITIAL_CURRENT_CLIENTS.map(c => ({ ...c, client_type: 'current' })),
    ...INITIAL_UPCOMING_CLIENTS.map(c => ({ ...c, client_type: 'upcoming' })),
    ...INITIAL_PAST_CLIENTS.map(c => ({ ...c, client_type: 'past' })),
  ];
  for (const c of allClients) {
    const { id: localId, type: _type, ...rest } = c;
    const created = await base44.entities.Client.create({ ...rest, localId });
    clientMap[localId] = created.id;
  }

  // Seed engagements (remap clientId and assigneeId)
  const engMap = {};
  for (const e of INITIAL_ENGAGEMENTS) {
    const { id: localId, clientId, assigneeId, ...rest } = e;
    const created = await base44.entities.Engagement.create({
      ...rest,
      localId,
      clientId: clientMap[clientId] || clientId,
      assigneeId: teamMap[assigneeId] || assigneeId,
    });
    engMap[localId] = created.id;
  }

  // Seed tasks (remap clientId, assigneeId, engagementId)
  for (const t of INITIAL_TASKS) {
    const { id: _localId, clientId, assigneeId, engagementId, ...rest } = t;
    await base44.entities.Task.create({
      ...rest,
      clientId: clientMap[clientId] || clientId,
      assigneeId: teamMap[assigneeId] || assigneeId,
      engagementId: engagementId ? (engMap[engagementId] || engagementId) : undefined,
    });
  }

  console.log('[Clara] Cloud seeding complete!');
}