// node scripts/set-password.mjs user@example.com [newPassword]   (prints a random one if omitted)
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { MongoClient } from 'mongodb';

const [email, given] = process.argv.slice(2);
if (!email || !(process.env.MONGODB_URI || process.env.MONGO_URI)) { console.error('usage: set-password <email> [password]  (needs MONGODB_URI)'); process.exit(1); }
const pw = given || crypto.randomBytes(9).toString('base64url');
const client = await new MongoClient((process.env.MONGODB_URI || process.env.MONGO_URI)).connect();
const r = await client.db(process.env.MONGODB_DB || 'clara_erp').collection('User')
  .updateOne({ email: email.trim().toLowerCase() }, { $set: { password_hash: await bcrypt.hash(pw, 10) } });
console.log(r.matchedCount ? `Password for ${email}: ${pw}` : `No user with email ${email}`);
await client.close();
