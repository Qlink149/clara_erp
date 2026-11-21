import { useState } from 'react';
import { Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Section, Field, InternalBadge } from './DiscoveryField';
import DataSourceCards from './DataSourceCards';

const INFRA_CHIPS = ['On-prem', 'Cloud', 'SaaS', 'Hybrid'];

export default function SectionC({ form, change, flush, markSaved }) {
  const [uploading, setUploading] = useState(false);

  const appendInfra = (chip) => {
    const cur = form.infrastructure_overview || '';
    if (cur.includes(chip)) return;
    change('infrastructure_overview', cur ? `${cur}, ${chip}` : chip);
    flush();
  };

  const uploadSample = async (file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    change('sample_data_file', file_url);
    flush();
    setUploading(false);
  };

  return (
    <Section id="sec-c" title="Section C — Inputs & Data Readiness">
      <Field form={form} k="trigger" label="Trigger — what starts one cycle (C1)" change={change} flush={flush} />
      <DataSourceCards formId={form.id} markSaved={markSaved} />
      <div>
        <Field form={form} k="infrastructure_overview" label="Infrastructure overview (C3)" type="textarea" rows={2} change={change} flush={flush} />
        <div className="flex items-center gap-1.5 mt-1.5">
          {INFRA_CHIPS.map(c => (
            <button key={c} onClick={() => appendInfra(c)} className="text-[10px] px-2 py-0.5 rounded-full border border-cyan-500/25 text-cyan-400 hover:bg-cyan-500/10">+ {c}</button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-6 flex-wrap rounded-lg bg-amber-500/[0.07] border border-amber-500/15 p-3">
        <div className="flex items-center gap-2">
          <input type="checkbox" id="sample-data" checked={!!form.sample_data_received} onChange={e => { change('sample_data_received', e.target.checked); flush(); }} className="w-4 h-4" />
          <label htmlFor="sample-data" className="text-xs text-muted-foreground cursor-pointer">Sample data received (C4)</label>
        </div>
        <label className="flex items-center gap-2 text-xs text-cyan-400 cursor-pointer hover:text-cyan-300">
          <Upload className="w-3.5 h-3.5" />
          {uploading ? 'Uploading...' : form.sample_data_file ? 'Replace sample file' : 'Upload sample file'}
          <InternalBadge />
          <input type="file" className="hidden" onChange={e => e.target.files[0] && uploadSample(e.target.files[0])} />
        </label>
        {form.sample_data_file && <a href={form.sample_data_file} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground underline">View file</a>}
      </div>
    </Section>
  );
}