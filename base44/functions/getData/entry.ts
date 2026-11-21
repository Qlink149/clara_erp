import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [clients, tasks, team, engagements, documents, settings] = await Promise.all([
      base44.asServiceRole.entities.Client.list('-created_date', 200),
      base44.asServiceRole.entities.Task.list('-created_date', 500),
      base44.asServiceRole.entities.TeamMember.list('name', 50),
      base44.asServiceRole.entities.Engagement.list('-created_date', 200),
      base44.asServiceRole.entities.Document.list('-created_date', 500),
      base44.asServiceRole.entities.AppSettings.filter({ key: 'global' }),
    ]);

    return Response.json({ clients, tasks, team, engagements, documents, settings });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});