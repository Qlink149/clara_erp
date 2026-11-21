import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const allRecords = await base44.asServiceRole.entities.UserAccess.filter({ email: user.email });
    const records = allRecords || [];

    // Check for active client record
    const activeRecords = records.filter(r => r.is_active);
    const isActiveClient = activeRecords.some(r => r.user_type === 'client');

    // Check for pending client record
    const pendingRecord = records.find(r => !r.is_active && r.user_type === 'client');
    const isPendingClient = !isActiveClient && !!pendingRecord;

    if (!isActiveClient && !isPendingClient) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the linked client ID and access level
    const linkedClientId = isActiveClient
      ? activeRecords.find(r => r.linked_client_id)?.linked_client_id
      : pendingRecord.linked_client_id;
    const portalAccessLevel = isActiveClient
      ? (activeRecords.find(r => r.portal_access_level)?.portal_access_level || 'full')
      : 'summary'; // always masked for pending

    const isPending = !isActiveClient;

    // Authorized engagement IDs (null = all) — only for active clients
    let authorizedEngIds = null;
    if (isActiveClient) {
      const engagementRecords = activeRecords.filter(r => r.linked_client_id === linkedClientId);
      const allEngagements = engagementRecords.some(r => !r.engagement_id);
      if (!allEngagements) {
        authorizedEngIds = new Set(engagementRecords.filter(r => r.engagement_id).map(r => r.engagement_id));
      }
    }

    // Fetch client
    const client = linkedClientId ? await base44.asServiceRole.entities.Client.get(linkedClientId) : null;

    // Fetch engagements
    const allEngagementsList = linkedClientId
      ? await base44.asServiceRole.entities.Engagement.filter({ clientId: linkedClientId })
      : [];
    const filteredEngagements = isPending
      ? allEngagementsList // show structure but masked
      : (authorizedEngIds === null ? allEngagementsList : allEngagementsList.filter(e => authorizedEngIds.has(e.id)));

    // Fetch tasks
    const allTasks = linkedClientId
      ? await base44.asServiceRole.entities.Task.filter({ clientId: linkedClientId })
      : [];
    const filteredTasks = isPending
      ? allTasks
      : (authorizedEngIds === null ? allTasks : allTasks.filter(t => !t.engagementId || authorizedEngIds.has(t.engagementId)));

    // Fetch documents (client_visible only) — none for pending
    const visibleDocs = isPending ? [] : (
      linkedClientId
        ? (await base44.asServiceRole.entities.Document.filter({ clientId: linkedClientId })).filter(d => d.client_visible && !d.deleted)
        : []
    );

    // Fetch team
    const team = await base44.asServiceRole.entities.TeamMember.list();

    return Response.json({
      client,
      engagements: filteredEngagements,
      tasks: filteredTasks,
      documents: visibleDocs,
      team,
      portalAccessLevel,
      isPending,
      authorizedEngagementIds: authorizedEngIds === null ? null : Array.from(authorizedEngIds || []),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});