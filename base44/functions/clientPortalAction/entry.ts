import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // Verify this user is a client type
    const accessRecords = await base44.asServiceRole.entities.UserAccess.filter({ email: user.email, is_active: true });
    const isClient = accessRecords.some(r => r.user_type === 'client');
    if (!isClient) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const clientRecord = accessRecords.find(r => r.linked_client_id);
    const linkedClientId = clientRecord?.linked_client_id;
    const clientName = user.full_name || user.email;

    if (action === 'markPendingItemSent') {
      const { clientId, itemId, itemDescription } = body;
      if (clientId !== linkedClientId) return Response.json({ error: 'Forbidden' }, { status: 403 });

      // Fetch the client
      const client = await base44.asServiceRole.entities.Client.get(clientId);
      if (!client) return Response.json({ error: 'Client not found' }, { status: 404 });

      // Update pending item status
      const newItems = (client.pendingItems || []).map(p =>
        p.id === itemId ? { ...p, status: 'Received', receivedAt: new Date().toISOString() } : p
      );
      await base44.asServiceRole.entities.Client.update(clientId, { pendingItems: newItems });

      // Add activity log entry
      const newLog = [{
        id: `al${Date.now()}`,
        action: `Pending item "${itemDescription}" marked as sent via Client Portal`,
        actor: user.email,
        date: new Date().toISOString(),
        source: 'client_portal',
      }, ...(client.activityLog || [])];
      await base44.asServiceRole.entities.Client.update(clientId, { activityLog: newLog });

      return Response.json({ success: true });
    }

    if (action === 'sendMessage') {
      const { clientId, engagementId, subject, message } = body;
      if (clientId !== linkedClientId) return Response.json({ error: 'Forbidden' }, { status: 403 });

      // Save communication note
      await base44.asServiceRole.entities.CommunicationNote.create({
        email: user.email,
        client_id: clientId,
        engagement_id: engagementId || null,
        subject: subject || '',
        message,
        source: 'client_portal',
        submitted_at: new Date().toISOString(),
      });

      // Add activity log to client
      const client = await base44.asServiceRole.entities.Client.get(clientId);
      if (client) {
        const newLog = [{
          id: `al${Date.now()}`,
          action: `New message from ${clientName} via Client Portal: "${subject || message.slice(0, 60)}"`,
          actor: user.email,
          date: new Date().toISOString(),
          source: 'client_portal',
        }, ...(client.activityLog || [])];
        await base44.asServiceRole.entities.Client.update(clientId, { activityLog: newLog });
      }

      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});