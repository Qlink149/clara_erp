import { useState } from 'react';
import { Eye, EyeOff, Plus, Trash2, ExternalLink, X } from 'lucide-react';
import { cn, daysFromToday } from '@/lib/utils';
import { differenceInDays, parseISO, isValid } from 'date-fns';
import { useStore } from '@/lib/StoreContext';
import { InlineTextEdit, InlineSelectEdit, InlineDateEdit } from '@/components/ui/InlineEdit';

const STATUS_OPTIONS = ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'];
const SPRINT_STATUSES = ['Pending', 'Received', 'Overdue'];
const ENV_OPTIONS = ['Production', 'Staging', 'Development'];

function TimelineBar({ startDate, endDate }) {
  if (!startDate || !endDate) return null;
  try {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const today = new Date();
    if (!isValid(start) || !isValid(end)) return null;
    const total = differenceInDays(end, start);
    if (total <= 0) return null;
    const elapsed = differenceInDays(today, start);
    const pct = Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
    const overdue = today > end;
    return (
      <div className="mt-2">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{startDate}</span>
          <span className={overdue ? 'text-amber-400' : ''}>{endDate}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: overdue ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'linear-gradient(90deg,#00d4ff,#0ea5e9)' }} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{pct}% elapsed{overdue ? ' — PAST END DATE' : ''}</p>
      </div>
    );
  } catch { return null; }
}

