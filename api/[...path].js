import { getSessionUser, requireUser, register, login, changePassword, setSessionCookie, clearSessionCookie, publicUser, isSuperAdmin } from '../server/auth.js';
import { handleEntities } from '../server/entities.js';
import { runFunction } from '../server/functions.js';
import { handleBlobUpload } from '../server/upload.js';
import { getDb } from '../server/db.js';

export const config = { maxDuration: 30 };

function safeJson(s) {
  try { return JSON.parse(s); } catch { return {}; }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const url = new URL(req.url, 'http://localhost');
    const segments = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    const query = Object.fromEntries(url.searchParams);
    const body = typeof req.body === 'string' ? safeJson(req.body) : req.body;
    const [head, ...rest] = segments;

    if (head === 'health') {
      await (await getDb()).command({ ping: 1 });
      return res.status(200).json({ ok: true });
    }

    if (head === 'auth') {
      const action = rest[0];
      if (action === 'login' && req.method === 'POST') {
        const user = await login(body || {});
        setSessionCookie(res, user);
        return res.status(200).json(publicUser(user));
      }
      if (action === 'register' && req.method === 'POST') {
        const user = await register(body || {});
        setSessionCookie(res, user);
        return res.status(200).json(publicUser(user));
      }
      if (action === 'logout') {
        clearSessionCookie(res);
        return res.status(200).json({ success: true });
      }
      if (action === 'me') {
        const user = await getSessionUser(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
        return res.status(200).json({ ...publicUser(user), is_super_admin: isSuperAdmin(user) });
      }
      if (action === 'change-password' && req.method === 'POST') {
        await changePassword(await requireUser(req), body || {});
        return res.status(200).json({ success: true });
      }
      return res.status(404).json({ error: 'Not found' });
    }

    if (head === 'upload' && req.method === 'POST') return await handleBlobUpload(req, res, body);

    if (head === 'functions' && rest[0] && req.method === 'POST') {
      // portalClient* are public (slug+email+password); every other function checks the session itself.
      const user = await getSessionUser(req);
      const data = await runFunction(rest[0], { user, body: body || {} });
      return res.status(200).json(data);
    }

    if (head === 'entities') {
      const user = await requireUser(req);
      return await handleEntities(req, res, rest, { user, query, body });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err) {
    const status = err.status || (err.name === 'SyntaxError' ? 400 : 500);
    if (status >= 500) console.error(err);
    return res.status(status).json({ error: status >= 500 ? 'Internal server error' : err.message });
  }
}
