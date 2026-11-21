import { useState, useEffect } from 'react';
import { Plus, Link, Copy, Trash2, X, Check, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';

const ASSET_TYPES = ['GitHub Repo', 'Live Website', 'Admin Dashboard', 'API Docs', 'Design File', 'Database', 'Hosting Account', 'Domain Registrar', 'Cloud Storage', 'Other'];

const TYPE_COLORS = {
  'GitHub Repo': 'badge-gray',
  'Live Website': 'badge-green',
  'Admin Dashboard': 'badge-cyan',
  'API Docs': 'badge-blue',
  'Design File': 'badge-violet',
  'Database': 'badge-amber',
  'Hosting Account': 'badge-cyan',
  'Domain Registrar': 'badge-amber',
  'Cloud Storage': 'badge-blue',
  'Other': 'badge-gray',
};

const EMPTY_FORM = { assetType: 'GitHub Repo', assetTypeCustom: '', label: '', url: '', accountUsername: '', notes: '' };

export default function DigitalAssets({ clientId, isAdmin, onDataChange }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const load = async () => {
    setLoading(true);
    const a = await base44.entities.ClientAsset.filter({ clientId });
    setAssets(a.sort((a, b) => a.assetType?.localeCompare(b.assetType)));
    setLoading(false);
  };

  useEffect(() => { load(); }, [clientId]);

  const handleSave = async () => {
    if (!form.label.trim()) return;
    setSaving(true);
    await base44.entities.ClientAsset.create({ ...form, clientId });
    setForm(EMPTY_FORM);
    setShowForm(false);
    await load();
    onDataChange?.();
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this asset?')) return;
    await base44.entities.ClientAsset.delete(id);
    await load();
    onDataChange?.();
  };

  const handleCopy = (id, url) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Group by type
  const grouped = assets.reduce((acc, a) => {
    const key = a.assetType === 'Other' && a.assetTypeCustom ? a.assetTypeCustom : (a.assetType || 'Other');
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{assets.length} asset{assets.length !== 1 ? 's' : ''}</p>
        {isAdmin && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/15 text-primary border border-primary/25 rounded-lg text-xs font-medium hover:bg-primary/25 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Asset
          </button>
        )}
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card-glass p-4 space-y-3 border border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">New Asset / Link</span>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground hover:text-foreground" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Asset Type</label>
              <select value={form.assetType} onChange={e => setForm(f => ({ ...f, assetType: e.target.value }))} className="w-full px-3 py-1.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50">
                {ASSET_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              {form.assetType === 'Other' && (
                <input value={form.assetTypeCustom} onChange={e => setForm(f => ({ ...f, assetTypeCustom: e.target.value }))} placeholder="Specify type…" className="mt-1 w-full px-3 py-1.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50" />
              )}
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Label / Name *</label>
              <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Kisna WhatsApp Bot — GitHub" className="w-full px-3 py-1.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground block mb-1">URL / Link</label>
              <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://…" className="w-full px-3 py-1.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Account / Username (optional)</label>
              <input value={form.accountUsername} onChange={e => setForm(f => ({ ...f, accountUsername: e.target.value }))} placeholder="For reference only" className="w-full px-3 py-1.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Access Notes (no passwords)</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. Access via Vercel team…" className="w-full px-3 py-1.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.label.trim()} className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Asset'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
      ) : assets.length === 0 ? (
        <div className="card-glass p-8 text-center">
          <Link className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No assets yet{isAdmin ? ' — add one above' : ''}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([type, items]) => (
            <div key={type}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">{type}</p>
              <div className="space-y-2">
                {items.map(asset => (
                  <div key={asset.id} className="card-glass p-3 flex items-start gap-3 group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground">{asset.label}</span>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', TYPE_COLORS[asset.assetType] || 'badge-gray')}>{type}</span>
                      </div>
                      {asset.url && (
                        <a href={asset.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 mt-0.5 text-xs text-primary hover:underline truncate max-w-sm">
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{asset.url}</span>
                        </a>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
                        {asset.accountUsername && <span>👤 {asset.accountUsername}</span>}
                        {asset.notes && <span className="truncate">{asset.notes}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {asset.url && (
                        <button onClick={() => handleCopy(asset.id, asset.url)} className="p-1.5 rounded-lg hover:bg-primary/15 text-muted-foreground hover:text-primary transition-colors" title="Copy link">
                          {copiedId === asset.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      )}
                      {isAdmin && (
                        <button onClick={() => handleDelete(asset.id)} className="p-1.5 rounded-lg hover:bg-red-500/15 text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}