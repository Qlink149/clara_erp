import { Section, Field, ReminderChip } from './DiscoveryField';

export default function SectionB({ form, change, flush }) {
  return (
    <Section id="sec-b" title="Section B — Time & Volume" subtitle="Weave in as the process is described">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field form={form} k="time_per_cycle" label="Time per cycle (e.g. ~15 min per invoice)" change={change} flush={flush} />
        <Field form={form} k="frequency" label="Frequency (e.g. daily, every Mon & Thu)" change={change} flush={flush} />
        <Field form={form} k="volume_per_cycle" label="Volume per cycle (e.g. ~40 invoices/day)" change={change} flush={flush} />
        <Field form={form} k="people_involved" label="People involved" change={change} flush={flush} />
        <Field form={form} k="monthly_cost_band" label="Monthly cost band" type="select" options={['<₹50K', '₹50K–₹1L', '₹1L–₹3L', '₹3L–₹5L', '₹5L+']} internal change={change} flush={flush} />
        <Field form={form} k="error_rate" label="Error rate (e.g. 1 in 20)" change={change} flush={flush} />
        <Field form={form} k="process_stability" label="Process stability" type="select" options={['Unchanged 12+ months', 'Minor changes', 'Changes often']} internal change={change} flush={flush} />
        <Field form={form} k="seasonality" label="Seasonality (optional)" change={change} flush={flush} />
      </div>
      <ReminderChip>Ask casually as each step is described, not as a separate interrogation.</ReminderChip>
    </Section>
  );
}