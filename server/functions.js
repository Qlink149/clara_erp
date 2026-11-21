// Port of base44/functions/*/entry.ts. Each handler: ({ user, body, svc }) => data  (throw httpError for non-200).
import { getDb, newId, toApi, sanitizeQuery, parseSort, httpError, ENTITIES } from './db.js';
import { SUPER_ADMIN_EMAIL } from './auth.js';

/** Service-role data access with the same shape the original functions used. */
function makeSvc(db) {
  const handler = (name) => {
    const col = db.collection(name);
    const now = () => new Date().toISOString();
    return {
      async list(sort, limit) {
        let c = col.find({}).sort(parseSort(sort));
        if (limit) c = c.limit(limit);
        return (await c.toArray()).map(toApi);
      },
      async filter(q = {}, sort, limit) {
        let c = col.find(sanitizeQuery(q)).sort(parseSort(sort));
        if (limit) c = c.limit(limit);
        return (await c.toArray()).map(toApi);
      },
      async get(id) { return toApi(await col.findOne({ _id: String(id) })); },
      async create(data) {
        const { id, ...d } = data || {};
        const doc = { _id: id ? String(id) : newId(), ...d, created_date: now(), updated_date: now() };
        await col.insertOne(doc);
        return toApi(doc);
      },
      async update(id, data) {
        const { id: _i, ...d } = data || {};
        return toApi(await col.findOneAndUpdate({ _id: String(id) }, { $set: { ...d, updated_date: now() } }, { returnDocument: 'after' }));
      },
      async delete(id) { await col.deleteOne({ _id: String(id) }); return { success: true }; },
    };
  };
  return { entities: new Proxy({}, { get: (_, name) => (ENTITIES.includes(name) ? handler(name) : undefined) }) };
}

const requireSuper = (user) => {
  if (!user || user.email.toLowerCase() !== SUPER_ADMIN_EMAIL) throw httpError(403, 'Forbidden');
};
const lc = (s) => (s || '').toLowerCase().trim();

const FORM_FIELDS = [
  'time_per_cycle', 'frequency', 'volume_per_cycle', 'people_involved', 'error_rate',
  'seasonality', 'trigger', 'infrastructure_overview', 'workarounds', 'goal_statement',
  'desired_output_type', 'desired_output', 'desired_look', 'must_haves', 'nice_to_haves', 'success_metric',
];
const ROW_CONFIG = {
  step: { entity: 'PortalProcessStep', fields: ['step_number', 'description', 'owner', 'system_used', 'approx_time', 'is_pain_point', 'pain_point_note'] },
  exception: { entity: 'PortalException', fields: ['condition', 'current_handling'] },
};

async function portalAuth(svc, { slug, email, password }) {
  const [client] = await svc.entities.PortalClient.filter({ portal_slug: slug || '' });
  if (!client || client.is_active === false || lc(client.login_email) !== lc(email) || client.login_password !== password) return null;
  return client;
}

