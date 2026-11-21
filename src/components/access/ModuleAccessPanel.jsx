import { useState, useEffect } from 'react';
import { Shield, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { setModuleAccess, getModuleAccessRecords } from '@/lib/moduleAccess';
import { MODULE_INVOICE, MODULE_KPI_VIEW_OWN, MODULE_PROFORMA, MODULE_DOCS_EDIT, MODULE_CLIENT_PORTAL, INVOICE_ACCESS_EMAILS, SUPER_ADMIN_EMAILS } from '@/lib/constants';
import { useStore } from '@/lib/StoreContext';

const MODULE_LABELS = {
  [MODULE_INVOICE]: 'Invoice Calendar',
  [MODULE_PROFORMA]: 'Proforma Invoices',
  [MODULE_KPI_VIEW_OWN]: 'KPI Tracker (View Own KPIs)',
  [MODULE_DOCS_EDIT]: 'Documentation (Edit Access)',
  [MODULE_CLIENT_PORTAL]: 'Client Portal (Admin)',
};

export default function ModuleAccessPanel() {
  const { team } = useStore();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  const load = async () => {
    setLoading(true);
    const recs = await getModuleAccessRecords();
    setRecords(recs);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const isGranted = (email, module) => {
    if (SUPER_ADMIN_EMAILS.includes(email)) return true;
    if ((module === MODULE_INVOICE || module === MODULE_PROFORMA) && INVOICE_ACCESS_EMAILS.some(e => e.toLowerCase() === email?.toLowerCase())) return true;
    const rec = records.find(r => r.email === email && r.module === module);
    return rec?.is_granted || false;
  };

  const toggle = async (email, module) => {
    const current = isGranted(email, module);
    if (SUPER_ADMIN_EMAILS.includes(email)) return;
    setSaving(`${email}:${module}`);
    await setModuleAccess(email, module, !current);
    await load();
    setSaving(null);
  };

  const members = team.filter(m => m.email);

  return (
    <div className="card-glass p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-primary" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/70">Module Access Controls</span>
      </div>
      <p className="text-xs text-muted-foreground">Control which team members can access specific modules. Admin (Yogansh) always has full access.</p>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Team Member</th>
                {Object.entries(MODULE_LABELS).map(([mod, label]) => (
                  <th key={mod} className="text-left py-2 px-3 text-muted-foreground font-semibold">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map(member => (
                <tr key={member.id} className="border-b border-border/50">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold', `bg-${member.color || 'cyan'}-500/20 text-${member.color || 'cyan'}-300`)}>{member.avatar}</div>
                      <div>
                        <span className="font-medium text-foreground">{member.name}</span>
                        <span className="ml-2 text-muted-foreground">{member.email}</span>
                      </div>
                    </div>
                  </td>
                  {Object.keys(MODULE_LABELS).map(mod => {
                    const granted = isGranted(member.email, mod);
                    const isSaving = saving === `${member.email}:${mod}`;
                    return (
                      <td key={mod} className="py-2.5 px-3">
                        <button
                          onClick={() => toggle(member.email, mod)}
                          disabled={isSaving}
                          className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-all', granted ? 'bg-green-500/15 text-green-400 border-green-500/25' : 'bg-secondary text-muted-foreground border-border hover:text-foreground')}
                        >
                          {granted ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                          {isSaving ? '...' : granted ? 'Granted' : 'Revoked'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {members.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">No team members with emails found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}