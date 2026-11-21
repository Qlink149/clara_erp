import { useState, useEffect } from 'react';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import PortalFormField from '@/components/clientportal/publicform/PortalFormField';
import PortalRowsEditor from '@/components/clientportal/publicform/PortalRowsEditor';

function Section({ title, children }) {
  return (
    <div className="card-glass p-5 space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400">{title}</h3>
      {children}
    </div>
  );
}

// Client-facing discovery form — every save goes through the portalClientMutate backend function.
export default function PortalDiscoveryForm({ data, useCase, mutate, onBack }) {
  const [form, setForm] = useState(null);
  const [steps, setSteps] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await mutate({ action: 'ensureForm', use_case_id: useCase.id });
        setForm(res.form);
        setSteps(data.steps.filter(s => s.form_id === res.form.id).sort((a, b) => (a.step_number || 0) - (b.step_number || 0)));
        setExceptions(data.exceptions.filter(e => e.form_id === res.form.id));
      } catch {
        setError('Could not load the discovery form. Please try again.');
      }
    })();
  }, [useCase.id]);

  const run = async (fn) => {
    setSaving(true);
    try { await fn(); } catch { setError('A change could not be saved. Please check your connection.'); }
    setSaving(false);
  };

  const save = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    run(() => mutate({ action: 'updateForm', form_id: form.id, patch: { [k]: v } }));
  };

  const rowHandlers = (entity, rows, setRows, defaults = () => ({})) => ({
    onAdd: () => run(async () => {
      const res = await mutate({ action: 'rowOp', entity, op: 'create', form_id: form.id, patch: defaults() });
      setRows(prev => [...prev, res.row]);
    }),
    onUpdate: (id, key, val) => {
      setRows(prev => prev.map(r => r.id === id ? { ...r, [key]: val } : r));
      run(() => mutate({ action: 'rowOp', entity, op: 'update', form_id: form.id, row_id: id, patch: { [key]: val } }));
    },
    onDelete: (id) => run(async () => {
      await mutate({ action: 'rowOp', entity, op: 'delete', form_id: form.id, row_id: id });
      setRows(prev => prev.filter(r => r.id !== id));
    }),
  });

  if (error && !form) return <div className="card-glass p-8 text-center text-sm text-red-400">{error}</div>;
  if (!form) return <div className="text-center py-12 text-sm text-muted-foreground">Loading discovery form...</div>;

  const stepHandlers = rowHandlers('step', steps, setSteps, () => ({ step_number: steps.length + 1 }));
  const excHandlers = rowHandlers('exception', exceptions, setExceptions, () => ({}));

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground"><ArrowLeft className="w-4 h-4" /></button>
          <div>
            <h2 className="text-lg font-bold text-foreground">Discovery Form</h2>
            <p className="text-xs text-muted-foreground">{useCase.process_name} — changes save automatically</p>
          </div>
        </div>
        <span className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border ${saving ? 'border-cyan-500/30 text-cyan-400' : 'border-emerald-500/30 text-emerald-400'}`}>
          {saving ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</> : <><Check className="w-3 h-3" /> Saved</>}
        </span>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}

      <Section title="Process Basics">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PortalFormField label="Time per cycle" value={form.time_per_cycle} onSave={v => save('time_per_cycle', v)} placeholder="e.g. 2 hours" />
          <PortalFormField label="Frequency" value={form.frequency} onSave={v => save('frequency', v)} placeholder="e.g. Daily, Weekly" />
          <PortalFormField label="Volume per cycle" value={form.volume_per_cycle} onSave={v => save('volume_per_cycle', v)} placeholder="e.g. 150 orders" />
          <PortalFormField label="People involved" value={form.people_involved} onSave={v => save('people_involved', v)} />
          <PortalFormField label="Error rate" value={form.error_rate} onSave={v => save('error_rate', v)} />
          <PortalFormField label="Seasonality" value={form.seasonality} onSave={v => save('seasonality', v)} />
          <PortalFormField className="md:col-span-2" label="What triggers this process?" type="textarea" value={form.trigger} onSave={v => save('trigger', v)} />
        </div>
      </Section>

      <Section title="Systems & Current Workarounds">
        <PortalFormField label="Systems / infrastructure used" type="textarea" value={form.infrastructure_overview} onSave={v => save('infrastructure_overview', v)} />
        <PortalFormField label="Current workarounds" type="textarea" value={form.workarounds} onSave={v => save('workarounds', v)} />
      </Section>

      <Section title="Process Steps">
        <PortalRowsEditor
          rows={steps} addLabel="Add Step" {...stepHandlers}
          columns={[
            { key: 'step_number', label: '#', type: 'number', width: 50 },
            { key: 'description', label: 'What happens', width: 200 },
            { key: 'owner', label: 'Who does it' },
            { key: 'system_used', label: 'System used' },
            { key: 'approx_time', label: 'Approx. time', width: 90 },
            { key: 'is_pain_point', label: 'Pain point?', type: 'checkbox' },
            { key: 'pain_point_note', label: 'Pain point note', width: 160 },
          ]}
        />
      </Section>

      <Section title="Exceptions & Special Cases">
        <PortalRowsEditor
          rows={exceptions} addLabel="Add Exception" {...excHandlers}
          columns={[
            { key: 'condition', label: 'When does it happen', width: 200 },
            { key: 'current_handling', label: 'How is it handled today', width: 220 },
          ]}
        />
      </Section>

      <Section title="Desired Outcome">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PortalFormField className="md:col-span-2" label="Goal statement" type="textarea" value={form.goal_statement} onSave={v => save('goal_statement', v)} placeholder="What should this look like when it works perfectly?" />
          <PortalFormField label="Desired output type" type="select" options={['Dashboard', 'Report', 'Notification flow', 'Auto-action', 'File', 'Other']} value={form.desired_output_type} onSave={v => save('desired_output_type', v)} />
          <PortalFormField label="Desired output" value={form.desired_output} onSave={v => save('desired_output', v)} />
          <PortalFormField className="md:col-span-2" label="How should it look?" type="textarea" value={form.desired_look} onSave={v => save('desired_look', v)} />
          <PortalFormField label="Must-haves" type="textarea" value={form.must_haves} onSave={v => save('must_haves', v)} />
          <PortalFormField label="Nice-to-haves" type="textarea" value={form.nice_to_haves} onSave={v => save('nice_to_haves', v)} />
          <PortalFormField className="md:col-span-2" label="Success metric" value={form.success_metric} onSave={v => save('success_metric', v)} placeholder="How will we measure success?" />
        </div>
      </Section>
    </div>
  );
}