export default function EngagementDetail({ engagement, clientId, onClose, onUpdate }) {
  const { tasks, team, updateTask } = useStore();
  const [showCreds, setShowCreds] = useState({});

  const engTasks = tasks.filter(t => t.clientId === clientId && t.engagementId === engagement.id);
  const member = team.find(m => m.id === engagement.assigneeId);
  const today = new Date();

  const handleSprint = (i, k, v) => {
    const sprints = [...(engagement.paymentSprints || [])];
    sprints[i] = { ...sprints[i], [k]: v };
    onUpdate({ paymentSprints: sprints });
  };

  const addSprint = () => {
    const sprints = [...(engagement.paymentSprints || []), { id: `ps${Date.now()}`, name: '', amount: '', dueDate: '', status: 'Pending', notes: '', dateAdded: new Date().toISOString().split('T')[0] }];
    onUpdate({ paymentSprints: sprints });
  };

  const removeSprint = (i) => {
    onUpdate({ paymentSprints: (engagement.paymentSprints || []).filter((_, idx) => idx !== i) });
  };

  const updateRepo = (i, k, v) => {
    const repos = [...(engagement.techRequirements?.repos || [])];
    repos[i] = { ...repos[i], [k]: v };
    onUpdate({ techRequirements: { ...engagement.techRequirements, repos } });
  };
  const addRepo = () => {
    const repos = [...(engagement.techRequirements?.repos || []), { id: `repo${Date.now()}`, label: '', url: '', branch: '', notes: '' }];
    onUpdate({ techRequirements: { ...engagement.techRequirements, repos } });
  };
  const removeRepo = (i) => {
    onUpdate({ techRequirements: { ...engagement.techRequirements, repos: (engagement.techRequirements?.repos || []).filter((_, idx) => idx !== i) } });
  };

  const updateCred = (i, k, v) => {
    const credentials = [...(engagement.techRequirements?.credentials || [])];
    credentials[i] = { ...credentials[i], [k]: v };
    onUpdate({ techRequirements: { ...engagement.techRequirements, credentials } });
  };
  const addCred = () => {
    const credentials = [...(engagement.techRequirements?.credentials || []), { id: `cred${Date.now()}`, service: '', label: '', value: '', environment: 'Production', notes: '', dateAdded: new Date().toISOString().split('T')[0] }];
    onUpdate({ techRequirements: { ...engagement.techRequirements, credentials } });
  };
  const removeCred = (i) => {
    onUpdate({ techRequirements: { ...engagement.techRequirements, credentials: (engagement.techRequirements?.credentials || []).filter((_, idx) => idx !== i) } });
  };

  const setDeploy = (k, v) => {
    onUpdate({ techRequirements: { ...engagement.techRequirements, deployment: { ...engagement.techRequirements?.deployment, [k]: v } } });
  };

  const inputCls = 'bg-input border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary/50 w-full';
  const sectionHdr = 'text-xs font-bold uppercase tracking-widest text-cyan-400/70 mb-3';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">{engagement.name}</h2>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-cyan-400 transition-colors"><X className="w-4 h-4" /></button>
      </div>

      {/* Basic Info */}
      <div className="card-glass p-4 space-y-3">
        <p className={sectionHdr}>Basic Info</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <label className="text-xs text-muted-foreground block mb-0.5">Name</label>
            <InlineTextEdit value={engagement.name} onSave={v => onUpdate({ name: v })} className="font-semibold" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-0.5">Status</label>
            <InlineSelectEdit value={engagement.status} options={STATUS_OPTIONS} onSave={v => onUpdate({ status: v })} />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground block mb-0.5">Description</label>
            <InlineTextEdit value={engagement.description} onSave={v => onUpdate({ description: v })} multiline placeholder="Add description..." className="text-sm text-muted-foreground w-full" />
          </div>
        </div>
      </div>

      {/* Assignment */}
      <div className="card-glass p-4 space-y-3">
        <p className={sectionHdr}>Assignment & Contact</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <label className="text-xs text-muted-foreground block mb-0.5">Team Member</label>
            {member ? (
              <div className="flex items-center gap-1.5">
                <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold', `bg-${member.color}-500/20 text-${member.color}-300`)}>{member.avatar}</div>
                <span>{member.name}</span>
              </div>
            ) : '—'}
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-0.5">POC Name</label>
            <InlineTextEdit value={engagement.poc?.name} onSave={v => onUpdate({ poc: { ...engagement.poc, name: v } })} placeholder="Client POC name" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-0.5">POC Phone</label>
            <InlineTextEdit value={engagement.poc?.phone} onSave={v => onUpdate({ poc: { ...engagement.poc, phone: v } })} placeholder="Phone" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-0.5">POC Email</label>
            <InlineTextEdit value={engagement.poc?.email} onSave={v => onUpdate({ poc: { ...engagement.poc, email: v } })} placeholder="Email" />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="card-glass p-4 space-y-3">
        <p className={sectionHdr}>Timeline</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-0.5">Start Date</label>
            <InlineDateEdit value={engagement.startDate} onSave={v => onUpdate({ startDate: v })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-0.5">Expected End</label>
            <InlineDateEdit value={engagement.expectedEndDate} onSave={v => onUpdate({ expectedEndDate: v })} />
          </div>
          {engagement.status === 'Completed' && (
            <div>
              <label className="text-xs text-muted-foreground block mb-0.5">Actual End</label>
              <InlineDateEdit value={engagement.actualEndDate} onSave={v => onUpdate({ actualEndDate: v })} />
            </div>
          )}
        </div>
        <TimelineBar startDate={engagement.startDate} endDate={engagement.expectedEndDate} />
      </div>

      {/* Payment Sprints */}
      <div className="card-glass p-4 space-y-3">
        <p className={sectionHdr}>Payment Sprints</p>
        {(engagement.paymentSprints || []).length === 0 && (
          <p className="text-sm text-muted-foreground py-2 text-center">No payment sprints added yet.</p>
        )}
        {(engagement.paymentSprints || []).map((sprint, i) => {
          const isOverdue = sprint.dueDate && sprint.status === 'Pending' && new Date(sprint.dueDate) < today;
          const daysOvr = sprint.dueDate && isOverdue ? Math.abs(differenceInDays(new Date(), new Date(sprint.dueDate))) : 0;
          return (
            <div key={sprint.id} className="grid grid-cols-12 gap-2 items-center p-3 rounded-xl" style={{ background: isOverdue ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
              <div className="col-span-3"><input value={sprint.name} onChange={e => handleSprint(i, 'name', e.target.value)} className={inputCls} /></div>
              <div className="col-span-2"><input value={sprint.amount} onChange={e => handleSprint(i, 'amount', e.target.value)} placeholder="Amount" className={inputCls} /></div>
              <div className="col-span-2"><input type="date" value={sprint.dueDate} onChange={e => handleSprint(i, 'dueDate', e.target.value)} className={inputCls} /></div>
              <div className="col-span-2">
                <select value={isOverdue ? 'Overdue' : sprint.status} onChange={e => handleSprint(i, 'status', e.target.value)} className={inputCls + (isOverdue ? ' text-red-400' : '')}>
                  {SPRINT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                {isOverdue && <span className="text-[10px] text-red-400 font-bold">{daysOvr}d overdue</span>}
              </div>
              <div className="col-span-1 flex justify-center">
                <button onClick={() => removeSprint(i)} className="p-1.5 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          );
        })}
        <button onClick={addSprint} className="flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"><Plus className="w-3.5 h-3.5" /> Add Sprint</button>
      </div>

      {/* Tech Requirements */}
      <div className="card-glass p-4 space-y-4">
        <p className={sectionHdr}>Tech Requirements</p>

        {/* Repos */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">GitHub Repositories</p>
          {(engagement.techRequirements?.repos || []).length === 0 && (
            <p className="text-xs text-muted-foreground py-2">No repositories added yet.</p>
          )}
          {(engagement.techRequirements?.repos || []).map((repo, i) => (
            <div key={repo.id} className="grid grid-cols-12 gap-2 mb-2 items-center">
              <div className="col-span-2"><input value={repo.label} onChange={e => updateRepo(i, 'label', e.target.value)} placeholder="Label" className={inputCls} /></div>
              <div className="col-span-4 flex items-center gap-1">
                <input value={repo.url} onChange={e => updateRepo(i, 'url', e.target.value)} placeholder="GitHub URL" className={inputCls} />
                {repo.url && <a href={repo.url} target="_blank" rel="noreferrer" className="flex-shrink-0 text-muted-foreground hover:text-cyan-400"><ExternalLink className="w-3.5 h-3.5" /></a>}
              </div>
              <div className="col-span-2"><input value={repo.branch} onChange={e => updateRepo(i, 'branch', e.target.value)} placeholder="Branch" className={inputCls} /></div>
              <div className="col-span-3"><input value={repo.notes} onChange={e => updateRepo(i, 'notes', e.target.value)} placeholder="Notes" className={inputCls} /></div>
              <div className="col-span-1 flex justify-center"><button onClick={() => removeRepo(i)} className="p-1.5 hover:text-red-400 text-muted-foreground transition-colors"><Trash2 className="w-3 h-3" /></button></div>
            </div>
          ))}
          <button onClick={addRepo} className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"><Plus className="w-3 h-3" /> Add Repository</button>
        </div>

        {/* Credentials */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">API Keys & Credentials</p>
          {(engagement.techRequirements?.credentials || []).length === 0 && (
            <p className="text-xs text-muted-foreground py-2">No credentials stored yet.</p>
          )}
          {(engagement.techRequirements?.credentials || []).map((cred, i) => (
            <div key={cred.id} className="grid grid-cols-12 gap-2 mb-2 items-center">
              <div className="col-span-2"><input value={cred.service} onChange={e => updateCred(i, 'service', e.target.value)} placeholder="Service" className={inputCls} /></div>
              <div className="col-span-2"><input value={cred.label} onChange={e => updateCred(i, 'label', e.target.value)} placeholder="Key Label" className={inputCls} /></div>
              <div className="col-span-3 flex items-center gap-1">
                <input type={showCreds[i] ? 'text' : 'password'} value={cred.value} onChange={e => updateCred(i, 'value', e.target.value)} placeholder="Value" className={inputCls} />
                <button onClick={() => setShowCreds(s => ({ ...s, [i]: !s[i] }))} className="flex-shrink-0 text-muted-foreground hover:text-cyan-400">
                  {showCreds[i] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="col-span-2">
                <select value={cred.environment} onChange={e => updateCred(i, 'environment', e.target.value)} className={inputCls}>
                  {ENV_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className="col-span-2"><input value={cred.notes} onChange={e => updateCred(i, 'notes', e.target.value)} placeholder="Notes" className={inputCls} /></div>
              <div className="col-span-1 flex justify-center"><button onClick={() => removeCred(i)} className="p-1.5 hover:text-red-400 text-muted-foreground transition-colors"><Trash2 className="w-3 h-3" /></button></div>
            </div>
          ))}
          <button onClick={addCred} className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"><Plus className="w-3 h-3" /> Add Credential</button>
        </div>

        {/* Deployment */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Environment & Deployment</p>
          <div className="grid grid-cols-2 gap-3">
            {[['liveUrl','Production URL'],['stagingUrl','Staging URL'],['hostingPlatform','Hosting Platform'],['database','Database']].map(([k,lbl]) => (
              <div key={k}>
                <label className="text-xs text-muted-foreground block mb-0.5">{lbl}</label>
                <div className="flex items-center gap-1">
                  <input value={engagement.techRequirements?.deployment?.[k] || ''} onChange={e => setDeploy(k, e.target.value)} className={inputCls} />
                  {(k === 'liveUrl' || k === 'stagingUrl') && engagement.techRequirements?.deployment?.[k] && (
                    <a href={engagement.techRequirements.deployment[k]} target="_blank" rel="noreferrer" className="flex-shrink-0 text-muted-foreground hover:text-cyan-400"><ExternalLink className="w-3.5 h-3.5" /></a>
                  )}
                </div>
              </div>
            ))}
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground block mb-0.5">Notes</label>
              <textarea value={engagement.techRequirements?.deployment?.notes || ''} onChange={e => setDeploy('notes', e.target.value)} rows={2} className={inputCls + ' resize-none'} />
            </div>
          </div>
        </div>
      </div>

      {/* Linked Tasks */}
      <div className="card-glass p-4 space-y-3">
        <p className={sectionHdr}>Linked Tasks ({engTasks.length})</p>
        {engTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks linked to this engagement.</p>
        ) : (
          engTasks.map(task => {
            const m = team.find(m => m.id === task.assigneeId);
            const days = daysFromToday(task.deadline);
            return (
              <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                {m && <div className={cn('w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold', `bg-${m.color}-500/20 text-${m.color}-300`)}>{m.avatar}</div>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{task.name}</p>
                  <p className="text-[10px] text-muted-foreground">{task.status} · {m?.name}</p>
                </div>
                {days !== null && days < 0 && <span className="text-xs text-red-400 font-bold">{Math.abs(days)}d overdue</span>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}