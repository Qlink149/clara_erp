import { useState } from 'react';
import { ArrowLeft, ClipboardList, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import RepeatableRows from '@/components/clientportal/RepeatableRows';
import LiveDiscoveryForm from '@/components/clientportal/discovery/LiveDiscoveryForm';

const UC_STATUSES = ['Discovery', 'Solution Design', 'POC', 'Delivered', 'On Hold'];

export default function AdminUseCaseEditor({ useCase: initial, department, portalClient, onBack, onDeleted }) {
  const [uc, setUc] = useState(initial);
  const [showForm, setShowForm] = useState(false);

  const save = async (key, value) => {
    setUc(prev => ({ ...prev, [key]: value }));
    await base44.entities.PortalUseCase.update(uc.id, { [key]: value });
  };

  const deleteUseCase = async () => {
    if (!confirm('Delete this use case and all its data?')) return;
    await base44.entities.PortalUseCase.delete(uc.id);
    onDeleted();
  };

  if (showForm) {
    return <LiveDiscoveryForm useCase={uc} department={department} portalClient={portalClient} onClose={() => setShowForm(false)} />;
  }

  const inputCls = "bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 w-full";
  const labelCls = "text-xs text-muted-foreground mb-1 block font-medium";

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground"><ArrowLeft className="w-4 h-4" /></button>
          <div>
            <h2 className="text-lg font-bold text-foreground">{uc.process_name}</h2>
            <p className="text-xs text-muted-foreground">{department?.department_name} · {portalClient?.client_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90">
            <ClipboardList className="w-4 h-4" /> 📝 Open Discovery Form
          </button>
          <button onClick={deleteUseCase} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Client-visible fields */}
      <div className="card-glass p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400">Post-Discovery — Use Case Summary (Client-Visible)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelCls}>Process Name</label><input defaultValue={uc.process_name} onBlur={e => save('process_name', e.target.value)} className={inputCls} /></div>
          <div>
            <label className={labelCls}>Status</label>
            <select value={uc.status || 'Discovery'} onChange={e => save('status', e.target.value)} className={inputCls}>
              {UC_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="md:col-span-2"><label className={labelCls}>Problem Statement (one-liner, G1)</label><textarea defaultValue={uc.problem_statement} onBlur={e => save('problem_statement', e.target.value)} rows={2} className={inputCls} /></div>
          <div className="md:col-span-2"><label className={labelCls}>Solution Statement (one-liner, G5)</label><textarea defaultValue={uc.solution_statement} onBlur={e => save('solution_statement', e.target.value)} rows={2} className={inputCls} /></div>
          <div><label className={labelCls}>Demo Link</label><input defaultValue={uc.demo_link} onBlur={e => save('demo_link', e.target.value)} className={inputCls} placeholder="https://..." /></div>
          <div><label className={labelCls}>Automation Type (G3 — Rules / ML / GenAI / hybrid)</label><input defaultValue={uc.automation_type} onBlur={e => save('automation_type', e.target.value)} className={inputCls} /></div>
          <div className="md:col-span-2">
            <label className={labelCls}>Process Diagram (client-visible)</label>
            {uc.process_diagram_url && (
              <img src={uc.process_diagram_url} alt="Process diagram" className="w-full max-w-xl rounded-xl border border-border mb-2" />
            )}
            <input type="file" accept="image/*" onChange={async e => {
              const file = e.target.files?.[0];
              if (!file) return;
              const { file_url } = await base44.integrations.Core.UploadFile({ file });
              save('process_diagram_url', file_url);
            }} className="text-xs text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Internal-only Section G */}
      <div className="p-5 rounded-2xl space-y-4 border border-amber-500/30" style={{ background: 'rgba(245,158,11,0.05)' }}>
        <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400">Clara Internal — Not visible to client</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelCls}>Suitability / ROI Score (G4)</label><input type="number" defaultValue={uc.suitability_score} onBlur={e => save('suitability_score', parseFloat(e.target.value) || 0)} className={inputCls} /></div>
          <div><label className={labelCls}>ECRS Recommendations (G2)</label><input defaultValue={uc.ecrs_recommendations} onBlur={e => save('ecrs_recommendations', e.target.value)} className={inputCls} placeholder="Eliminate / Combine / Rearrange / Simplify" /></div>
          <div className="md:col-span-2"><label className={labelCls}>Demo Prompt (G6) — the prompt used to build the demo</label><textarea defaultValue={uc.demo_prompt} onBlur={e => save('demo_prompt', e.target.value)} rows={5} className={inputCls} /></div>
        </div>
      </div>

      {/* Meetings */}
      <div className="card-glass p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400">Meetings</h3>
        <RepeatableRows
          entityName="PortalMeeting" parentField="use_case_id" parentId={uc.id}
          addLabel="Add Meeting"
          columns={[
            { key: 'meeting_title', label: 'Title', width: 140 },
            { key: 'meeting_date', label: 'Date', type: 'date' },
            { key: 'meeting_type', label: 'Type', type: 'select', options: ['Discovery', 'Follow-up', 'Demo', 'Review', 'Handover'] },
            { key: 'status', label: 'Status', type: 'select', options: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'] },
            { key: 'recording_link', label: 'Recording', width: 130 },
            { key: 'transcript_link', label: 'Transcript', width: 130 },
            { key: 'clara_team_present', label: 'Clara Team', type: 'tags' },
            { key: 'client_attendees', label: 'Client Attendees', type: 'tags' },
            { key: 'notes', label: 'Notes', width: 160 },
          ]}
        />
      </div>

      {/* People */}
      <div className="card-glass p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400">People (Owners / Decision Makers / Stakeholders)</h3>
        <RepeatableRows
          entityName="PortalProcessOwner" parentField="use_case_id" parentId={uc.id}
          addLabel="Add Person"
          columns={[
            { key: 'person_name', label: 'Name' },
            { key: 'role', label: 'Role' },
            { key: 'department', label: 'Department' },
            { key: 'contact', label: 'Contact' },
            { key: 'person_type', label: 'Type', type: 'select', options: ['Process Owner', 'Decision Maker', 'Stakeholder'] },
            { key: 'enters_at_step', label: 'Enters at Step' },
            { key: 'visibility', label: 'Visibility', type: 'select', options: ['Client-visible', 'Internal-only'] },
          ]}
        />
      </div>
    </div>
  );
}