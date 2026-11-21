import { useState } from 'react';
import { Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Section, Field } from './DiscoveryField';

export default function SectionE({ form, change, flush }) {
  const [uploading, setUploading] = useState(false);

  const uploadRef = async (file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    change('desired_look_file', file_url);
    flush();
    setUploading(false);
  };

  return (
    <Section id="sec-e" title="Section E — Outcome Definition" subtitle="Closing 15 minutes">
      <Field form={form} k="goal_statement" label="Goal statement (client's own words)" type="textarea" rows={3} change={change} flush={flush} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field form={form} k="desired_output_type" label="Desired output type" type="select" options={['Dashboard', 'Report', 'Notification flow', 'Auto-action', 'File', 'Other']} change={change} flush={flush} />
        <Field form={form} k="desired_output" label="Desired output details" change={change} flush={flush} />
      </div>
      <Field form={form} k="desired_look" label="What should the final product look like?" type="textarea" rows={2} change={change} flush={flush} />
      <label className="flex items-center gap-2 text-xs text-cyan-400 cursor-pointer hover:text-cyan-300 w-fit">
        <Upload className="w-3.5 h-3.5" />
        {uploading ? 'Uploading...' : form.desired_look_file ? 'Replace reference file' : 'Upload reference file (optional)'}
        <input type="file" className="hidden" onChange={e => e.target.files[0] && uploadRef(e.target.files[0])} />
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field form={form} k="accuracy_bar" label="Acceptable accuracy bar" type="select"
          options={['100% deterministic', '95–99%', '85–95% with human review']} internal
          hint="Frame by task type, not error tolerance. Calculation tasks = 100%. Judgment tasks = review-tolerant."
          change={change} flush={flush} />
        <Field form={form} k="success_metric" label="Success metric — 'We'll know it worked when…'" change={change} flush={flush} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field form={form} k="must_haves" label="Must-haves" type="textarea" rows={3} change={change} flush={flush} />
        <Field form={form} k="nice_to_haves" label="Nice-to-haves" type="textarea" rows={3} change={change} flush={flush} />
      </div>
    </Section>
  );
}