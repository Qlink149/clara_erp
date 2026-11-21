import { useState, useEffect } from 'react';
import { Plus, FileText, Download, Trash2, AlertTriangle, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { format, differenceInDays, parseISO } from 'date-fns';

const DOC_TYPES = ['Contract', 'NDA', 'MSA', 'SOW', 'Proposal', 'Amendment', 'Other'];
const DOC_STATUSES = ['Active', 'Expired', 'Pending Signature', 'Renewed', 'Terminated'];

const STATUS_COLORS = {
  'Active': 'badge-green',
  'Expired': 'badge-red',
  'Pending Signature': 'badge-amber',
  'Renewed': 'badge-cyan',
  'Terminated': 'badge-gray',
};

function expiryBadge(expiryDate) {
  if (!expiryDate) return null;
  const days = differenceInDays(parseISO(expiryDate), new Date());
  if (days < 0) return { label: 'Expired', color: 'bg-red-500/15 text-red-400 border-red-500/25' };
  if (days <= 30) return { label: `Renewal Due in ${days}d`, color: 'bg-amber-500/15 text-amber-400 border-amber-500/25' };
  return null;
}

const EMPTY_FORM = { title: '', docType: 'Contract', docTypeCustom: '', fileUrl: '', fileName: '', signedDate: '', expiryDate: '', status: 'Active', notes: '' };

export default function LegalDocuments({ clientId, isAdmin, onDataChange }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    const d = await base44.entities.ClientDocument.filter({ clientId });
    setDocs(d.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    setLoading(false);
  };

  useEffect(() => { load(); }, [clientId]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, fileUrl: file_url, fileName: file.name }));
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = { ...form, clientId };
    await base44.entities.ClientDocument.create(payload);
    setForm(EMPTY_FORM);
    setShowForm(false);
    await load();
    onDataChange?.();
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this document?')) return;
    await base44.entities.ClientDocument.delete(id);
    await load();
    onDataChange?.();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{docs.length} document{docs.length !== 1 ? 's' : ''}</p>
        {isAdmin && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/15 text-primary border border-primary/25 rounded-lg text-xs font-medium hover:bg-primary/25 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Document
          </button>
        )}
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card-glass p-4 space-y-3 border border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">New Document</span>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground hover:text-foreground" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground block mb-1">Document Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. MSA - Kisna Diamond" className="w-full px-3 py-1.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Document Type</label>
              <select value={form.docType} onChange={e => setForm(f => ({ ...f, docType: e.target.value }))} className="w-full px-3 py-1.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50">
                {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              {form.docType === 'Other' && (
                <input value={form.docTypeCustom} onChange={e => setForm(f => ({ ...f, docTypeCustom: e.target.value }))} placeholder="Specify type…" className="mt-1 w-full px-3 py-1.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50" />
              )}
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-1.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50">
                {DOC_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Signed Date</label>
              <input type="date" value={form.signedDate} onChange={e => setForm(f => ({ ...f, signedDate: e.target.value }))} className="w-full px-3 py-1.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Expiry / Renewal Date</label>
              <input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} className="w-full px-3 py-1.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground block mb-1">Upload File (PDF / DOCX)</label>
              {form.fileName ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border rounded-lg text-sm">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <span className="text-foreground truncate flex-1">{form.fileName}</span>
                  <button onClick={() => setForm(f => ({ ...f, fileUrl: '', fileName: '' }))} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-3 py-1.5 bg-secondary border border-dashed border-border rounded-lg text-sm text-muted-foreground cursor-pointer hover:border-primary/40 hover:text-foreground transition-colors">
                  {uploading ? 'Uploading…' : <><Plus className="w-3.5 h-3.5" /> Choose file</>}
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
              )}
            </div>
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground block mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Optional notes…" className="w-full px-3 py-1.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50 resize-none" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.title.trim()} className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Document'}
            </button>
          </div>
        </div>
      )}

      {/* Document List */}
      {loading ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
      ) : docs.length === 0 ? (
        <div className="card-glass p-8 text-center">
          <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No documents yet{isAdmin ? ' — add one above' : ''}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map(doc => {
            const badge = expiryBadge(doc.expiryDate);
            const displayType = doc.docType === 'Other' && doc.docTypeCustom ? doc.docTypeCustom : doc.docType;
            return (
              <div key={doc.id} className="card-glass p-4 flex items-start gap-3 group">
                <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-foreground">{doc.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-secondary border border-border rounded text-muted-foreground">{displayType}</span>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', STATUS_COLORS[doc.status])}>{doc.status}</span>
                    {badge && (
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 font-medium', badge.color)}>
                        <AlertTriangle className="w-2.5 h-2.5" />{badge.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
                    {doc.signedDate && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Signed {format(parseISO(doc.signedDate), 'dd MMM yyyy')}</span>}
                    {doc.expiryDate && <span>Expires {format(parseISO(doc.expiryDate), 'dd MMM yyyy')}</span>}
                    {doc.notes && <span className="truncate max-w-xs">{doc.notes}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {doc.fileUrl && (
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-primary/15 text-muted-foreground hover:text-primary transition-colors" title="Download">
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                  {isAdmin && (
                    <button onClick={() => handleDelete(doc.id)} className="p-1.5 rounded-lg hover:bg-red-500/15 text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}