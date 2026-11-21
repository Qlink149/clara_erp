import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, ChevronRight, Pencil } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const DEPT_STATUSES = ['Discovery', 'In Progress', 'Delivered', 'On Hold'];
const UC_BADGE = {
  'Discovery': 'badge-cyan',
  'Solution Design': 'badge-violet',
  'POC': 'badge-amber',
  'Delivered': 'badge-green',
  'On Hold': 'badge-gray',
};

export default function AdminDeptDetail({ dept, useCases, meetings, onBack, onOpenUseCase, onUpdate, onDelete, onReload }) {
  const [editing, setEditing] = useState(false);
  const [newUCName, setNewUCName] = useState('');

  const deptUCs = useCases.filter(u => u.department_id === dept.id);
  const ucIds = new Set(deptUCs.map(u => u.id));
  const completedMeetings = meetings.filter(m => ucIds.has(m.use_case_id) && m.status === 'Completed').length;

  const addUseCase = async () => {
    if (!newUCName) return;
    await base44.entities.PortalUseCase.create({ department_id: dept.id, process_name: newUCName, status: 'Discovery' });
    setNewUCName('');
    onReload();
  };

  const inputCls = "bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 w-full";
  const labelCls = "text-xs text-muted-foreground mb-1 block font-medium";

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground"><ArrowLeft className="w-4 h-4" /></button>
          <div>
            <h2 className="text-lg font-bold text-foreground">{dept.department_name}</h2>
            <p className="text-xs text-muted-foreground">
              {dept.section_group || 'Unsectioned'}
              {dept.employee_count > 0 ? ` · ${dept.employee_count} employees` : ''}
              {dept.head ? ` · ${dept.head}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(e => !e)} className="brand-button-ghost flex items-center gap-1.5 px-4 py-2 text-xs font-medium">
            <Pencil className="w-3.5 h-3.5" /> {editing ? 'Close Editor' : 'Edit Department'}
          </button>
          <button onClick={() => onDelete(dept.id)} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Department info */}
      {dept.department_description && !editing && (
        <p className="text-sm text-muted-foreground max-w-2xl">{dept.department_description}</p>
      )}

      {/* Edit form — only when explicitly opened */}
      {editing && (
        <div className="card-glass p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400">Edit Department</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelCls}>Department Name</label><input defaultValue={dept.department_name} onBlur={e => onUpdate(dept.id, { department_name: e.target.value })} className={inputCls} /></div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={dept.status || 'Discovery'} onChange={e => onUpdate(dept.id, { status: e.target.value })} className={inputCls}>
                {DEPT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Section Group</label><input defaultValue={dept.section_group} onBlur={e => onUpdate(dept.id, { section_group: e.target.value })} className={inputCls} placeholder="e.g. Sales & Retail Channels" /></div>
            <div><label className={labelCls}>Employee Count</label><input type="number" defaultValue={dept.employee_count} onBlur={e => onUpdate(dept.id, { employee_count: parseFloat(e.target.value) || 0 })} className={inputCls} /></div>
            <div><label className={labelCls}>Department Head</label><input defaultValue={dept.head} onBlur={e => onUpdate(dept.id, { head: e.target.value })} className={inputCls} /></div>
            <div><label className={labelCls}>Key Systems</label><input defaultValue={dept.key_systems} onBlur={e => onUpdate(dept.id, { key_systems: e.target.value })} className={inputCls} /></div>
            <div className="md:col-span-2"><label className={labelCls}>Works Closely With</label><input defaultValue={dept.works_closely_with} onBlur={e => onUpdate(dept.id, { works_closely_with: e.target.value })} className={inputCls} /></div>
            <div className="md:col-span-2"><label className={labelCls}>Description</label><textarea defaultValue={dept.department_description} onBlur={e => onUpdate(dept.id, { department_description: e.target.value })} rows={2} className={inputCls} /></div>
          </div>
        </div>
      )}

      {/* Use cases */}
      <div className="card-glass p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400">Use Cases</h3>
          <span className="text-[10px] text-muted-foreground">{completedMeetings} meeting{completedMeetings !== 1 ? 's' : ''} completed</span>
        </div>
        <div className="space-y-2">
          {deptUCs.map(u => (
            <button key={u.id} onClick={() => onOpenUseCase(u)}
              className="w-full p-3 rounded-xl border border-border hover:border-cyan-500/30 text-left transition-all flex items-center justify-between gap-2 bg-white/60">
              <div className="min-w-0">
                <div className="font-medium text-sm text-foreground truncate">{u.process_name}</div>
                <div className="text-[10px] text-muted-foreground truncate">{u.problem_statement || 'No problem statement yet'}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${UC_BADGE[u.status] || 'badge-gray'}`}>{u.status || 'Discovery'}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </button>
          ))}
          {deptUCs.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No use cases yet</p>}
        </div>
        <div className="flex items-center gap-2">
          <input value={newUCName} onChange={e => setNewUCName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addUseCase()} className={`${inputCls} flex-1`} placeholder="New process / use case name..." />
          <button onClick={addUseCase} className="flex items-center gap-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium"><Plus className="w-3.5 h-3.5" /> Add</button>
        </div>
      </div>
    </div>
  );
}