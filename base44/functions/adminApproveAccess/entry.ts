import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SUPER_ADMIN_EMAIL = "yogansh@claraai.tech";

/**
 * Approves a pending UserAccess record by setting is_active=true.
 * Only the super admin can call this.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.email !== SUPER_ADMIN_EMAIL) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email } = await req.json();
    if (!email) return Response.json({ error: 'email required' }, { status: 400 });

    // Activate all pending records for this email
    const records = await base44.asServiceRole.entities.UserAccess.filter({ email });
    const pending = (records || []).filter(r => !r.is_active);
    const now = new Date().toISOString();

    for (const rec of pending) {
      await base44.asServiceRole.entities.UserAccess.update(rec.id, {
        is_active: true,
        granted_by: SUPER_ADMIN_EMAIL,
        granted_at: now,
      });
    }

    return Response.json({ success: true, approved: pending.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});