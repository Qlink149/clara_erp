import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Generic service-role mutation handler.
 * Body: { entity, action, id?, data? }
 * action: "create" | "update" | "delete" | "filter"
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entity, action, id, data, filter } = await req.json();

    const entities = base44.asServiceRole.entities;
    if (!entities[entity]) {
      return Response.json({ error: `Unknown entity: ${entity}` }, { status: 400 });
    }

    let result;
    if (action === 'create') {
      result = await entities[entity].create(data);
    } else if (action === 'update') {
      result = await entities[entity].update(id, data);
    } else if (action === 'delete') {
      result = await entities[entity].delete(id);
    } else if (action === 'filter') {
      result = await entities[entity].filter(filter || {});
    } else {
      return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return Response.json({ result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});