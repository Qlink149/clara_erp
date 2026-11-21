import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useStore } from '@/lib/StoreContext';

export default function AddClientModal({ open, onClose }) {
  const { addCurrentClient, addUpcomingClient } = useStore();
  const [type, setType] = useState('current');
  const [form, setForm] = useState({ name: '', industry: '', contactName: '', contactDesignation: '', contactPhone: '', contactEmail: '', pipelineStage: 'Lead', source: 'Referral' });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.name) return;
    if (type === 'current') {
      addCurrentClient({
        name: form.name,
        status: 'On Track',
        industry: form.industry,
        primaryContact: { name: form.contactName, designation: form.contactDesignation, phone: form.contactPhone, email: form.contactEmail },
        billingStatus: 'Pending',
        projectStartDate: new Date().toISOString().split('T')[0],
        pendingItems: [],
        activityLog: [],
        communication: { lastCallDate: null, lastSummary: '', nextFollowUp: null, platform: 'WhatsApp' },
        assignedTeam: [],
        tags: [],
        internalNotes: '',
      });
    } else {
      addUpcomingClient({
        name: form.name,
        pipelineStage: form.pipelineStage,
        source: form.source,
        primaryContact: { name: form.contactName, designation: form.contactDesignation, phone: form.contactPhone, email: form.contactEmail },
        assignedSales: 'sidharth',
        nextAction: '',
        nextActionDate: null,
        notes: '',
      });
    }
    onClose();
    setForm({ name: '', industry: '', contactName: '', contactDesignation: '', contactPhone: '', contactEmail: '', pipelineStage: 'Lead', source: 'Referral' });
  };

  return (
    <Modal open={open} onClose={onClose} title="Add New Client" size="md">
      <div className="space-y-4">
        <div className="flex gap-2">
          {['current', 'upcoming'].map((t) => (
            <button key={t} onClick={() => setType(t)} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${type === t ? 'bg-primary/15 text-primary border-primary/30' : 'bg-secondary text-muted-foreground border-border'}`}>
              {t === 'current' ? 'Current Client' : 'Upcoming Lead'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-medium text-muted-foreground block mb-1">Company Name *</label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" />
          </div>
          {type === 'current' && (
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground block mb-1">Industry</label>
              <input value={form.industry} onChange={(e) => set('industry', e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" />
            </div>
          )}
          {type === 'upcoming' && (
            <>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Stage</label>
                <select value={form.pipelineStage} onChange={(e) => set('pipelineStage', e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none">
                  {['Lead', 'Proposal Sent', 'Negotiation', 'Contract Review', 'Closing'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Source</label>
                <select value={form.source} onChange={(e) => set('source', e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none">
                  {['Referral', 'LinkedIn', 'Cold Outreach', 'Inbound', 'Other'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </>
          )}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Contact Name</label>
            <input value={form.contactName} onChange={(e) => set('contactName', e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Designation</label>
            <input value={form.contactDesignation} onChange={(e) => set('contactDesignation', e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Phone</label>
            <input value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Email</label>
            <input value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" />
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Add Client</button>
        </div>
      </div>
    </Modal>
  );
}