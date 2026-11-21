import { useState, useMemo } from 'react';
import { Plus, Search, Trash2, Eye, Download, FileText, Image, File, ChevronDown, ChevronRight, X, Link, Upload, RotateCcw } from 'lucide-react';
import { cn, formatRelative } from '@/lib/utils';
import { useStore } from '@/lib/StoreContext';
import { base44 } from '@/api/base44Client';

const CATEGORIES = ['Contracts & Agreements', 'Payment Records', 'Legal Documents', 'Project Briefs & SOWs', 'Miscellaneous / Other'];
const CAT_COLORS = {
  'Contracts & Agreements': { color: '#67e8f9', bg: 'rgba(103,232,249,0.1)', border: 'rgba(103,232,249,0.2)' },
  'Payment Records':        { color: '#6ee7b7', bg: 'rgba(110,231,183,0.1)', border: 'rgba(110,231,183,0.2)' },
  'Legal Documents':        { color: '#c4b5fd', bg: 'rgba(196,181,253,0.1)', border: 'rgba(196,181,253,0.2)' },
  'Project Briefs & SOWs':  { color: '#fcd34d', bg: 'rgba(252,211,77,0.1)',  border: 'rgba(252,211,77,0.2)'  },
  'Miscellaneous / Other':  { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' },
};

function fileIcon(type) {
  if (!type) return <File className="w-4 h-4 text-muted-foreground" />;
  if (type.includes('pdf')) return <FileText className="w-4 h-4 text-red-400" />;
  if (type.includes('word') || type.includes('doc')) return <FileText className="w-4 h-4 text-blue-400" />;
  if (type.includes('sheet') || type.includes('excel') || type.includes('xls')) return <FileText className="w-4 h-4 text-green-400" />;
  if (type.includes('image') || type.includes('png') || type.includes('jpg')) return <Image className="w-4 h-4 text-amber-400" />;
  if (type === 'link') return <Link className="w-4 h-4 text-cyan-400" />;
  return <File className="w-4 h-4 text-muted-foreground" />;
}

function AddDocModal({ open, onClose, onSave, defaultCategory, team }) {
  const [form, setForm] = useState({ name: '', category: defaultCategory || CATEGORIES[0], method: 'link', url: '', notes: '', uploadedBy: 'yogansh' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    let docData = { ...form, type: form.method === 'link' ? 'link' : (file?.type || 'file'), addedAt: new Date().toISOString() };
    if (form.method === 'upload' && file) {
      setUploading(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        docData.url = file_url;
        docData.fileName = file.name;
      } catch (e) { console.error(e); }
      setUploading(false);
    }
    onSave(docData);
    onClose();
  };

  if (!open) return null;
  const inputCls = 'bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 w-full';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl shadow-2xl animate-fade-in overflow-hidden"
        style={{ background: 'linear-gradient(135deg,rgba(4,8,18,0.98) 0%,rgba(6,12,24,0.98) 100%)', border: '1px solid rgba(0,212,255,0.15)' }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(0,212,255,0.5),transparent)' }} />
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg,#00d4ff,rgba(0,212,255,0.2))' }} />
            <h2 className="text-sm font-bold uppercase tracking-widest">Add Document</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-cyan-400 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Document Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="e.g. Master Service Agreement" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Category *</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">Upload Method</label>
            <div className="flex gap-3">
              {[['link','Paste Link'],['upload','Upload File']].map(([v,l]) => (
                <button key={v} onClick={() => set('method', v)} className={cn('flex-1 py-2 rounded-lg text-sm font-medium border transition-all', form.method === v ? 'bg-primary/15 text-primary border-primary/30' : 'bg-secondary text-muted-foreground border-border hover:text-foreground')}>
                  {v === 'link' ? <Link className="w-3.5 h-3.5 inline mr-1.5" /> : <Upload className="w-3.5 h-3.5 inline mr-1.5" />}{l}
                </button>
              ))}
            </div>
          </div>
          {form.method === 'link' ? (
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">URL</label>
              <input value={form.url} onChange={e => set('url', e.target.value)} className={inputCls} placeholder="https://..." />
            </div>
          ) : (
            <div className="border border-dashed border-border rounded-lg p-6 text-center">
              <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" onChange={e => setFile(e.target.files[0])} className="hidden" id="doc-upload" />
              <label htmlFor="doc-upload" className="cursor-pointer">
                <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{file ? file.name : 'Click to upload or drag & drop'}</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOC, XLS, PNG, JPG — Max 10MB</p>
              </label>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className={inputCls + ' resize-none'} placeholder="Optional context..." />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Uploaded By</label>
            <select value={form.uploadedBy} onChange={e => set('uploadedBy', e.target.value)} className={inputCls}>
              {['yogansh','laksh','sidhi','sidharth','pratham'].map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3 justify-end px-6 py-4 border-t border-white/5">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium">Cancel</button>
          <button onClick={handleSave} disabled={!form.name.trim() || uploading} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
            {uploading ? 'Uploading...' : 'Save Document'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DocumentsTab({ clientId }) {
  const { documents, addDocument, deleteDocument, restoreDocument, updateDocumentVisibility } = useStore();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [sort, setSort] = useState('newest');
  const [addModal, setAddModal] = useState(null); // category
  const [collapsed, setCollapsed] = useState({});
  const [showDeleted, setShowDeleted] = useState(false);

  const clientDocs = documents.filter(d => d.clientId === clientId);
  const active = clientDocs.filter(d => !d.deleted);
  const deleted = clientDocs.filter(d => d.deleted);

  const filtered = useMemo(() => {
    let docs = active;
    if (search) docs = docs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || (d.notes || '').toLowerCase().includes(search.toLowerCase()));
    if (filterCat) docs = docs.filter(d => d.category === filterCat);
    return docs.sort((a, b) => {
      if (sort === 'newest') return new Date(b.addedAt) - new Date(a.addedAt);
      if (sort === 'oldest') return new Date(a.addedAt) - new Date(b.addedAt);
      if (sort === 'name-az') return a.name.localeCompare(b.name);
      if (sort === 'name-za') return b.name.localeCompare(a.name);
      if (sort === 'category') return a.category.localeCompare(b.category);
      return 0;
    });
  }, [active, search, filterCat, sort]);

  const toggleCat = (cat) => setCollapsed(c => ({ ...c, [cat]: !c[cat] }));

  const catStyle = inputCls => 'bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none';

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..." className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name-az">Name A–Z</option>
          <option value="name-za">Name Z–A</option>
          <option value="category">By Category</option>
        </select>
      </div>

      {/* Category Sections */}
      {CATEGORIES.filter(cat => !filterCat || filterCat === cat).map(cat => {
        const catDocs = filtered.filter(d => d.category === cat);
        const style = CAT_COLORS[cat];
        const isCollapsed = collapsed[cat];
        return (
          <div key={cat} className="card-glass overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <button onClick={() => toggleCat(cat)} className="flex items-center gap-2 flex-1">
                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                <span className="text-sm font-semibold text-foreground">{cat}</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }}>{catDocs.length}</span>
              </button>
              <button onClick={() => setAddModal(cat)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/10 transition-colors">
                <Plus className="w-3 h-3" /> Upload
              </button>
            </div>
            {!isCollapsed && (
              <div className="divide-y divide-border">
                {catDocs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No documents in this category</p>
                ) : catDocs.map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors">
                    <div className="flex-shrink-0">{fileIcon(doc.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{doc.name}</p>
                      {doc.notes && <p className="text-xs text-muted-foreground truncate">{doc.notes}</p>}
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatRelative(doc.addedAt)} · by {doc.uploadedBy}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Share with client portal toggle */}
                      <button
                        onClick={() => updateDocumentVisibility && updateDocumentVisibility(doc.id, !doc.client_visible)}
                        title={doc.client_visible ? 'Shared with client portal — click to hide' : 'Share with client portal'}
                        className={cn(
                          'flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold border transition-all',
                          doc.client_visible
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : 'bg-secondary text-muted-foreground border-border hover:text-foreground'
                        )}
                      >
                        {doc.client_visible ? '👁 Shared' : '👁 Share'}
                      </button>
                      {doc.url && (
                        <a href={doc.url} target="_blank" rel="noreferrer" className="p-1.5 rounded hover:bg-cyan-500/10 text-muted-foreground hover:text-cyan-400 transition-colors" title="View">
                          <Eye className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {doc.type !== 'link' && doc.url && (
                        <a href={doc.url} download className="p-1.5 rounded hover:bg-cyan-500/10 text-muted-foreground hover:text-cyan-400 transition-colors" title="Download">
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button onClick={() => deleteDocument(doc.id)} className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Deleted Documents */}
      {deleted.length > 0 && (
        <div>
          <button onClick={() => setShowDeleted(o => !o)} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-2">
            {showDeleted ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            Deleted Documents ({deleted.length})
          </button>
          {showDeleted && (
            <div className="space-y-2 mt-2 opacity-60">
              {deleted.map(doc => (
                <div key={doc.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-secondary/20">
                  {fileIcon(doc.type)}
                  <p className="text-sm text-muted-foreground flex-1 line-through">{doc.name}</p>
                  <button onClick={() => restoreDocument(doc.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/10 transition-colors">
                    <RotateCcw className="w-3 h-3" /> Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <AddDocModal
        open={!!addModal}
        onClose={() => setAddModal(null)}
        onSave={(data) => { addDocument({ ...data, clientId }); setAddModal(null); }}
        defaultCategory={addModal}
        team={[]}
      />
    </div>
  );
}