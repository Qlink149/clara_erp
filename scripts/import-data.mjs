// Loads data/snapshot/*.json into MongoDB. Safe to re-run: records are upserted by id.
//   MONGODB_URI=... node scripts/import-data.mjs        (or put it in .env.local and `npm run import-data`)
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { MongoClient } from 'mongodb';

const dir = path.resolve(import.meta.dirname, '../data/snapshot');
const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!uri) { console.error('MONGODB_URI is not set'); process.exit(1); }

const client = await new MongoClient(uri).connect();
const db = client.db(process.env.MONGODB_DB || 'clara_erp');

const files = (await readdir(dir)).filter((f) => f.endsWith('.json') && f !== 'manifest.json');
let total = 0;
const newPasswords = [];

for (const file of files) {
  const entity = file.replace('.json', '');
  const records = JSON.parse(await readFile(path.join(dir, file), 'utf8'));
  const col = db.collection(entity);
  if (records.length) {
    const ops = [];
    for (const { id, ...rest } of records) {
      const doc = { ...rest };
      if (entity === 'User') {
        doc.email = String(doc.email).trim().toLowerCase();
        const existing = await col.findOne({ _id: String(id) }, { projection: { password_hash: 1 } });
        if (existing?.password_hash) doc.password_hash = existing.password_hash;
        else {
          const pw = crypto.randomBytes(9).toString('base64url');
          doc.password_hash = await bcrypt.hash(pw, 10);
          newPasswords.push(`${doc.email}\t${pw}`);
        }
      }
      ops.push({ replaceOne: { filter: { _id: String(id) }, replacement: doc, upsert: true } });
    }
    await col.bulkWrite(ops);
  }
  total += records.length;
  console.log(`${entity.padEnd(24)} ${records.length}`);
}

await db.collection('User').createIndex({ email: 1 }, { unique: true });
await db.collection('UserAccess').createIndex({ email: 1 });
await db.collection('InvoiceEntry').createIndex({ dueDate: 1 });
await db.collection('PortalClient').createIndex({ portal_slug: 1 });

if (newPasswords.length) {
  const out = path.resolve(import.meta.dirname, '../data/initial-passwords.txt');
  await writeFile(out, `email\ttemporary password\n${newPasswords.join('\n')}\n`);
  console.log(`\nWrote ${newPasswords.length} temporary passwords to ${out} (git-ignored). Share them privately, then delete the file.`);
}
console.log(`\nDone: ${total} records across ${files.length} tables.`);
await client.close();
