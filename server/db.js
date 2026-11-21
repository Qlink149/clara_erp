import { MongoClient, ObjectId } from 'mongodb';

let clientPromise;

export function getClient() {
  if (!clientPromise) {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) throw new Error('MONGODB_URI is not set');
    clientPromise = new MongoClient(uri, { maxPoolSize: 5 }).connect().catch((e) => {
      clientPromise = undefined;
      throw e;
    });
  }
  return clientPromise;
}

export async function getDb() {
  const client = await getClient();
  return client.db(process.env.MONGODB_DB || 'clara_erp');
}

export const newId = () => new ObjectId().toHexString();

// Every entity (table) from base44/entities, plus the built-in User table.
export const ENTITIES = [
  'AppSettings', 'Client', 'ClientAsset', 'ClientDocNote', 'ClientDocument', 'CommunicationNote',
  'Document', 'Engagement', 'InvoiceEntry', 'InvoiceSchedule', 'InvoiceSettings', 'KPI', 'KPIProgress',
  'LoginRegistry', 'ModuleAccess', 'PortalClient', 'PortalDataSource', 'PortalDepartment',
  'PortalDiscoveryForm', 'PortalEscalationMatrix', 'PortalException', 'PortalMeeting',
  'PortalProcessOwner', 'PortalProcessStep', 'PortalUseCase', 'PortalUserGroup', 'ProformaInvoice',
  'Task', 'TeamMember', 'User', 'UserAccess',
];

// ---- document <-> API shape (Mongo `_id` string  <->  `id`) ----
export function toApi(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return { id: String(_id), ...rest };
}

// Reject operators that execute JS on the server.
const FORBIDDEN = new Set(['$where', '$function', '$accumulator', '$expr']);
export function sanitizeQuery(q) {
  if (Array.isArray(q)) return q.map(sanitizeQuery);
  if (q && typeof q === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(q)) {
      if (FORBIDDEN.has(k)) throw httpError(400, `Operator ${k} is not allowed`);
      out[k === 'id' ? '_id' : k] = sanitizeQuery(v);
    }
    return out;
  }
  return q;
}

export function parseSort(sort) {
  if (!sort || typeof sort !== 'string') return { created_date: -1, _id: -1 };
  return sort.startsWith('-') ? { [sort.slice(1)]: -1 } : { [sort]: 1 };
}

export function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}
