import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SUPER_ADMIN_EMAIL = "yogansh@claraai.tech";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.email !== SUPER_ADMIN_EMAIL) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { email, accessList, userType, linkedClientId, portalAccessLevel } = body;

    // Deactivate all existing records for this email
    const existing = await base44.asServiceRole.entities.UserAccess.filter({ email });
    for (const rec of (existing || [])) {
      await base44.asServiceRole.entities.UserAccess.update(rec.id, { is_active: false });
    }

    const now = new Date().toISOString();

    if (userType === 'client' && linkedClientId) {
      // Client portal access — one record with user_type=client + linked_client_id
      // Then engagement-specific records
      const engagements = accessList || [];
      if (engagements.length === 0) {
        // All engagements (null engagementId)
        await base44.asServiceRole.entities.UserAccess.create({
          email,
          client_id: linkedClientId,
          engagement_id: null,
          granted_by: SUPER_ADMIN_EMAIL,
          granted_at: now,
          is_active: true,
          user_type: 'client',
          linked_client_id: linkedClientId,
          portal_access_level: portalAccessLevel || 'full',
        });
      } else {
        for (const item of engagements) {
          await base44.asServiceRole.entities.UserAccess.create({
            email,
            client_id: linkedClientId,
            engagement_id: item.engagementId || null,
            granted_by: SUPER_ADMIN_EMAIL,
            granted_at: now,
            is_active: true,
            user_type: 'client',
            linked_client_id: linkedClientId,
            portal_access_level: portalAccessLevel || 'full',
          });
        }
      }
    } else {
      // Employee access — existing behavior
      for (const item of (accessList || [])) {
        await base44.asServiceRole.entities.UserAccess.create({
          email,
          client_id: item.clientId,
          engagement_id: item.engagementId || null,
          granted_by: SUPER_ADMIN_EMAIL,
          granted_at: now,
          is_active: true,
          user_type: 'employee',
          linked_client_id: null,
          portal_access_level: null,
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});