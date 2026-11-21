import { useState, useEffect } from 'react';
import { Headset, X, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import LiveDiscoveryForm from './LiveDiscoveryForm';

// "Start Discovery Call" — pick a use case, launch the live form
export default function StartDiscoveryCall() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (!open || items) return;
    (async () => {
      const [ucs, depts, clients] = await Promise.all([
        base44.entities.PortalUseCase.list('-created_date', 500),
        base44.entities.PortalDepartment.list('-created_date', 500),
        base44.entities.PortalClient.list(),
      ]);
      setItems(ucs.map(uc => {
        const dept = depts.find(d => d.id === uc.department_id);
        const client = clients.find(c => c.id === dept?.portal_client_id);
        return { uc, dept, client };
      }));
    })();
  }, [open, items]);

  if (active) {
    return <LiveDiscoveryForm useCase={active.uc} department={active.dept} portalClient={active.client} onClose={() => { setActive(null); setOpen(false); }} />;
  }

  const filtered = (items || []).filter(({ uc, dept, client }) =>
    [uc.process_name, dept?.department_name, client?.client_name].filter(Boolean).join(' ').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2 btn-cyber rounded-xl font-medium text-sm">
        <Headset className="w-4 h-4" /> Start Discovery Call
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card-glass p-5 w-full max-w-lg space-y-3 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">Start Discovery Call</h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
                className="bg-input border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 w-full"
                placeholder="Search use case, department or client..." />
            </div>
            <div className="overflow-y-auto flex-1 space-y-1.5">
              {!items ? (
                <p className="text-xs text-muted-foreground text-center py-6">Loading use cases...</p>
              ) : filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No use cases found.</p>
              ) : filtered.map(item => (
                <button key={item.uc.id} onClick={() => setActive(item)}
                  className="w-full text-left p-3 rounded-xl border border-border hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all">
                  <div className="text-sm font-medium text-foreground">{item.uc.process_name}</div>
                  <div className="text-[11px] text-muted-foreground">{item.client?.client_name} · {item.dept?.department_name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}