import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const now = new Date().toISOString();
    const existing = await base44.asServiceRole.entities.LoginRegistry.filter({ email: user.email });

    if (existing && existing.length > 0) {
      await base44.asServiceRole.entities.LoginRegistry.update(existing[0].id, {
        last_login_at: now,
        display_name: user.full_name || user.email,
      });
    } else {
      await base44.asServiceRole.entities.LoginRegistry.create({
        email: user.email,
        display_name: user.full_name || user.email,
        first_login_at: now,
        last_login_at: now,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});