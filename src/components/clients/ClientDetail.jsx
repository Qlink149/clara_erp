import { useState } from 'react';
import { AlertTriangle, Plus, Clock, CheckCircle, Phone, Mail, MessageCircle, Activity, FileText, Calendar, Pencil, ArchiveX } from 'lucide-react';
import { cn, formatDate, daysFromToday, formatRelative, getStatusColor, getPriorityColor } from '@/lib/utils';
import { useStore } from '@/lib/StoreContext';
import { InlineTextEdit, InlineSelectEdit, InlineDateEdit, InlineNumberEdit } from '@/components/ui/InlineEdit';
import EngagementsTab from '@/components/engagements/EngagementsTab';
import DocumentsTab from '@/components/documents/DocumentsTab';

const TABS = ['Overview', 'Engagements', 'Tasks', 'Pending', 'Activity', 'Communication', 'Documents'];
const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed', 'Blocked', 'On Hold'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];
const BILLING_OPTIONS = ['Paid', 'Partially Paid', 'Pending'];
const PENDING_STATUS_OPTIONS = ['Awaiting', 'Received', 'Cancelled'];

function AlertBanner({ client, tasks }) {
  const clientTasks = tasks.filter((t) => t.clientId === client.id && t.status !== 'Completed');
  const overdueTasks = clientTasks.filter((t) => {
    const d = daysFromToday(t.deadline);
    return d !== null && d < 0;
  });
  const overdueItems = (client.pendingItems || []).filter((p) => p.status === 'Awaiting' && daysFromToday(p.deadline) !== null && daysFromToday(p.deadline) < 0);
  const flaggedItems = (client.pendingItems || []).filter((p) => p.reminderFlag && p.status === 'Awaiting');
  const followupPast = client.communication?.nextFollowUp && daysFromToday(client.communication.nextFollowUp) < 0;

  const alerts = [
    ...overdueTasks.map((t) => ({ msg: `Task "${t.name}" is ${Math.abs(daysFromToday(t.deadline))}d overdue`, type: 'task' })),
    ...overdueItems.map((p) => ({ msg: `Pending item "${p.description}" is ${Math.abs(daysFromToday(p.deadline))}d overdue`, type: 'pending' })),
    ...(followupPast ? [{ msg: `Follow-up date passed ${Math.abs(daysFromToday(client.communication.nextFollowUp))}d ago`, type: 'followup' }] : []),
    ...flaggedItems.filter((p) => !overdueItems.find((o) => o.id === p.id)).map((p) => ({ msg: `Reminder: "${p.description}" awaiting from client`, type: 'reminder' })),
  ];

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {alerts.map((a, i) => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-300">{a.msg}</p>
        </div>
      ))}
    </div>
  );
}

