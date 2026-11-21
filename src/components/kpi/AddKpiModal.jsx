import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { base44 } from '@/api/base44Client';

export default function AddKpiModal({ open, onClose, team, onSaved }) {
  const [form, setForm] = useState({ teamMemberId: '', name: '', description: '', targetType: 'number', targetValue: '', frequency: 'Monthly', weightage: '10' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.teamMemberId || !form.name) return;
    setSaving(true);
    await base44.entities.KPI.create({ ...form, targetValue: parseFloat(form.targetValue) || null, weightage: parseFloat(form.weightage) || 10, isActive: true });
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add KPI" size="md">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Team Member *</label>
          <select value={form.teamMemberId} onChange={e => set('teamMemberId', e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none">
            <option value="">Select member...</option>
            {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">KPI Name *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Tasks completed on time" className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Description</label>
          <input value={form.description} onChange={e => set('description', e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Target Type</label>
            <select value={form.targetType} onChange={e => set('targetType', e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none">
              <option value="number">Number</option>
              <option value="yes_no">Yes / No</option>
            </select>
          </div>
          {form.targetType === 'number' && (
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Target Value</label>
              <input type="number" value={form.targetValue} onChange={e => set('targetValue', e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none" />
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Frequency</label>
            <select value={form.frequency} onChange={e => set('frequency', e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none">
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Weightage (%)</label>
            <input type="number" value={form.weightage} onChange={e => set('weightage', e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none" />
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-secondary text-sm font-medium">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.teamMemberId || !form.name} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {saving ? 'Saving...' : 'Add KPI'}
          </button>
        </div>
      </div>
    </Modal>
  );
}