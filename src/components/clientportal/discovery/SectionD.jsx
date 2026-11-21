import RepeatableRows from '@/components/clientportal/RepeatableRows';
import { Section, Field } from './DiscoveryField';
import StepsEditor from './StepsEditor';

export default function SectionD({ form, change, flush, onStepsChange, onExceptionsChange, markSaved }) {
  return (
    <Section id="sec-d" title="Section D — Process Steps (As-Is)" subtitle="The core of the meeting — the diagram on the right draws itself as you add steps">
      <StepsEditor formId={form.id} onRowsChange={onStepsChange} markSaved={markSaved} />
      <RepeatableRows
        entityName="PortalException" parentField="form_id" parentId={form.id}
        title="Exceptions & Special Cases (D3)" addLabel="Add Another Exception"
        onRowsChange={onExceptionsChange}
        columns={[
          { key: 'condition', label: 'Condition', width: 200 },
          { key: 'current_handling', label: 'Current Handling', width: 240 },
        ]}
      />
      <RepeatableRows
        entityName="PortalEscalationMatrix" parentField="form_id" parentId={form.id}
        title="Communication & Escalation Matrix (D4)" addLabel="Add Another Rule"
        columns={[
          { key: 'event', label: 'Event', width: 150 },
          { key: 'who_informed', label: 'Who is Informed' },
          { key: 'channel', label: 'Channel' },
          { key: 'who_must_not_be_informed', label: 'Who must NOT be informed', width: 170, tdClass: 'border-l-2 border-red-500/40 pl-2' },
        ]}
      />
      <Field form={form} k="workarounds" label="Current workarounds / manual scripts (D5)" type="textarea" rows={3} change={change} flush={flush} />
    </Section>
  );
}