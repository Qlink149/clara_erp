import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SUPER_ADMIN_EMAIL = "yogansh@claraai.tech";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.email !== SUPER_ADMIN_EMAIL) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const registry = await base44.asServiceRole.entities.LoginRegistry.list('-last_login_at', 200);
    const allAccess = await base44.asServiceRole.entities.UserAccess.list('-created_date', 500);

    return Response.json({ registry: registry || [], allAccess: allAccess || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});