export default function ClientDetail({ client, onUpdate, onClose, onMoveToPast }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const { tasks, team, addTask, updateTask, addPendingItem, updatePendingItem, deletePendingItem, addActivityLogEntry } = useStore();
  const clientTasks = tasks.filter((t) => t.clientId === client.id);
  const [newLogText, setNewLogText] = useState('');

  const handleUpdateClient = (field, value) => {
    const updates = typeof field === 'object' ? field : { [field]: value };
    onUpdate(client.id, updates);
  };

  const handleUpdateCommunication = (field, value) => {
    onUpdate(client.id, { communication: { ...client.communication, [field]: value } });
  };

  const handleAddTask = () => {
    addTask({ name: 'New task', clientId: client.id, assigneeId: '', status: 'Not Started', priority: 'Medium', deadline: null, timeAllocated: 0, timeTaken: 0, notes: '' });
  };

  const handleAddLog = () => {
    if (!newLogText.trim()) return;
    addActivityLogEntry(client.id, { action: newLogText, actor: 'yogansh' });
    setNewLogText('');
  };

  const getMember = (id) => team.find((m) => m.id === id);

  return (
    <div className="space-y-4">
      <AlertBanner client={client} tasks={tasks} />

      {/* Move to Past */}
      {onMoveToPast && (
        <div className="flex justify-end">
          <button
            onClick={() => { if (window.confirm(`Move "${client.name}" to Past clients?`)) { onMoveToPast(client.id); onClose(); } }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-muted-foreground border border-border hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all"
          >
            <ArchiveX className="w-3.5 h-3.5" /> Move to Past
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border pb-0 overflow-x-auto">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={cn('px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-all -mb-px', activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            {tab}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'Overview' && (
        <div className="space-y-4">
          {/* Basic Info */}
          <div className="card-glass p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client Info</h3>
              <span className={cn('px-2 py-0.5 rounded text-xs font-medium border', getStatusColor(client.status))}>{client.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="text-xs text-muted-foreground">Company</label>
                <InlineTextEdit value={client.name} onSave={(v) => handleUpdateClient('name', v)} className="font-semibold text-foreground block mt-0.5" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Industry</label>
                <InlineTextEdit value={client.industry} onSave={(v) => handleUpdateClient('industry', v)} className="text-foreground block mt-0.5" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Project Start</label>
                <InlineDateEdit value={client.projectStartDate} onSave={(v) => handleUpdateClient('projectStartDate', v)} className="text-foreground block mt-0.5" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Contract End</label>
                <InlineDateEdit value={client.contractEndDate} onSave={(v) => handleUpdateClient('contractEndDate', v)} className="text-foreground block mt-0.5" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Billing Status</label>
                <div className="mt-0.5">
                  <InlineSelectEdit value={client.billingStatus} options={BILLING_OPTIONS} onSave={(v) => handleUpdateClient('billingStatus', v)} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Status</label>
                <div className="mt-0.5">
                  <InlineSelectEdit value={client.status} options={['On Track', 'At Risk', 'Delayed', 'Paused']} onSave={(v) => handleUpdateClient('status', v)} />
                </div>
              </div>
            </div>
          </div>

          {/* Contacts */}
          <div className="card-glass p-4 space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Primary Contact</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Name', field: 'name' },
                { label: 'Designation', field: 'designation' },
                { label: 'Phone', field: 'phone' },
                { label: 'Email', field: 'email' },
                { label: 'WhatsApp', field: 'whatsapp' },
              ].map(({ label, field }) => (
                <div key={field}>
                  <label className="text-xs text-muted-foreground">{label}</label>
                  <InlineTextEdit
                    value={client.primaryContact?.[field]}
                    onSave={(v) => handleUpdateClient('primaryContact', { ...client.primaryContact, [field]: v })}
                    className="text-foreground block mt-0.5"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="card-glass p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {(client.tags || []).map((tag) => (
                <span key={tag} className="px-2 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium">{tag}</span>
              ))}
            </div>
          </div>

          {/* Billing / Invoice Details */}
          <div className="card-glass p-4 space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Billing / Invoice Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground">Legal Billing Name</label>
                <InlineTextEdit value={client.legalName} onSave={(v) => handleUpdateClient('legalName', v)} placeholder="Legal company name for invoices" className="text-foreground block mt-0.5" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground">Billing Address</label>
                <InlineTextEdit value={client.billingAddress} onSave={(v) => handleUpdateClient('billingAddress', v)} multiline placeholder="Full billing address" className="text-foreground block mt-0.5" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">GSTIN/UIN</label>
                <InlineTextEdit value={client.gstin} onSave={(v) => handleUpdateClient('gstin', v)} placeholder="GSTIN" className="text-foreground block mt-0.5" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">PAN</label>
                <InlineTextEdit value={client.pan} onSave={(v) => handleUpdateClient('pan', v)} placeholder="PAN" className="text-foreground block mt-0.5" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">State Name</label>
                <InlineTextEdit value={client.stateName} onSave={(v) => handleUpdateClient('stateName', v)} placeholder="e.g. Maharashtra" className="text-foreground block mt-0.5" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">State Code</label>
                <InlineTextEdit value={client.stateCode} onSave={(v) => handleUpdateClient('stateCode', v)} placeholder="e.g. 27" className="text-foreground block mt-0.5" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="card-glass p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Internal Notes</h3>
            <InlineTextEdit
              value={client.internalNotes}
              onSave={(v) => handleUpdateClient('internalNotes', v)}
              multiline
              placeholder="Add internal notes..."
              className="text-sm text-muted-foreground w-full"
            />
          </div>
        </div>
      )}

      {/* ENGAGEMENTS */}
      {activeTab === 'Engagements' && <EngagementsTab clientId={client.id} />}

      {/* TASKS */}
      {activeTab === 'Tasks' && (
        <div className="space-y-3">
          {clientTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No tasks yet</p>
          ) : (
            clientTasks.map((task) => {
              const member = getMember(task.assigneeId);
              const days = daysFromToday(task.deadline);
              return (
                <div key={task.id} className="card-glass p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <InlineTextEdit value={task.name} onSave={(v) => updateTask(task.id, { name: v })} className="text-sm font-medium text-foreground flex-1" />
                    {days !== null && days < 0 && (
                      <span className="text-xs font-bold text-red-400 flex-shrink-0">{Math.abs(days)}d overdue</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-muted-foreground block mb-0.5">Assignee</label>
                      <select value={task.assigneeId || ''} onChange={(e) => updateTask(task.id, { assigneeId: e.target.value })} className="bg-secondary border border-border rounded px-2 py-1 text-foreground w-full focus:outline-none text-xs">
                        <option value="">Unassigned</option>
                        {team.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-muted-foreground block mb-0.5">Status</label>
                      <select value={task.status} onChange={(e) => updateTask(task.id, { status: e.target.value })} className="bg-secondary border border-border rounded px-2 py-1 text-foreground w-full focus:outline-none text-xs">
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-muted-foreground block mb-0.5">Priority</label>
                      <select value={task.priority} onChange={(e) => updateTask(task.id, { priority: e.target.value })} className="bg-secondary border border-border rounded px-2 py-1 text-foreground w-full focus:outline-none text-xs">
                        {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-muted-foreground block mb-0.5">Deadline</label>
                      <InlineDateEdit value={task.deadline} onSave={(v) => updateTask(task.id, { deadline: v })} className="text-foreground" />
                    </div>
                    <div>
                      <label className="text-muted-foreground block mb-0.5">Est. hrs</label>
                      <InlineNumberEdit value={task.timeAllocated} onSave={(v) => updateTask(task.id, { timeAllocated: v })} suffix="h" />
                    </div>
                    <div>
                      <label className="text-muted-foreground block mb-0.5">Actual hrs</label>
                      <InlineNumberEdit value={task.timeTaken} onSave={(v) => updateTask(task.id, { timeTaken: v })} suffix="h" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-0.5">Notes</label>
                    <InlineTextEdit value={task.notes} onSave={(v) => updateTask(task.id, { notes: v })} placeholder="Add notes..." className="text-xs text-muted-foreground" />
                  </div>
                </div>
              );
            })
          )}
          <button onClick={handleAddTask} className="w-full py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Add New Task
          </button>
        </div>
      )}

      {/* PENDING ITEMS */}
      {activeTab === 'Pending' && (
        <div className="space-y-3">
          {(client.pendingItems || []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No pending items</p>
          ) : (
            (client.pendingItems || []).map((item) => {
              const days = daysFromToday(item.deadline);
              return (
                <div key={item.id} className="card-glass p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <InlineTextEdit value={item.description} onSave={(v) => updatePendingItem(client.id, item.id, { description: v })} className="text-sm font-medium text-foreground flex-1" />
                    {days !== null && days < 0 && (
                      <span className="text-xs font-bold text-red-400 flex-shrink-0">{Math.abs(days)}d overdue</span>
                    )}
                    {days !== null && days >= 0 && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">in {days}d</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-muted-foreground block mb-0.5">Requested</label>
                      <InlineDateEdit value={item.requestedDate} onSave={(v) => updatePendingItem(client.id, item.id, { requestedDate: v })} className="text-foreground" />
                    </div>
                    <div>
                      <label className="text-muted-foreground block mb-0.5">Deadline</label>
                      <InlineDateEdit value={item.deadline} onSave={(v) => updatePendingItem(client.id, item.id, { deadline: v })} className="text-foreground" />
                    </div>
                    <div>
                      <label className="text-muted-foreground block mb-0.5">Status</label>
                      <select value={item.status} onChange={(e) => updatePendingItem(client.id, item.id, { status: e.target.value })} className="bg-secondary border border-border rounded px-2 py-1 text-foreground w-full focus:outline-none text-xs">
                        {PENDING_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-muted-foreground">Reminder</label>
                      <button
                        onClick={() => updatePendingItem(client.id, item.id, { reminderFlag: !item.reminderFlag })}
                        className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors', item.reminderFlag ? 'bg-primary' : 'bg-secondary border border-border')}
                      >
                        <span className={cn('inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform', item.reminderFlag ? 'translate-x-[18px]' : 'translate-x-[2px]')} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <button
            onClick={() => addPendingItem(client.id, { description: 'New pending item', requestedDate: new Date().toISOString().split('T')[0], deadline: '', status: 'Awaiting', reminderFlag: false })}
            className="w-full py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Pending Item
          </button>
        </div>
      )}

      {/* ACTIVITY */}
      {activeTab === 'Activity' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              value={newLogText}
              onChange={(e) => setNewLogText(e.target.value)}
              placeholder="Add a manual log entry..."
              className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddLog(); }}
            />
            <button onClick={handleAddLog} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Add</button>
          </div>
          <div className="relative space-y-0">
            {(client.activityLog || []).map((entry, i) => (
              <div key={entry.id} className="flex gap-3 pb-4">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  {i < (client.activityLog || []).length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                </div>
                <div className="flex-1 pb-0 min-w-0">
                  <p className="text-sm text-foreground">{entry.action}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatRelative(entry.date)} · {entry.actor}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COMMUNICATION */}
      {activeTab === 'Communication' && (
        <div className="space-y-4">
          <div className="card-glass p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Last Call/Meeting Date</label>
                <InlineDateEdit value={client.communication?.lastCallDate} onSave={(v) => handleUpdateCommunication('lastCallDate', v)} className="text-sm text-foreground" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Next Follow-up Date</label>
                <InlineDateEdit value={client.communication?.nextFollowUp} onSave={(v) => handleUpdateCommunication('nextFollowUp', v)} className="text-sm text-foreground" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Platform</label>
                <InlineSelectEdit
                  value={client.communication?.platform}
                  options={['WhatsApp', 'Email', 'Call', 'Meeting']}
                  onSave={(v) => handleUpdateCommunication('platform', v)}
                  className="text-sm text-foreground"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Last Conversation Summary</label>
              <InlineTextEdit
                value={client.communication?.lastSummary}
                onSave={(v) => handleUpdateCommunication('lastSummary', v)}
                multiline
                placeholder="Summary of last conversation..."
                className="text-sm text-muted-foreground w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENTS */}
      {activeTab === 'Documents' && <DocumentsTab clientId={client.id} />}
    </div>
  );
}