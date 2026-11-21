import { getDb, newId, toApi, sanitizeQuery, parseSort, httpError, ENTITIES } from './db.js';
import { isAdmin, isSuperAdmin } from './auth.js';

// Only super admins may write to these (the old app did this from the admin UI).
const ADMIN_WRITE = new Set(['UserAccess', 'ModuleAccess', 'LoginRegistry', 'User']);
// Employees may read these only for their own email; everything else is blocked for non-admin readers here.
const SELF_READ = new Set(['UserAccess', 'ModuleAccess']);

/**
 * Authorization model (the original app had client-side checks only):
 *  - super admin / admin           -> everything
 *  - user with an ACTIVE employee access record -> read/write all business tables
 *    (the UI scopes by client/engagement, same as before), no admin tables
 *  - anyone else (new user, pending, client-portal user) -> only their own UserAccess/ModuleAccess rows
 *    (client-portal data is served through the clientPortal* functions)
 */
async function authorize(user, entity, method, query) {
  if (isAdmin(user)) return;
  const isWrite = method !== 'GET';
  if (entity === 'User') throw httpError(403, 'Forbidden');
  if (SELF_READ.has(entity) && !isWrite) {
    if (!query || typeof query.email !== 'string' || query.email.toLowerCase() !== user.email.toLowerCase()) {
      throw httpError(403, 'Forbidden');
    }
    return;
  }
  if (ADMIN_WRITE.has(entity) || SELF_READ.has(entity)) throw httpError(403, 'Forbidden');
  const db = await getDb();
  const rec = await db.collection('UserAccess').findOne({ email: user.email.toLowerCase(), is_active: true, user_type: 'employee' });
  if (!rec) throw httpError(403, 'Forbidden');
}

const stamp = (data, user) => {
  const now = new Date().toISOString();
  return { ...data, created_date: now, updated_date: now, created_by: user?.email, created_by_id: user ? String(user._id) : undefined };
};

function project(fields) {
  if (!fields) return undefined;
  const list = Array.isArray(fields) ? fields : String(fields).split(',');
  return Object.fromEntries(list.map((f) => [f, 1]));
}

export async function handleEntities(req, res, segments, ctx) {
  const [entity, a, b] = segments;
  if (!ENTITIES.includes(entity)) throw httpError(404, `Unknown entity: ${entity}`);
  const { user, query: qs, body } = ctx;
  const method = req.method;
  const col = (await getDb()).collection(entity);
  const parseQ = () => (qs.q ? sanitizeQuery(JSON.parse(qs.q)) : {});
  const out = (code, data) => res.status(code).json(data);

  // ---- collection-level ----
  if (!a) {
    if (method === 'GET') {
      const q = parseQ();
      await authorize(user, entity, method, q);
      const limit = Math.min(parseInt(qs.limit, 10) || 1000, 5000);
      const docs = await col.find(q, { projection: project(qs.fields) }).sort(parseSort(qs.sort)).skip(parseInt(qs.skip, 10) || 0).limit(limit).toArray();
      return out(200, docs.map(toApi));
    }
    if (method === 'POST') {
      await authorize(user, entity, method);
      const { id, ...data } = body || {};
      const doc = { _id: id ? String(id) : newId(), ...stamp(data, user) };
      await col.insertOne(doc);
      return out(200, toApi(doc));
    }
    if (method === 'DELETE') { // deleteMany(query)
      await authorize(user, entity, method);
      const r = await col.deleteMany(sanitizeQuery(body || {}));
      return out(200, { deleted: r.deletedCount });
    }
  }

  // ---- reserved sub-paths ----
  if (a === 'v2' && b === 'list' && method === 'GET') {
    const q = parseQ();
    await authorize(user, entity, method, q);
    const limit = Math.min(parseInt(qs.limit, 10) || 50, 5000);
    const skip = parseInt(qs.cursor, 10) || 0;
    const docs = await col.find(q, { projection: project(qs.fields) }).sort(parseSort(qs.sort)).skip(skip).limit(limit + 1).toArray();
    const hasMore = docs.length > limit;
    return out(200, { items: docs.slice(0, limit).map(toApi), next_cursor: hasMore ? String(skip + limit) : null });
  }
  if (a === 'count' && method === 'GET') {
    const q = parseQ();
    await authorize(user, entity, method, q);
    return out(200, { count: await col.countDocuments(q) });
  }
  if (a === 'bulk' && method === 'POST') {
    await authorize(user, entity, method);
    const docs = (Array.isArray(body) ? body : []).map(({ id, ...d }) => ({ _id: id ? String(id) : newId(), ...stamp(d, user) }));
    if (docs.length) await col.insertMany(docs);
    return out(200, docs.map(toApi));
  }
  if (a === 'bulk' && method === 'PUT') {
    await authorize(user, entity, method);
    const now = new Date().toISOString();
    const ops = (Array.isArray(body) ? body : []).filter((d) => d?.id).map(({ id, ...d }) => ({
      updateOne: { filter: { _id: String(id) }, update: { $set: { ...d, updated_date: now } } },
    }));
    if (ops.length) await col.bulkWrite(ops);
    return out(200, { updated: ops.length });
  }
  if (a === 'update-many' && method === 'PATCH') {
    await authorize(user, entity, method);
    const q = sanitizeQuery(body?.query || {});
    const data = body?.data || {};
    const hasOps = Object.keys(data).some((k) => k.startsWith('$'));
    const update = hasOps ? sanitizeQuery(data) : { $set: data };
    update.$set = { ...(update.$set || {}), updated_date: new Date().toISOString() };
    const r = await col.updateMany(q, update);
    return out(200, { updated: r.modifiedCount });
  }

  // ---- single record ----
  const id = a;
  if (method === 'GET') {
    await authorize(user, entity, method, { email: undefined });
    const doc = await col.findOne({ _id: id });
    if (!doc) throw httpError(404, `${entity} not found`);
    return out(200, toApi(doc));
  }
  if (method === 'PUT' || method === 'PATCH') {
    await authorize(user, entity, method);
    const { id: _ignore, created_date, ...data } = body || {};
    const doc = await col.findOneAndUpdate({ _id: id }, { $set: { ...data, updated_date: new Date().toISOString() } }, { returnDocument: 'after' });
    if (!doc) throw httpError(404, `${entity} not found`);
    return out(200, toApi(doc));
  }
  if (method === 'DELETE') {
    await authorize(user, entity, method);
    await col.deleteOne({ _id: id });
    return out(200, { success: true });
  }
  throw httpError(405, 'Method not allowed');
}
