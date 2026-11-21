import RepeatableRows from '@/components/clientportal/RepeatableRows';
import { Section, Field } from './DiscoveryField';

const SENSITIVITY_FLAGS = ['PII', 'Financial', 'Regulatory'];

export default function SectionF({ form, change, flush }) {
  const hasFlag = f => (form.data_sensitivity || '').includes(`[${f}]`);
  const toggleFlag = f => {
    const cur = form.data_sensitivity || '';
    const next = hasFlag(f) ? cur.replace(`[${f}] `, '').replace(`[${f}]`, '') : `[${f}] ${cur}`;
    change('data_sensitivity', next);
    flush();
  };

  return (
    <Section id="sec-f" title="Section F — Constraints & Adoption" subtitle="Last 5 minutes — rapid-fire">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field form={form} k="integration_boundaries" label="Integration boundaries" internal change={change} flush={flush} />
        <Field form={form} k="approvals_needed" label="Approvals needed + expected time" internal placeholder="e.g. IT sign-off (~2 weeks), Legal review" change={change} flush={flush} />
      </div>
      <RepeatableRows
        entityName="PortalUserGroup" parentField="form_id" parentId={form.id}
        title="User Groups (F3–F5)" addLabel="Add Another Group"
        columns={[
          { key: 'group_name', label: 'Group Name' },
          { key: 'tech_savviness', label: 'Tech-Savviness', type: 'select', options: ['High', 'Medium', 'Low', 'Messaging-app-only'] },
          { key: 'preferred_channel', label: 'Preferred Channel', type: 'select', options: ['Dashboard', 'WhatsApp', 'Email', 'SMS', 'Other'] },
          { key: 'access_level', label: 'Access Level', width: 200 },
        ]}
      />
      <div>
        <Field form={form} k="data_sensitivity" label="Data sensitivity / compliance" internal change={change} flush={flush} />
        <div className="flex items-center gap-3 mt-1.5 pl-2">
          {SENSITIVITY_FLAGS.map(f => (
            <label key={f} className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={hasFlag(f)} onChange={() => toggleFlag(f)} className="w-3.5 h-3.5" />
              {f}
            </label>
          ))}
        </div>
      </div>
      <Field form={form} k="open_questions" label="Open questions / missing data (G7)" type="textarea" rows={3} internal change={change} flush={flush} />
    </Section>
  );
}