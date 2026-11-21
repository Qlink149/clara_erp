import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { inputCls, InternalBadge } from './DiscoveryField';

const OPTS = {
  system: ['ERP', 'CRM', 'POS', 'Database', 'Spreadsheet on server', 'Cloud spreadsheet', 'Messaging app', 'Email', 'Paper', 'Verbal', 'Other'],
  format: ['API', 'Database', 'Excel-CSV', 'PDF', 'Images', 'Free text', 'Verbal'],
  structure: ['Fixed rows & columns', 'Semi-structured', 'Freehand'],
  data_cleanliness: ['Clean', 'Needs cleaning', 'Unknown'],
  access_method: ['API available', 'Export only', 'Manual download', 'No direct access'],
};

// Data input sources as repeatable card blocks (Section C2)
export default function DataSourceCards({ formId, markSaved }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!formId) return;
    base44.entities.PortalDataSource.filter({ form_id: formId }).then(setRows);
  }, [formId]);

  const addRow = async () => {
    const created = await base44.entities.PortalDataSource.create({ form_id: formId });
    setRows(prev => [...prev, created]);
  };
  const updateLocal = (id, key, val) => setRows(prev => prev.map(r => r.id === id ? { ...r, [key]: val } : r));
  const save = async (id, key, val) => { await base44.entities.PortalDataSource.update(id, { [key]: val }); markSaved && markSaved(); };
  const commit = (id, key, val) => { updateLocal(id, key, val); save(id, key, val); };
  const removeRow = async (id) => {
    await base44.entities.PortalDataSource.delete(id);
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const Select = ({ row, k, label, internal }) => (
    <div className={internal ? 'rounded-lg bg-amber-500/[0.07] border border-amber-500/15 p-1.5' : ''}>
      <label className="text-[10px] text-muted-foreground block mb-0.5">{label}{internal && <InternalBadge />}</label>
      <select value={row[k] || ''} onChange={e => commit(row.id, k, e.target.value)} className={`${inputCls} text-xs py-1.5`}>
        <option value="">—</option>
        {OPTS[k].map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Data Input Sources (C2)</h4>
      {rows.map(row => (
        <div key={row.id} className="p-3 rounded-xl border border-border bg-secondary/20 space-y-2">
          <div className="flex items-start gap-2">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Source name</label>
                <input value={row.source_name ?? ''} onChange={e => updateLocal(row.id, 'source_name', e.target.value)} onBlur={e => save(row.id, 'source_name', e.target.value)} className={`${inputCls} text-xs py-1.5`} placeholder="e.g. Kisna Force" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Owning team</label>
                <input value={row.owning_team ?? ''} onChange={e => updateLocal(row.id, 'owning_team', e.target.value)} onBlur={e => save(row.id, 'owning_team', e.target.value)} className={`${inputCls} text-xs py-1.5`} placeholder="e.g. IT" />
              </div>
            </div>
            <button onClick={() => removeRow(row.id)} className="pt-4 text-muted-foreground hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <Select row={row} k="system" label="System" />
            <Select row={row} k="format" label="Format" />
            <Select row={row} k="structure" label="Structure" />
            <Select row={row} k="data_cleanliness" label="Cleanliness" />
            <Select row={row} k="access_method" label="Access" internal />
          </div>
        </div>
      ))}
      <button onClick={addRow} className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300">
        <Plus className="w-3.5 h-3.5" /> Add Another Source
      </button>
    </div>
  );
}