export const FUNCTIONS = {
  async getData({ user, svc }) {
    if (!user) throw httpError(401, 'Unauthorized');
    const [clients, tasks, team, engagements, documents, settings] = await Promise.all([
      svc.entities.Client.list('-created_date', 200),
      svc.entities.Task.list('-created_date', 500),
      svc.entities.TeamMember.list('name', 50),
      svc.entities.Engagement.list('-created_date', 200),
      svc.entities.Document.list('-created_date', 500),
      svc.entities.AppSettings.filter({ key: 'global' }),
    ]);
    return { clients, tasks, team, engagements, documents, settings };
  },

  async getUserAccess({ user, svc }) {
    if (!user) throw httpError(401, 'Unauthorized');
    const records = (await svc.entities.UserAccess.filter({ email: user.email })) || [];
    const active = records.filter((r) => r.is_active);
    const isClient = active.some((r) => r.user_type === 'client');
    const pendingClient = records.find((r) => !r.is_active && r.user_type === 'client');
    const isPendingClient = !isClient && !!pendingClient;
    const pendingEmployee = records.find((r) => !r.is_active && r.user_type === 'employee');
    return {
      records: active,
      isClient,
      linkedClientId: isClient ? active.find((r) => r.linked_client_id)?.linked_client_id : null,
      portalAccessLevel: isClient ? (active.find((r) => r.portal_access_level)?.portal_access_level || 'full') : null,
      isPendingClient,
      pendingLinkedClientId: isPendingClient ? pendingClient.linked_client_id : null,
      isPendingEmployee: !isClient && !isPendingClient && !!pendingEmployee,
      hasSubmittedRequest: records.length > 0,
    };
  },

  async mutateData({ user, body, svc }) {
    if (!user) throw httpError(401, 'Unauthorized');
    const { entity, action, id, data, filter } = body;
    const api = svc.entities[entity];
    if (!api) throw httpError(400, `Unknown entity: ${entity}`);
    // Admin tables are never writable through this generic endpoint.
    if (['User', 'UserAccess', 'ModuleAccess', 'LoginRegistry'].includes(entity)) throw httpError(403, 'Forbidden');
    const access = await svc.entities.UserAccess.filter({ email: user.email, is_active: true, user_type: 'employee' });
    if (!access.length && user.email.toLowerCase() !== SUPER_ADMIN_EMAIL) throw httpError(403, 'Forbidden');
    let result;
    if (action === 'create') result = await api.create(data);
    else if (action === 'update') result = await api.update(id, data);
    else if (action === 'delete') result = await api.delete(id);
    else if (action === 'filter') result = await api.filter(filter || {});
    else throw httpError(400, `Unknown action: ${action}`);
    return { result };
  },

  async recordLogin({ user, svc }) {
    if (!user) throw httpError(401, 'Unauthorized');
    const now = new Date().toISOString();
    const [existing] = await svc.entities.LoginRegistry.filter({ email: user.email });
    if (existing) {
      await svc.entities.LoginRegistry.update(existing.id, { last_login_at: now, display_name: user.full_name || user.email });
    } else {
      await svc.entities.LoginRegistry.create({ email: user.email, display_name: user.full_name || user.email, first_login_at: now, last_login_at: now });
    }
    return { success: true };
  },

  async submitAccessRequest({ user, body, svc }) {
    if (!user) throw httpError(401, 'Unauthorized');
    const { userType, linkedClientId } = body;
    if (!['client', 'employee'].includes(userType)) throw httpError(400, 'Invalid userType');
    if (userType === 'client' && !linkedClientId) throw httpError(400, 'linkedClientId required for client');
    const existing = await svc.entities.UserAccess.filter({ email: user.email });
    if (existing.length) return { success: true, alreadyExists: true };
    const now = new Date().toISOString();
    await svc.entities.UserAccess.create(userType === 'client'
      ? { email: user.email, client_id: linkedClientId, engagement_id: null, granted_by: null, granted_at: now, is_active: false, user_type: 'client', linked_client_id: linkedClientId, portal_access_level: 'summary' }
      : { email: user.email, client_id: 'PENDING', engagement_id: null, granted_by: null, granted_at: now, is_active: false, user_type: 'employee', linked_client_id: null, portal_access_level: null });
    return { success: true };
  },

  async adminApproveAccess({ user, body, svc }) {
    requireSuper(user);
    const { email } = body;
    if (!email) throw httpError(400, 'email required');
    const pending = (await svc.entities.UserAccess.filter({ email })).filter((r) => !r.is_active);
    const now = new Date().toISOString();
    for (const rec of pending) {
      await svc.entities.UserAccess.update(rec.id, { is_active: true, granted_by: SUPER_ADMIN_EMAIL, granted_at: now });
    }
    return { success: true, approved: pending.length };
  },

  async adminGetLoginRegistry({ user, svc }) {
    requireSuper(user);
    return {
      registry: await svc.entities.LoginRegistry.list('-last_login_at', 200),
      allAccess: await svc.entities.UserAccess.list('-created_date', 500),
    };
  },

  async adminSaveAccess({ user, body, svc }) {
    requireSuper(user);
    const { email, accessList, userType, linkedClientId, portalAccessLevel } = body;
    for (const rec of await svc.entities.UserAccess.filter({ email })) {
      await svc.entities.UserAccess.update(rec.id, { is_active: false });
    }
    const now = new Date().toISOString();
    const base = { email, granted_by: SUPER_ADMIN_EMAIL, granted_at: now, is_active: true };
    if (userType === 'client' && linkedClientId) {
      const items = accessList?.length ? accessList : [{}];
      for (const item of items) {
        await svc.entities.UserAccess.create({
          ...base, client_id: linkedClientId, engagement_id: item.engagementId || null,
          user_type: 'client', linked_client_id: linkedClientId, portal_access_level: portalAccessLevel || 'full',
        });
      }
    } else {
      for (const item of accessList || []) {
        await svc.entities.UserAccess.create({
          ...base, client_id: item.clientId, engagement_id: item.engagementId || null,
          user_type: 'employee', linked_client_id: null, portal_access_level: null,
        });
      }
    }
    return { success: true };
  },

  async clientPortalData({ user, svc }) {
    if (!user) throw httpError(401, 'Unauthorized');
    const records = (await svc.entities.UserAccess.filter({ email: user.email })) || [];
    const active = records.filter((r) => r.is_active);
    const isActiveClient = active.some((r) => r.user_type === 'client');
    const pendingRecord = records.find((r) => !r.is_active && r.user_type === 'client');
    if (!isActiveClient && !pendingRecord) throw httpError(403, 'Forbidden');

    const linkedClientId = isActiveClient ? active.find((r) => r.linked_client_id)?.linked_client_id : pendingRecord.linked_client_id;
    const portalAccessLevel = isActiveClient ? (active.find((r) => r.portal_access_level)?.portal_access_level || 'full') : 'summary';
    const isPending = !isActiveClient;

    let authorizedEngIds = null;
    if (isActiveClient) {
      const engRecs = active.filter((r) => r.linked_client_id === linkedClientId);
      if (!engRecs.some((r) => !r.engagement_id)) authorizedEngIds = new Set(engRecs.filter((r) => r.engagement_id).map((r) => r.engagement_id));
    }

    const client = linkedClientId ? await svc.entities.Client.get(linkedClientId) : null;
    const allEng = linkedClientId ? await svc.entities.Engagement.filter({ clientId: linkedClientId }) : [];
    const engagements = isPending || authorizedEngIds === null ? allEng : allEng.filter((e) => authorizedEngIds.has(e.id));
    const allTasks = linkedClientId ? await svc.entities.Task.filter({ clientId: linkedClientId }) : [];
    const tasks = isPending || authorizedEngIds === null ? allTasks : allTasks.filter((t) => !t.engagementId || authorizedEngIds.has(t.engagementId));
    const documents = isPending || !linkedClientId ? [] : (await svc.entities.Document.filter({ clientId: linkedClientId })).filter((d) => d.client_visible && !d.deleted);
    const team = await svc.entities.TeamMember.list();

    return {
      client, engagements, tasks, documents, team, portalAccessLevel, isPending,
      authorizedEngagementIds: authorizedEngIds === null ? null : Array.from(authorizedEngIds),
    };
  },

  async clientPortalAction({ user, body, svc }) {
    if (!user) throw httpError(401, 'Unauthorized');
    const { action } = body;
    const access = await svc.entities.UserAccess.filter({ email: user.email, is_active: true });
    if (!access.some((r) => r.user_type === 'client')) throw httpError(403, 'Forbidden');
    const linkedClientId = access.find((r) => r.linked_client_id)?.linked_client_id;
    const clientName = user.full_name || user.email;
    const log = (text, client) => [{ id: `al${Date.now()}`, action: text, actor: user.email, date: new Date().toISOString(), source: 'client_portal' }, ...(client.activityLog || [])];

    if (action === 'markPendingItemSent') {
      const { clientId, itemId, itemDescription } = body;
      if (clientId !== linkedClientId) throw httpError(403, 'Forbidden');
      const client = await svc.entities.Client.get(clientId);
      if (!client) throw httpError(404, 'Client not found');
      const pendingItems = (client.pendingItems || []).map((p) => (p.id === itemId ? { ...p, status: 'Received', receivedAt: new Date().toISOString() } : p));
      await svc.entities.Client.update(clientId, { pendingItems, activityLog: log(`Pending item "${itemDescription}" marked as sent via Client Portal`, client) });
      return { success: true };
    }
    if (action === 'sendMessage') {
      const { clientId, engagementId, subject, message } = body;
      if (clientId !== linkedClientId) throw httpError(403, 'Forbidden');
      await svc.entities.CommunicationNote.create({
        email: user.email, client_id: clientId, engagement_id: engagementId || null,
        subject: subject || '', message, source: 'client_portal', submitted_at: new Date().toISOString(),
      });
      const client = await svc.entities.Client.get(clientId);
      if (client) {
        await svc.entities.Client.update(clientId, { activityLog: log(`New message from ${clientName} via Client Portal: "${subject || String(message || '').slice(0, 60)}"`, client) });
      }
      return { success: true };
    }
    throw httpError(400, 'Unknown action');
  },

  // Public (slug + email + password) client discovery portal
  async portalClientData({ body, svc }) {
    const { slug, email, password } = body;
    if (!slug || !email || !password) throw httpError(400, 'Missing credentials');
    const [found] = await svc.entities.PortalClient.filter({ portal_slug: slug });
    if (!found || found.is_active === false) throw httpError(404, 'Portal not found or inactive');
    const client = await portalAuth(svc, body);
    if (!client) throw httpError(401, 'Invalid email or password');

    const departments = await svc.entities.PortalDepartment.filter({ portal_client_id: client.id });
    const useCases = [];
    for (const d of departments) useCases.push(...await svc.entities.PortalUseCase.filter({ department_id: d.id }));

    const meetings = [], owners = [], forms = [];
    for (const uc of useCases) {
      const [m, o, f] = await Promise.all([
        svc.entities.PortalMeeting.filter({ use_case_id: uc.id }),
        svc.entities.PortalProcessOwner.filter({ use_case_id: uc.id }),
        svc.entities.PortalDiscoveryForm.filter({ use_case_id: uc.id }),
      ]);
      meetings.push(...m);
      owners.push(...o.filter((p) => p.visibility !== 'Internal-only' && p.person_type !== 'Decision Maker'));
      forms.push(...f);
    }
    const dataSources = [], steps = [], exceptions = [], escalations = [], userGroups = [];
    for (const form of forms) {
      const [ds, st, ex, es, ug] = await Promise.all([
        svc.entities.PortalDataSource.filter({ form_id: form.id }),
        svc.entities.PortalProcessStep.filter({ form_id: form.id }),
        svc.entities.PortalException.filter({ form_id: form.id }),
        svc.entities.PortalEscalationMatrix.filter({ form_id: form.id }),
        svc.entities.PortalUserGroup.filter({ form_id: form.id }),
      ]);
      dataSources.push(...ds); steps.push(...st); exceptions.push(...ex); escalations.push(...es); userGroups.push(...ug);
    }

    const pick = (o, keys) => Object.fromEntries(keys.map((k) => [k, o[k]]));
    return {
      client: { client_name: client.client_name, company_logo_url: client.company_logo_url || '', portal_slug: client.portal_slug },
      departments,
      useCases: useCases.map((u) => pick(u, ['id', 'department_id', 'process_name', 'problem_statement', 'solution_statement', 'demo_link', 'automation_type', 'status'])),
      meetings,
      owners,
      forms: forms.map((f) => pick(f, ['id', 'use_case_id', ...FORM_FIELDS])),
      dataSources: dataSources.map((s) => pick(s, ['id', 'form_id', 'source_name', 'owning_team', 'system', 'format', 'structure', 'data_cleanliness'])),
      steps, exceptions, escalations, userGroups,
    };
  },

  async portalClientMutate({ body, svc }) {
    const { action } = body;
    const client = await portalAuth(svc, body);
    if (!client) throw httpError(401, 'Unauthorized');

    const deptOwned = async (id) => { if (!id) return null; const d = await svc.entities.PortalDepartment.get(id); return d && d.portal_client_id === client.id ? d : null; };
    const ucOwned = async (id) => { if (!id) return null; const uc = await svc.entities.PortalUseCase.get(id); return uc && (await deptOwned(uc.department_id)) ? uc : null; };
    const formOwned = async (id) => { if (!id) return null; const f = await svc.entities.PortalDiscoveryForm.get(id); return f && (await ucOwned(f.use_case_id)) ? f : null; };
    const pick = (obj, fields) => Object.fromEntries(Object.entries(obj || {}).filter(([k]) => fields.includes(k)));
    const cleanForm = (f) => ({ id: f.id, use_case_id: f.use_case_id, ...pick(f, FORM_FIELDS) });

    if (action === 'createUseCase') {
      const dept = await deptOwned(body.department_id);
      if (!dept) throw httpError(403, 'Forbidden');
      const name = (body.process_name || '').trim();
      if (!name) throw httpError(400, 'Process name required');
      const useCase = await svc.entities.PortalUseCase.create({ department_id: dept.id, process_name: name, status: 'Discovery' });
      const form = await svc.entities.PortalDiscoveryForm.create({ use_case_id: useCase.id });
      return { useCase: { id: useCase.id, department_id: useCase.department_id, process_name: useCase.process_name, status: useCase.status }, form: cleanForm(form) };
    }
    if (action === 'ensureForm') {
      const uc = await ucOwned(body.use_case_id);
      if (!uc) throw httpError(403, 'Forbidden');
      const [existing] = await svc.entities.PortalDiscoveryForm.filter({ use_case_id: uc.id });
      return { form: cleanForm(existing || await svc.entities.PortalDiscoveryForm.create({ use_case_id: uc.id })) };
    }
    if (action === 'updateForm') {
      const form = await formOwned(body.form_id);
      if (!form) throw httpError(403, 'Forbidden');
      const patch = pick(body.patch, FORM_FIELDS);
      if (Object.keys(patch).length) await svc.entities.PortalDiscoveryForm.update(form.id, patch);
      return { success: true };
    }
    if (action === 'rowOp') {
      const cfg = ROW_CONFIG[body.entity];
      if (!cfg) throw httpError(400, 'Unknown entity');
      const form = await formOwned(body.form_id);
      if (!form) throw httpError(403, 'Forbidden');
      if (body.op === 'create') return { row: await svc.entities[cfg.entity].create({ form_id: form.id, ...pick(body.patch, cfg.fields) }) };
      const row = await svc.entities[cfg.entity].get(body.row_id);
      if (!row || row.form_id !== form.id) throw httpError(403, 'Forbidden');
      if (body.op === 'update') { await svc.entities[cfg.entity].update(row.id, pick(body.patch, cfg.fields)); return { success: true }; }
      if (body.op === 'delete') { await svc.entities[cfg.entity].delete(row.id); return { success: true }; }
      throw httpError(400, 'Unknown op');
    }
    throw httpError(400, 'Unknown action');
  },
};

export async function runFunction(name, ctx) {
  const fn = Object.prototype.hasOwnProperty.call(FUNCTIONS, name) ? FUNCTIONS[name] : null;
  if (!fn) throw httpError(404, `Unknown function: ${name}`);
  return fn({ ...ctx, svc: makeSvc(await getDb()) });
}
