import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInDays, parseISO, isValid } from 'date-fns';

const ENG_STATUSES = ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'];
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
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
          <span>{startDate}</span>
          <span className={overdue ? 'text-amber-400' : ''}>{endDate}</span>
        </div>
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: overdue ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'linear-gradient(90deg,#00d4ff,#0ea5e9)' }} />
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">{pct}% elapsed{overdue ? ' — PAST END DATE' : ''}</div>
      </div>
    );
  } catch { return null; }
}

export default function EngagementModal({ open, onClose, onSave, engagement, team, clientEngagements = [] }) {
  const isEdit = !!engagement;
  const blank = { name: '', description: '', status: 'Planning', tags: [], assigneeId: '', poc: { name: '', phone: '', email: '', whatsapp: '' }, startDate: '', expectedEndDate: '', actualEndDate: '', paymentSprints: [], techRequirements: { repos: [], credentials: [], deployment: { liveUrl: '', stagingUrl: '', hostingPlatform: '', database: '', notes: '' } } };

  const [form, setForm] = useState(blank);
  const [tagInput, setTagInput] = useState('');
  const [copyLast, setCopyLast] = useState(false);
  const [techOpen, setTechOpen] = useState(false);
  const [showCreds, setShowCreds] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(engagement ? { ...blank, ...engagement } : blank);
      setCopyLast(false);
      setTechOpen(false);
      setDeleteConfirm(false);
    }
  }, [open, engagement]);

  const lastEngagement = clientEngagements.filter(e => !e.archived).slice(-1)[0];

  useEffect(() => {
    if (copyLast && lastEngagement && !isEdit) {
      setForm(f => ({ ...f, assigneeId: lastEngagement.assigneeId, poc: { ...lastEngagement.poc } }));
    }
  }, [copyLast]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setPoc = (k, v) => setForm(f => ({ ...f, poc: { ...f.poc, [k]: v } }));
  const setTech = (k, v) => setForm(f => ({ ...f, techRequirements: { ...f.techRequirements, [k]: v } }));
  const setDeploy = (k, v) => setForm(f => ({ ...f, techRequirements: { ...f.techRequirements, deployment: { ...f.techRequirements.deployment, [k]: v } } }));

  const addSprint = () => set('paymentSprints', [...(form.paymentSprints || []), { id: `ps${Date.now()}`, name: '', amount: '', dueDate: '', status: 'Pending', notes: '', dateAdded: new Date().toISOString().split('T')[0] }]);
  const updateSprint = (i, k, v) => set('paymentSprints', form.paymentSprints.map((s, idx) => idx === i ? { ...s, [k]: v } : s));
  const removeSprint = (i) => set('paymentSprints', form.paymentSprints.filter((_, idx) => idx !== i));

  const addRepo = () => setTech('repos', [...(form.techRequirements.repos || []), { id: `repo${Date.now()}`, label: '', url: '', branch: '', notes: '' }]);
  const updateRepo = (i, k, v) => setTech('repos', form.techRequirements.repos.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const removeRepo = (i) => setTech('repos', form.techRequirements.repos.filter((_, idx) => idx !== i));

  const addCred = () => setTech('credentials', [...(form.techRequirements.credentials || []), { id: `cred${Date.now()}`, service: '', label: '', value: '', environment: 'Production', notes: '', dateAdded: new Date().toISOString().split('T')[0] }]);
  const updateCred = (i, k, v) => setTech('credentials', form.techRequirements.credentials.map((c, idx) => idx === i ? { ...c, [k]: v } : c));
  const removeCred = (i) => setTech('credentials', form.techRequirements.credentials.filter((_, idx) => idx !== i));

  const handleTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      set('tags', [...(form.tags || []), tagInput.trim()]);
      setTagInput('');
    }
  };
  const removeTag = (t) => set('tags', form.tags.filter(x => x !== t));

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave(form);
    onClose();
  };

  if (!open) return null;

  const inputCls = 'bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 w-full';
  const labelCls = 'text-xs font-medium text-muted-foreground block mb-1';
  const sectionHdr = 'text-xs font-bold uppercase tracking-widest text-cyan-400/70 mb-3 mt-5 first:mt-0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl shadow-2xl animate-fade-in overflow-hidden flex flex-col max-h-[90vh]"
        style={{ background: 'linear-gradient(135deg,rgba(4,8,18,0.98) 0%,rgba(6,12,24,0.98) 100%)', border: '1px solid rgba(0,212,255,0.15)', boxShadow: '0 0 60px rgba(0,212,255,0.08),0 24px 64px rgba(0,0,0,0.6)' }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(0,212,255,0.5),transparent)' }} />
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg,#00d4ff,rgba(0,212,255,0.2))' }} />
            <h2 className="text-sm font-bold uppercase tracking-widest">{isEdit ? 'Edit Engagement' : 'New Engagement'}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-cyan-400 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* SECTION 1 */}
          <p className={sectionHdr}>Basic Info</p>
          <div>
            <label className={labelCls}>Engagement Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. WhatsApp Chatbot" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} className={inputCls + ' resize-none'} placeholder="Optional description..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Status *</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
                {ENG_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Tags</label>
              <div className="flex flex-wrap gap-1 mb-1">
                {(form.tags || []).map(t => (
                  <span key={t} className="px-2 py-0.5 rounded bg-primary/15 text-primary text-xs flex items-center gap-1">
                    {t} <button onClick={() => removeTag(t)} className="hover:text-red-400">×</button>
                  </span>
                ))}
              </div>
              <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleTag} placeholder="Type + Enter" className={inputCls} />
            </div>
          </div>

          {/* SECTION 2 */}
          <p className={sectionHdr}>Assignment & Contact</p>
          {lastEngagement && !isEdit && (
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={copyLast} onChange={e => setCopyLast(e.target.checked)} className="rounded" />
              Copy details from last engagement ({lastEngagement.name})
            </label>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Assigned Team Member *</label>
              <select value={form.assigneeId} onChange={e => set('assigneeId', e.target.value)} className={inputCls}>
                <option value="">Select...</option>
                {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>POC Name *</label>
              <input value={form.poc.name} onChange={e => setPoc('name', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>POC Phone</label>
              <input value={form.poc.phone} onChange={e => setPoc('phone', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>POC Email</label>
              <input value={form.poc.email} onChange={e => setPoc('email', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>POC WhatsApp</label>
              <input value={form.poc.whatsapp} onChange={e => setPoc('whatsapp', e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* SECTION 3 */}
          <p className={sectionHdr}>Timeline</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Start Date *</label>
              <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Expected End Date</label>
              <input type="date" value={form.expectedEndDate} onChange={e => set('expectedEndDate', e.target.value)} className={inputCls} />
            </div>
            {form.status === 'Completed' && (
              <div>
                <label className={labelCls}>Actual End Date</label>
                <input type="date" value={form.actualEndDate} onChange={e => set('actualEndDate', e.target.value)} className={inputCls} />
              </div>
            )}
          </div>
          <TimelineBar startDate={form.startDate} endDate={form.expectedEndDate} />

          {/* SECTION 4 — Payment Sprints */}
          <p className={sectionHdr}>Payment Sprints</p>
          <div className="space-y-2">
            {(form.paymentSprints || []).length === 0 && (
              <p className="text-sm text-muted-foreground py-3 text-center border border-dashed border-border rounded-lg">No payment sprints added yet.</p>
            )}
            {(form.paymentSprints || []).map((sprint, i) => {
              // auto-flag overdue
              const isOverdue = sprint.dueDate && sprint.status === 'Pending' && new Date(sprint.dueDate) < new Date();
              return (
                <div key={sprint.id} className="grid grid-cols-12 gap-2 items-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="col-span-3">
                    <input value={sprint.name} onChange={e => updateSprint(i, 'name', e.target.value)} placeholder="Milestone name" className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <input value={sprint.amount} onChange={e => updateSprint(i, 'amount', e.target.value)} placeholder="Amount" className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <input type="date" value={sprint.dueDate} onChange={e => updateSprint(i, 'dueDate', e.target.value)} className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <select value={isOverdue ? 'Overdue' : sprint.status} onChange={e => updateSprint(i, 'status', e.target.value)} className={inputCls}>
                      {SPRINT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input value={sprint.notes} onChange={e => updateSprint(i, 'notes', e.target.value)} placeholder="Notes" className={inputCls} />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button onClick={() => removeSprint(i)} className="p-1.5 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              );
            })}
            <button onClick={addSprint} className="flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 transition-colors py-1">
              <Plus className="w-3.5 h-3.5" /> Add Sprint
            </button>
          </div>

          {/* SECTION 5 — Tech Requirements */}
          <button onClick={() => setTechOpen(o => !o)} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400/70 mt-5 hover:text-cyan-400 transition-colors w-full">
            {techOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            Tech Requirements
          </button>
          {techOpen && (
            <div className="space-y-4 pl-2 border-l border-cyan-500/20">
              {/* Repos */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">GitHub Repositories</p>
                {(form.techRequirements.repos || []).length === 0 && (
                  <p className="text-xs text-muted-foreground py-2">No repositories added yet.</p>
                )}
                {(form.techRequirements.repos || []).map((repo, i) => (
                  <div key={repo.id} className="grid grid-cols-12 gap-2 mb-2 items-center">
                    <div className="col-span-3"><input value={repo.label} onChange={e => updateRepo(i, 'label', e.target.value)} placeholder="Label (e.g. Frontend)" className={inputCls} /></div>
                    <div className="col-span-4"><input value={repo.url} onChange={e => updateRepo(i, 'url', e.target.value)} placeholder="GitHub URL" className={inputCls} /></div>
                    <div className="col-span-2"><input value={repo.branch} onChange={e => updateRepo(i, 'branch', e.target.value)} placeholder="Branch" className={inputCls} /></div>
                    <div className="col-span-2"><input value={repo.notes} onChange={e => updateRepo(i, 'notes', e.target.value)} placeholder="Notes" className={inputCls} /></div>
                    <div className="col-span-1 flex justify-center"><button onClick={() => removeRepo(i)} className="p-1.5 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></div>
                  </div>
                ))}
                <button onClick={addRepo} className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"><Plus className="w-3 h-3" /> Add Repository</button>
              </div>

              {/* Credentials */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">API Keys & Credentials</p>
                {(form.techRequirements.credentials || []).length === 0 && (
                  <p className="text-xs text-muted-foreground py-2">No credentials stored yet.</p>
                )}
                {(form.techRequirements.credentials || []).map((cred, i) => (
                  <div key={cred.id} className="grid grid-cols-12 gap-2 mb-2 items-center">
                    <div className="col-span-2"><input value={cred.service} onChange={e => updateCred(i, 'service', e.target.value)} placeholder="Service" className={inputCls} /></div>
                    <div className="col-span-2"><input value={cred.label} onChange={e => updateCred(i, 'label', e.target.value)} placeholder="Key Label" className={inputCls} /></div>
                    <div className="col-span-3 flex items-center gap-1">
                      <input type={showCreds[i] ? 'text' : 'password'} value={cred.value} onChange={e => updateCred(i, 'value', e.target.value)} placeholder="Value" className={inputCls} />
                      <button onClick={() => setShowCreds(s => ({ ...s, [i]: !s[i] }))} className="p-1.5 text-muted-foreground hover:text-cyan-400 flex-shrink-0">
                        {showCreds[i] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="col-span-2">
                      <select value={cred.environment} onChange={e => updateCred(i, 'environment', e.target.value)} className={inputCls}>
                        {ENV_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2"><input value={cred.notes} onChange={e => updateCred(i, 'notes', e.target.value)} placeholder="Notes" className={inputCls} /></div>
                    <div className="col-span-1 flex justify-center"><button onClick={() => removeCred(i)} className="p-1.5 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></div>
                  </div>
                ))}
                <button onClick={addCred} className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"><Plus className="w-3 h-3" /> Add Credential</button>
              </div>

              {/* Deployment */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Environment & Deployment</p>
                <div className="grid grid-cols-2 gap-3">
                  {[['liveUrl','Production URL'],['stagingUrl','Staging URL'],['hostingPlatform','Hosting Platform'],['database','Database']].map(([k,lbl]) => (
                    <div key={k}>
                      <label className={labelCls}>{lbl}</label>
                      <input value={form.techRequirements.deployment[k]} onChange={e => setDeploy(k, e.target.value)} className={inputCls} />
                    </div>
                  ))}
                  <div className="col-span-2">
                    <label className={labelCls}>Notes</label>
                    <textarea value={form.techRequirements.deployment.notes} onChange={e => setDeploy('notes', e.target.value)} rows={2} className={inputCls + ' resize-none'} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-white/5">
          {isEdit && (
            <div className="mb-3">
              {!deleteConfirm ? (
                <button onClick={() => setDeleteConfirm(true)} className="text-xs text-red-400 hover:text-red-300 underline transition-colors">Delete Engagement</button>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-xs text-red-300 flex-1">Archive this engagement? It can be restored later.</p>
                  <button onClick={() => { onSave({ ...form, archived: true }); onClose(); }} className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors">Archive</button>
                  <button onClick={() => setDeleteConfirm(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                </div>
              )}
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <button onClick={onClose} className="px-4 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={!form.name.trim()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
              {isEdit ? 'Save Changes' : 'Create Engagement'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}