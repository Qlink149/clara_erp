import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Client-facing portal WRITE actions, authenticated by slug + email + password.
// Only client-safe fields are accepted — INTERNAL ONLY fields can never be written or read here.

const FORM_FIELDS = [
  'time_per_cycle', 'frequency', 'volume_per_cycle', 'people_involved', 'error_rate',
  'seasonality', 'trigger', 'infrastructure_overview', 'workarounds', 'goal_statement',
  'desired_output_type', 'desired_output', 'desired_look', 'must_haves', 'nice_to_haves', 'success_metric',
];

const ROW_CONFIG = {
  step: { entity: 'PortalProcessStep', fields: ['step_number', 'description', 'owner', 'system_used', 'approx_time', 'is_pain_point', 'pain_point_note'] },
  exception: { entity: 'PortalException', fields: ['condition', 'current_handling'] },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json();
    const { slug, email, password, action } = body;

    // Authenticate portal client
    const clients = await svc.entities.PortalClient.filter({ portal_slug: slug || '' });
    const client = clients[0];
    if (
      !client || client.is_active === false ||
      (client.login_email || '').toLowerCase().trim() !== (email || '').toLowerCase().trim() ||
      client.login_password !== password
    ) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deptOwned = async (deptId) => {
      if (!deptId) return null;
      const d = await svc.entities.PortalDepartment.get(deptId);
      return d && d.portal_client_id === client.id ? d : null;
    };
    const ucOwned = async (ucId) => {
      if (!ucId) return null;
      const uc = await svc.entities.PortalUseCase.get(ucId);
      if (!uc) return null;
      return (await deptOwned(uc.department_id)) ? uc : null;
    };
    const formOwned = async (formId) => {
      if (!formId) return null;
      const f = await svc.entities.PortalDiscoveryForm.get(formId);
      if (!f) return null;
      return (await ucOwned(f.use_case_id)) ? f : null;
    };
    const pick = (obj, fields) => Object.fromEntries(Object.entries(obj || {}).filter(([k]) => fields.includes(k)));
    const cleanForm = (f) => ({ id: f.id, use_case_id: f.use_case_id, ...pick(f, FORM_FIELDS) });

    if (action === 'createUseCase') {
      const dept = await deptOwned(body.department_id);
      if (!dept) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const name = (body.process_name || '').trim();
      if (!name) return Response.json({ error: 'Process name required' }, { status: 400 });
      const useCase = await svc.entities.PortalUseCase.create({ department_id: dept.id, process_name: name, status: 'Discovery' });
      const form = await svc.entities.PortalDiscoveryForm.create({ use_case_id: useCase.id });
      return Response.json({
        useCase: { id: useCase.id, department_id: useCase.department_id, process_name: useCase.process_name, status: useCase.status },
        form: cleanForm(form),
      });
    }

    if (action === 'ensureForm') {
      const uc = await ucOwned(body.use_case_id);
      if (!uc) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const forms = await svc.entities.PortalDiscoveryForm.filter({ use_case_id: uc.id });
      const form = forms[0] || await svc.entities.PortalDiscoveryForm.create({ use_case_id: uc.id });
      return Response.json({ form: cleanForm(form) });
    }

    if (action === 'updateForm') {
      const form = await formOwned(body.form_id);
      if (!form) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const patch = pick(body.patch, FORM_FIELDS);
      if (Object.keys(patch).length > 0) {
        await svc.entities.PortalDiscoveryForm.update(form.id, patch);
      }
      return Response.json({ success: true });
    }

    if (action === 'rowOp') {
      const cfg = ROW_CONFIG[body.entity];
      if (!cfg) return Response.json({ error: 'Unknown entity' }, { status: 400 });
      const form = await formOwned(body.form_id);
      if (!form) return Response.json({ error: 'Forbidden' }, { status: 403 });

      if (body.op === 'create') {
        const row = await svc.entities[cfg.entity].create({ form_id: form.id, ...pick(body.patch, cfg.fields) });
        return Response.json({ row });
      }
      const row = await svc.entities[cfg.entity].get(body.row_id);
      if (!row || row.form_id !== form.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      if (body.op === 'update') {
        await svc.entities[cfg.entity].update(row.id, pick(body.patch, cfg.fields));
        return Response.json({ success: true });
      }
      if (body.op === 'delete') {
        await svc.entities[cfg.entity].delete(row.id);
        return Response.json({ success: true });
      }
      return Response.json({ error: 'Unknown op' }, { status: 400 });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});