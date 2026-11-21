import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Save, Building2 } from 'lucide-react';
import { loadSettings, saveSettings } from '@/lib/invoiceUtils';

export default function CompanySettingsTab() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings(base44).then(setForm);
  }, []);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await saveSettings(base44, form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (!form) return <div className="text-center py-16 text-muted-foreground">Loading...</div>;

  const inputCls = "bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 w-full";
  const labelCls = "text-xs text-muted-foreground mb-1 block font-medium";

  return (
    <div className="max-w-2xl space-y-5">
      <div className="card-glass p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Seller / Company Details</h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className={labelCls}>Company Name</label>
            <input value={form.companyName} onChange={e => update('companyName', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Address</label>
            <textarea value={form.companyAddress} onChange={e => update('companyAddress', e.target.value)} rows={3} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>GSTIN/UIN</label>
              <input value={form.companyGSTIN} onChange={e => update('companyGSTIN', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>PAN</label>
              <input value={form.companyPAN} onChange={e => update('companyPAN', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>State Name</label>
              <input value={form.companyStateName} onChange={e => update('companyStateName', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>State Code</label>
              <input value={form.companyStateCode} onChange={e => update('companyStateCode', e.target.value)} className={inputCls} maxLength={2} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" value={form.companyEmail} onChange={e => update('companyEmail', e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      <div className="card-glass p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Invoice Counter</h3>
        <p className="text-xs text-muted-foreground">The next invoice generated will use this number. Changing it here affects all future invoices.</p>
        <div className="w-48">
          <label className={labelCls}>Next Invoice Number</label>
          <input type="number" value={form.invoiceCounter} onChange={e => update('invoiceCounter', parseInt(e.target.value) || 1)} className={inputCls} min={1} />
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 disabled:opacity-60">
        <Save className="w-4 h-4" />
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}