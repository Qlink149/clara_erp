import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Called by a newly-logged-in user to declare themselves as a client or employee.
 * For clients: creates a PENDING UserAccess record (is_active=false) so Yogansh can approve.
 * For employees: creates a minimal PENDING record so the user shows up in the registry.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { userType, linkedClientId } = await req.json();

    if (!userType || !['client', 'employee'].includes(userType)) {
      return Response.json({ error: 'Invalid userType' }, { status: 400 });
    }

    if (userType === 'client' && !linkedClientId) {
      return Response.json({ error: 'linkedClientId required for client' }, { status: 400 });
    }

    // Check if there's already an active or pending record for this user
    const existing = await base44.asServiceRole.entities.UserAccess.filter({ email: user.email });
    const hasAny = (existing || []).length > 0;
    if (hasAny) {
      // Already has records — don't overwrite
      return Response.json({ success: true, alreadyExists: true });
    }

    const now = new Date().toISOString();

    if (userType === 'client') {
      await base44.asServiceRole.entities.UserAccess.create({
        email: user.email,
        client_id: linkedClientId,
        engagement_id: null,
        granted_by: null,
        granted_at: now,
        is_active: false, // PENDING — not yet approved
        user_type: 'client',
        linked_client_id: linkedClientId,
        portal_access_level: 'summary', // masked until approved
      });
    } else {
      // Employee — store a pending employee record with a sentinel client_id
      await base44.asServiceRole.entities.UserAccess.create({
        email: user.email,
        client_id: 'PENDING',
        engagement_id: null,
        granted_by: null,
        granted_at: now,
        is_active: false,
        user_type: 'employee',
        linked_client_id: null,
        portal_access_level: null,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});