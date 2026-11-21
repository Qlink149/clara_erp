// Drop-in replacement for the Base44 SDK client. Same surface the app already uses
// (entities / auth / functions / integrations) but backed by our own /api on Vercel + MongoDB.
import { upload } from '@vercel/blob/client';

async function request(method, path, { params, body } = {}) {
  const url = new URL(`/api${path}`, window.location.origin);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    }
  }
  const res = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    err.response = { status: res.status, data };
    throw err;
  }
  return data;
}

const isPageOptions = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const fieldsParam = (f) => (Array.isArray(f) ? f.join(',') : f);

function entityHandler(name) {
  const base = `/entities/${name}`;
  const readArray = (sort, limit, skip, fields, query) =>
    request('GET', base, { params: { q: query ? JSON.stringify(query) : undefined, sort, limit, skip, fields: fieldsParam(fields) } });
  const readPage = (o, query) =>
    request('GET', `${base}/v2/list`, { params: { q: query ? JSON.stringify(query) : undefined, limit: o.limit, cursor: o.cursor, sort: o.sort, fields: fieldsParam(o.fields) } });
  return {
    list: (sort, limit, skip, fields) => (isPageOptions(sort) ? readPage(sort) : readArray(sort, limit, skip, fields)),
    filter: (query, sort, limit, skip, fields) => (isPageOptions(sort) ? readPage(sort, query) : readArray(sort, limit, skip, fields, query)),
    get: (id) => request('GET', `${base}/${id}`),
    create: (data) => request('POST', base, { body: data }),
    update: (id, data) => request('PUT', `${base}/${id}`, { body: data }),
    delete: (id) => request('DELETE', `${base}/${id}`),
    deleteMany: (query) => request('DELETE', base, { body: query }),
    bulkCreate: (data) => request('POST', `${base}/bulk`, { body: data }),
    bulkUpdate: (data) => request('PUT', `${base}/bulk`, { body: data }),
    updateMany: (query, data) => request('PATCH', `${base}/update-many`, { body: { query, data } }),
    count: async (query) => (await request('GET', `${base}/count`, { params: { q: query ? JSON.stringify(query) : undefined } })).count,
  };
}

const entityCache = {};
const entities = new Proxy({}, {
  get: (_, name) => {
    if (typeof name !== 'string') return undefined;
    return (entityCache[name] ||= entityHandler(name));
  },
});

const auth = {
  me: () => request('GET', '/auth/me'),
  isAuthenticated: async () => {
    try { await request('GET', '/auth/me'); return true; } catch { return false; }
  },
  login: (email, password) => request('POST', '/auth/login', { body: { email, password } }),
  register: (data) => request('POST', '/auth/register', { body: data }),
  changePassword: (data) => request('POST', '/auth/change-password', { body: data }),
  logout: async () => {
    try { await request('POST', '/auth/logout'); } catch { /* ignore */ }
    window.location.assign('/');
  },
  // The app renders its own login screen when signed out, so "redirect" just reloads.
  redirectToLogin: () => window.location.assign('/'),
};

const functions = {
  // Mirrors the SDK (axios-style): resolves to { data }.
  invoke: async (name, body = {}) => ({ data: await request('POST', `/functions/${name}`, { body }) }),
};

const integrations = {
  Core: {
    UploadFile: async ({ file }) => {
      const blob = await upload(file.name, file, { access: 'public', handleUploadUrl: '/api/upload' });
      return { file_url: blob.url };
    },
  },
};

export const base44 = { entities, auth, functions, integrations };
