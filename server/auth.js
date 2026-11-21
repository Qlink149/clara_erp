import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb, newId, toApi, httpError } from './db.js';

export const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS || 'yogansh@claraai.tech,laksh@claraai.tech')
  .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
// Only this account may run the admin-only functions (matches the old Base44 functions).
export const SUPER_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL || 'yogansh@claraai.tech').toLowerCase();

const COOKIE = 'clara_session';
const MAX_AGE = 60 * 60 * 24 * 14; // 14 days

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) throw new Error('JWT_SECRET is not set (min 16 chars)');
  return s;
}

export const publicUser = (u) => {
  if (!u) return null;
  const { password_hash, ...rest } = toApi(u);
  return rest;
};

export function setSessionCookie(res, user) {
  const token = jwt.sign({ sub: String(user._id || user.id), email: user.email }, secret(), { expiresIn: MAX_AGE });
  const secure = process.env.VERCEL ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${MAX_AGE}${secure}`);
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
}

function readCookie(req, name) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

/** Returns the signed-in user document (without hash fields) or null. */
export async function getSessionUser(req) {
  const token = readCookie(req, COOKIE);
  if (!token) return null;
  let payload;
  try { payload = jwt.verify(token, secret()); } catch { return null; }
  const db = await getDb();
  const user = await db.collection('User').findOne({ _id: payload.sub });
  if (!user || user.disabled) return null;
  return user;
}

export async function requireUser(req) {
  const user = await getSessionUser(req);
  if (!user) throw httpError(401, 'Unauthorized');
  return user;
}

export const isSuperAdmin = (user) => !!user && SUPER_ADMIN_EMAILS.includes((user.email || '').toLowerCase());
export const isAdmin = (user) => isSuperAdmin(user) || user?.role === 'admin';

const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export async function register({ email, password, full_name }) {
  email = String(email || '').trim().toLowerCase();
  if (!validEmail(email)) throw httpError(400, 'Enter a valid email address');
  if (!password || String(password).length < 8) throw httpError(400, 'Password must be at least 8 characters');
  const db = await getDb();
  const existing = await db.collection('User').findOne({ email });
  if (existing) throw httpError(409, 'An account with this email already exists. Please sign in.');
  const now = new Date().toISOString();
  const doc = {
    _id: newId(), email, full_name: String(full_name || '').trim() || email.split('@')[0],
    role: 'user', disabled: null, is_verified: false, force_password_reset: false,
    password_hash: await bcrypt.hash(String(password), 10),
    created_date: now, updated_date: now,
  };
  await db.collection('User').insertOne(doc);
  return doc;
}

export async function login({ email, password }) {
  email = String(email || '').trim().toLowerCase();
  const db = await getDb();
  const user = await db.collection('User').findOne({ email });
  // Same error for unknown user / bad password / no password set (don't leak which).
  const ok = user && user.password_hash && !user.disabled && (await bcrypt.compare(String(password || ''), user.password_hash));
  if (!ok) throw httpError(401, 'Invalid email or password');
  return user;
}

export async function changePassword(user, { currentPassword, newPassword }) {
  if (!newPassword || String(newPassword).length < 8) throw httpError(400, 'New password must be at least 8 characters');
  const db = await getDb();
  const full = await db.collection('User').findOne({ _id: user._id });
  if (!(await bcrypt.compare(String(currentPassword || ''), full.password_hash || ''))) {
    throw httpError(401, 'Current password is incorrect');
  }
  await db.collection('User').updateOne({ _id: user._id }, {
    $set: { password_hash: await bcrypt.hash(String(newPassword), 10), force_password_reset: false, updated_date: new Date().toISOString() },
  });
}
