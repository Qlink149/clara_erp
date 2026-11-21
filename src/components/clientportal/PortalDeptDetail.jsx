import { useState } from 'react';
import { ArrowLeft, ExternalLink, ChevronRight, Plus } from 'lucide-react';

const UC_BADGE = {
  'Discovery': 'badge-cyan',
  'Solution Design': 'badge-violet',
  'POC': 'badge-amber',
  'Delivered': 'badge-green',
  'On Hold': 'badge-gray',
};

export default function PortalDeptDetail({ data, dept, onBack, onOpenUseCase, onCreateUseCase }) {
  const { useCases, meetings } = data;
  const deptUCs = useCases.filter(u => u.department_id === dept.id);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const create = async () => {
    if (!newName.trim() || creating) return;
    setCreating(true);
    try { await onCreateUseCase(newName.trim()); } finally { setCreating(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground"><ArrowLeft className="w-4 h-4" /></button>
        <div>
          <h2 className="text-xl font-bold text-foreground">{dept.department_name}</h2>
          <p className="text-xs text-muted-foreground">
            {dept.status || 'Discovery'}{dept.employee_count > 0 ? ` · ${dept.employee_count} employees` : ''}
          </p>
        </div>
      </div>
      {dept.department_description && (
        <p className="text-sm text-muted-foreground max-w-2xl">{dept.department_description}</p>
      )}

      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Use Cases</h3>
        {deptUCs.map(uc => {
          const ucMeetings = meetings.filter(m => m.use_case_id === uc.id);
          return (
            <div key={uc.id} className="card-glass card-hover p-5 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <h4 className="font-bold text-foreground">{uc.process_name}</h4>
                  {uc.problem_statement && <p className="text-xs text-muted-foreground mt-1"><span className="text-red-400/80 font-semibold">Problem:</span> {uc.problem_statement}</p>}
                  {uc.solution_statement && <p className="text-xs text-muted-foreground mt-1"><span className="text-emerald-400/80 font-semibold">Solution:</span> {uc.solution_statement}</p>}
                </div>
                <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded-full border flex-shrink-0 ${UC_BADGE[uc.status] || 'badge-gray'}`}>{uc.status || 'Discovery'}</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => onOpenUseCase(uc)} className="flex items-center gap-1 px-3 py-1.5 bg-primary/15 text-primary border border-primary/30 rounded-lg text-xs font-medium hover:bg-primary/25">
                  View Details <ChevronRight className="w-3.5 h-3.5" />
                </button>
                {uc.demo_link && (
                  <a href={uc.demo_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-3 py-1.5 border border-cyan-500/30 text-cyan-400 rounded-lg text-xs font-medium hover:bg-cyan-500/10">
                    View Demo <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <span className="text-[10px] text-muted-foreground">{ucMeetings.length} meeting{ucMeetings.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          );
        })}
        {deptUCs.length === 0 && (
          <div className="card-glass p-8 text-center text-sm text-muted-foreground">No use cases in this department yet — add one below to start discovery.</div>
        )}

        {/* Client can add a new use case — opens the discovery form right away */}
        <div className="card-glass p-4 space-y-2">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Suggest a new use case</h4>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && create()}
              className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 flex-1 min-w-[220px]"
              placeholder="Process name (e.g. Monthly stock reconciliation)..."
            />
            <button onClick={create} disabled={creating || !newName.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:bg-primary/90 disabled:opacity-50">
              <Plus className="w-3.5 h-3.5" /> {creating ? 'Creating...' : 'Add & Start Discovery'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}