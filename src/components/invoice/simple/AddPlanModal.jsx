import { useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { CYCLES } from '@/lib/billingCycles';

const field = 'w-full brand-input rounded-xl px-3 py-2 text-sm';

export default function AddPlanModal({ open, onClose, clients, onSaved }) {
  const [f, setF] = useState({ clientId: '', description: '', amount: '', firstInvoiceDate: format(new Date(), 'yyyy-MM-dd'), billingCycle: 'Monthly', gstApplicable: true });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const valid = f.clientId && f.description && Number(f.amount) > 0 && f.firstInvoiceDate;

  const save = async () => {
    setSaving(true);
    await base44.entities.InvoiceSchedule.create({ ...f, amount: Number(f.amount), isActive: true });
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add billing plan</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <label className="block text-xs font-medium text-muted-foreground">Client
            <select className={field} value={f.clientId} onChange={e => set('clientId', e.target.value)}>
              <option value="">Select client…</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="block text-xs font-medium text-muted-foreground">Engagement (invoice title)
            <input className={field} placeholder="e.g. AI automation retainer" value={f.description} onChange={e => set('description', e.target.value)} />
          </label>
          <label className="block text-xs font-medium text-muted-foreground">Amount per invoice (₹)
            <input type="number" className={field} value={f.amount} onChange={e => set('amount', e.target.value)} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-muted-foreground">Engagement date
              <input type="date" className={field} value={f.firstInvoiceDate} onChange={e => set('firstInvoiceDate', e.target.value)} />
            </label>
            <label className="block text-xs font-medium text-muted-foreground">Bill every
              <select className={field} value={f.billingCycle} onChange={e => set('billingCycle', e.target.value)}>
                {Object.keys(CYCLES).map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={f.gstApplicable} onChange={e => set('gstApplicable', e.target.checked)} /> GST applicable
          </label>
          <p className="text-xs text-muted-foreground">The first invoice is due on the engagement date, then repeats every cycle.</p>
          <button disabled={!valid || saving} onClick={save} className="brand-button w-full py-2.5 text-sm disabled:opacity-50">
            {saving ? 'Saving…' : 'Save plan'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}