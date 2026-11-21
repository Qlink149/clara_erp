import { useState, useEffect } from 'react';
import { Globe, Plus, Copy, Check, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useClientPortalAdminAccess } from '@/lib/moduleAccess';
import NoAccessState from '@/components/ui/NoAccessState';
import AdminClientManager from '@/components/clientportal/AdminClientManager';
import StartDiscoveryCall from '@/components/clientportal/discovery/StartDiscoveryCall';

export default function ClientPortalAdmin() {
  const canSee = useClientPortalAdminAccess();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [copied, setCopied] = useState(null);
  const [form, setForm] = useState({ client_name: '', login_email: '', login_password: '', portal_slug: '', company_logo_url: '' });

  const load = async () => {
    setLoading(true);
    setClients(await base44.entities.PortalClient.list('-created_date'));
    setLoading(false);
  };
  useEffect(() => { if (canSee) load(); }, [canSee]);

  const addClient = async () => {
    if (!form.client_name || !form.login_email || !form.portal_slug) return;
    await base44.entities.PortalClient.create({
      ...form,
      portal_slug: form.portal_slug.toLowerCase().replace(/[^a-z0-9-]/g, ''),
      login_password: form.login_password || Math.random().toString(36).slice(2, 10),
      is_active: true,
    });
    setForm({ client_name: '', login_email: '', login_password: '', portal_slug: '', company_logo_url: '' });
    setShowAdd(false);
    load();
  };

  const toggleActive = async (c) => {
    await base44.entities.PortalClient.update(c.id, { is_active: !c.is_active });
    setClients(prev => prev.map(x => x.id === c.id ? { ...x, is_active: !c.is_active } : x));
  };

  const copyLink = (c) => {
    navigator.clipboard.writeText(`${window.location.origin}/portal/${c.portal_slug}`);
    setCopied(c.id);
    setTimeout(() => setCopied(null), 1500);
  };

  const updatePassword = async (c) => {
    const pwd = prompt(`New password for ${c.client_name}:`, c.login_password || '');
    if (pwd === null || !pwd.trim()) return;
    await base44.entities.PortalClient.update(c.id, { login_password: pwd.trim() });
    setClients(prev => prev.map(x => x.id === c.id ? { ...x, login_password: pwd.trim() } : x));
  };

  const inputCls = "bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 w-full";

  if (!canSee) return <NoAccessState message="Client Portal administration is restricted. Contact Yogansh to get access." />;

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {selected ? (
        <AdminClientManager portalClient={selected} onBack={() => { setSelected(null); load(); }} />
      ) : (
        <>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Globe className="w-6 h-6 text-primary" />
                Client Portal
              </h1>
              <p className="text-muted-foreground mt-1">Manage client portal access, departments, use cases, meetings and discovery forms</p>
            </div>
            <div className="flex items-center gap-2">
              <StartDiscoveryCall />
              <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90">
                <Plus className="w-4 h-4" /> Add Portal Client
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16 text-muted-foreground">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {clients.map(c => (
                <div key={c.id} className="card-glass card-hover p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground">{c.client_name}</h3>
                    <button onClick={() => toggleActive(c)}
                      className={`text-[9px] font-bold uppercase px-2 py-1 rounded-full border ${c.is_active !== false ? 'badge-green' : 'badge-red'}`}>
                      {c.is_active !== false ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Login: {c.login_email}</div>
                    <div>URL: /portal/{c.portal_slug}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => setSelected(c)} className="flex-1 px-3 py-2 bg-primary/15 text-primary border border-primary/30 rounded-lg text-xs font-medium hover:bg-primary/25">
                      Manage
                    </button>
                    <button onClick={() => copyLink(c)} className="flex items-center gap-1 px-3 py-2 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground">
                      {copied === c.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied === c.id ? 'Copied' : 'Copy Link'}
                    </button>
                    <button onClick={() => updatePassword(c)} className="px-3 py-2 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground">
                      Password
                    </button>
                  </div>
                </div>
              ))}
              {clients.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground text-sm">No portal clients yet. Add one to get started.</div>
              )}
            </div>
          )}

          {showAdd && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="card-glass p-6 w-full max-w-md space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground">Add Portal Client</h3>
                  <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                </div>
                <input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} className={inputCls} placeholder="Client name *" />
                <input value={form.login_email} onChange={e => setForm(f => ({ ...f, login_email: e.target.value }))} className={inputCls} placeholder="Login email *" />
                <input value={form.portal_slug} onChange={e => setForm(f => ({ ...f, portal_slug: e.target.value }))} className={inputCls} placeholder="Portal slug (e.g. kisna) *" />
                <input value={form.login_password} onChange={e => setForm(f => ({ ...f, login_password: e.target.value }))} className={inputCls} placeholder="Password (blank = auto-generate)" />
                <input value={form.company_logo_url} onChange={e => setForm(f => ({ ...f, company_logo_url: e.target.value }))} className={inputCls} placeholder="Logo URL (optional)" />
                <button onClick={addClient} className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90">Create Client</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}