import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const allRecords = await base44.asServiceRole.entities.UserAccess.filter({ email: user.email });
    const records = allRecords || [];

    // Active records only (for ERP access)
    const activeRecords = records.filter(r => r.is_active);

    // Determine if user is an approved client
    const isClient = activeRecords.some(r => r.user_type === 'client');
    const linkedClientId = isClient ? activeRecords.find(r => r.linked_client_id)?.linked_client_id : null;
    const portalAccessLevel = isClient ? (activeRecords.find(r => r.portal_access_level)?.portal_access_level || 'full') : null;

    // Check if there's a PENDING client request (is_active=false, user_type=client)
    const pendingClientRecord = records.find(r => !r.is_active && r.user_type === 'client');
    const isPendingClient = !isClient && !!pendingClientRecord;
    const pendingLinkedClientId = isPendingClient ? pendingClientRecord.linked_client_id : null;

    // Check if there's a PENDING employee request
    const pendingEmployeeRecord = records.find(r => !r.is_active && r.user_type === 'employee');
    const isPendingEmployee = !isClient && !isPendingClient && !!pendingEmployeeRecord;

    // Has the user submitted any onboarding request yet?
    const hasSubmittedRequest = records.length > 0;

    return Response.json({
      records: activeRecords,
      isClient,
      linkedClientId,
      portalAccessLevel,
      isPendingClient,
      pendingLinkedClientId,
      isPendingEmployee,
      hasSubmittedRequest,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});