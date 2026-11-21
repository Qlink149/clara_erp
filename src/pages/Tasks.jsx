import { useState, useMemo } from 'react';
import { CheckSquare, Plus, Filter, Download, LayoutGrid, List, Calendar as CalendarIcon, AlertTriangle, Trash2 } from 'lucide-react';
import { cn, getStatusColor, getPriorityColor, formatDate, daysFromToday, formatRelative } from '@/lib/utils';
import { useStore } from '@/lib/StoreContext';
import Modal from '@/components/ui/Modal';
import { InlineTextEdit, InlineSelectEdit, InlineDateEdit } from '@/components/ui/InlineEdit';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isValid } from 'date-fns';
import { useAuthorization, useFilteredClients, useFilteredTasks, useMyTasks } from '@/lib/AuthorizationContext';
import NoAccessState from '@/components/ui/NoAccessState';

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed', 'Blocked', 'On Hold'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];

// Client sort order as per the master task list spreadsheet
const CLIENT_SORT_ORDER = [
  'iDAC', 'Vijay Sales', 'Jaipur Rugs', 'Apex Hospital', 'ZA', 'Diallo',
  'Hiranandani', 'Hey Concrete', 'My Mechanic', 'Kohinoor Real Estate',
  'Rustoomjee', 'Nilkamal', 'CBV', 'Flow Reality', 'Arihant', 'Haique',
  'Kisna', 'Raheja', 'Samaro', 'Kuche7', 'Unity Bank', 'Swamy Marmo',
  'Sid-One Residence', 'Sanaya', 'Nitco', 'KBL', 'AU',
  'Rohin Bhaiya — Jewel Brand', 'fsai', 'ABSLI', 'IRC',
  'Riddhi Siddhi Mills', 'Pacific-pims city hospital', 'Rama Nature Works',
];

const ENG_STATUS_STYLE = {
  Active: 'bg-cyan-500/15 text-cyan-400',
  Planning: 'bg-gray-500/15 text-gray-400',
  'On Hold': 'bg-amber-500/15 text-amber-400',
  Completed: 'bg-blue-500/15 text-blue-400',
  Cancelled: 'bg-red-500/15 text-red-400',
};

const STATUS_COLS = ['Not Started', 'In Progress', 'Blocked', 'Completed'];

const STATUS_COLORS = {
  'Not Started': 'border-t-gray-500',
  'In Progress': 'border-t-cyan-500',
  'Blocked': 'border-t-red-500',
  'Completed': 'border-t-green-500',
};

function TaskCard({ task, allClients, team, onUpdate, engagements = [] }) {
  const client = allClients.find((c) => c.id === task.clientId);
  const member = team.find((m) => m.id === task.assigneeId);
  const days = daysFromToday(task.deadline);
  const engagement = engagements.find(e => e.id === task.engagementId);

  return (
    <div className={cn('card-glass p-3 space-y-2 border-t-2', STATUS_COLORS[task.status])}>
      <p className="text-sm font-medium text-foreground leading-snug">{task.name}</p>
      {engagement && (
        <span className={cn('inline-block px-1.5 py-0.5 rounded text-[10px] font-medium', ENG_STATUS_STYLE[engagement.status] || 'bg-cyan-500/15 text-cyan-400')}>
          {engagement.name}
        </span>
      )}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {member && (
            <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold', `bg-${member.color}-500/20 text-${member.color}-300`)}>
              {member.avatar}
            </div>
          )}
          {client && <span className="text-xs text-muted-foreground truncate max-w-[80px]">{client.name}</span>}
        </div>
        <div className="flex items-center gap-1">
          <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium border', getPriorityColor(task.priority))}>{task.priority}</span>
        </div>
      </div>
      {task.deadline && (
        <div className={cn('text-xs font-medium', days !== null && days < 0 ? 'text-red-400' : days === 0 ? 'text-amber-400' : 'text-muted-foreground')}>
          {days !== null && days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `Due ${formatDate(task.deadline, 'MMM d')}`}
        </div>
      )}
      <select
        value={task.assigneeId || ''}
        onChange={(e) => onUpdate(task.id, { assigneeId: e.target.value })}
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-secondary border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none"
      >
        <option value="">Unassigned</option>
        {team.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
      <select
        value={task.status}
        onChange={(e) => onUpdate(task.id, { status: e.target.value })}
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-secondary border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none"
      >
        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  );
}

function KanbanView({ tasks, allClients, team, onUpdate, engagements }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {STATUS_COLS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col);
        return (
          <div key={col} className="card-glass p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">{col}</h3>
              <span className="px-2 py-0.5 bg-secondary rounded-full text-xs text-muted-foreground">{colTasks.length}</span>
            </div>
            <div className="space-y-2">
              {colTasks.map((t) => (
                <TaskCard key={t.id} task={t} allClients={allClients} team={team} onUpdate={onUpdate} engagements={engagements} />
              ))}
              {colTasks.length === 0 && (
                <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                  No tasks
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TableView({ tasks, allClients, team, onUpdate, onDelete, engagements = [], clientsWithNoTasks = [] }) {
  return (
    <div className="card-glass overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              {['Task', 'Client', 'Engagement', 'Assignee', 'Status', 'Priority', 'Deadline', 'Notes', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const client = allClients.find((c) => c.id === task.clientId);
              const days = daysFromToday(task.deadline);
              return (
                <tr key={task.id} className="border-b border-border hover:bg-secondary/30 transition-colors group">
                  <td className="px-4 py-3 max-w-xs">
                    <InlineTextEdit value={task.name} onSave={(v) => onUpdate(task.id, { name: v })} className="text-sm font-medium" />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{client?.name || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {(() => { const eng = engagements.find(e => e.id === task.engagementId); return eng ? <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', ENG_STATUS_STYLE[eng.status] || 'bg-cyan-500/15 text-cyan-400')}>{eng.name}</span> : <span className="text-muted-foreground">—</span>; })()}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={task.assigneeId || ''}
                      onChange={(e) => onUpdate(task.id, { assigneeId: e.target.value })}
                      className="bg-secondary border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none"
                    >
                      <option value="">Unassigned</option>
                      {team.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select value={task.status} onChange={(e) => onUpdate(task.id, { status: e.target.value })} className="bg-secondary border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none">
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select value={task.priority} onChange={(e) => onUpdate(task.id, { priority: e.target.value })} className="bg-secondary border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none">
                      {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className={cn('text-xs font-medium', days !== null && days < 0 ? 'text-red-400' : days === 0 ? 'text-amber-400' : 'text-muted-foreground')}>
                      <InlineDateEdit value={task.deadline} onSave={(v) => onUpdate(task.id, { deadline: v })} />
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <InlineTextEdit value={task.notes} onSave={(v) => onUpdate(task.id, { notes: v })} placeholder="Add note..." className="text-xs" />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { if (window.confirm('Delete this task?')) onDelete(task.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {/* Clients with no tasks — shown as placeholder rows */}
            {clientsWithNoTasks.length > 0 && (
              <>
                <tr>
                  <td colSpan={9} className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40 border-t border-border bg-secondary/20">
                    Clients with no tasks
                  </td>
                </tr>
                {clientsWithNoTasks.map((client) => (
                  <tr key={`no-task-${client.id}`} className="border-b border-border/50 opacity-40">
                    <td className="px-4 py-3 text-sm text-muted-foreground italic">—</td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{client.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">—</td>
                    <td className="px-4 py-3 text-muted-foreground">—</td>
                    <td className="px-4 py-3 text-muted-foreground">—</td>
                    <td className="px-4 py-3 text-muted-foreground">—</td>
                    <td className="px-4 py-3 text-muted-foreground">—</td>
                    <td className="px-4 py-3 text-muted-foreground">—</td>
                    <td className="px-4 py-3" />
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
        {tasks.length === 0 && clientsWithNoTasks.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">No tasks match your filters</div>
        )}
      </div>
    </div>
  );
}

function CalendarView({ tasks, allClients }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const days = eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
  const startPad = (new Date(days[0]).getDay());

  return (
    <div className="card-glass p-5">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1))} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground">←</button>
        <h3 className="font-semibold text-foreground">{format(currentDate, 'MMMM yyyy')}</h3>
        <button onClick={() => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1))} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground">→</button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
        ))}
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map((day) => {
          const dayTasks = tasks.filter((t) => {
            if (!t.deadline) return false;
            try { return isSameDay(parseISO(t.deadline), day); } catch { return false; }
          });
          return (
            <div key={day.toISOString()} className={cn('min-h-[80px] p-1.5 rounded-lg border border-border', isSameDay(day, new Date()) ? 'bg-primary/10 border-primary/30' : 'hover:bg-secondary/50')}>
              <div className={cn('text-xs font-medium mb-1', isSameDay(day, new Date()) ? 'text-primary' : 'text-muted-foreground')}>{format(day, 'd')}</div>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 3).map((t) => (
                  <div key={t.id} className={cn('text-[10px] px-1 py-0.5 rounded truncate font-medium',
                    t.status === 'Completed' ? 'bg-green-500/15 text-green-400' :
                    t.priority === 'Urgent' ? 'bg-red-500/15 text-red-400' :
                    t.priority === 'High' ? 'bg-amber-500/15 text-amber-400' :
                    'bg-primary/15 text-primary'
                  )}>{t.name}</div>
                ))}
                {dayTasks.length > 3 && <div className="text-[10px] text-muted-foreground">+{dayTasks.length - 3}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AddTaskModal({ open, onClose, onAdd, team, allClients, engagements = [] }) {
  const [form, setForm] = useState({ name: '', clientId: '', engagementId: '', assigneeId: '', status: 'Not Started', priority: 'Medium', deadline: '', timeAllocated: '', notes: '' });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const clientEngagements = engagements.filter(e => e.clientId === form.clientId && !e.archived);

  return (
    <Modal open={open} onClose={onClose} title="Add New Task" size="md">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Task Name *</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Describe the task..." className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Client</label>
            <select value={form.clientId} onChange={(e) => { set('clientId', e.target.value); set('engagementId', ''); }} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none">
              <option value="">Internal / No client</option>
              {allClients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Engagement</label>
            <select value={form.engagementId} onChange={(e) => set('engagementId', e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none">
              <option value="">General / No engagement</option>
              {clientEngagements.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Assignee</label>
            <select value={form.assigneeId} onChange={(e) => set('assigneeId', e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none">
              <option value="">Unassigned</option>
              {team.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Priority</label>
            <select value={form.priority} onChange={(e) => set('priority', e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none">
              {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Deadline</label>
            <input type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Time Estimate (hrs)</label>
            <input type="number" value={form.timeAllocated} onChange={(e) => set('timeAllocated', e.target.value)} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Notes</label>
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none resize-none" />
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors">Cancel</button>
          <button
            onClick={() => { if (form.name) { onAdd({ ...form, timeAllocated: parseFloat(form.timeAllocated) || 0 }); onClose(); setForm({ name: '', clientId: '', assigneeId: '', status: 'Not Started', priority: 'Medium', deadline: '', timeAllocated: '', notes: '' }); } }}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Add Task
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function Tasks() {
  const { tasks, currentClients, upcomingClients, team, addTask, updateTask, deleteTask, engagements, clients } = useStore();
  const authz = useAuthorization();
  const allClients = [...currentClients, ...upcomingClients];
  const visibleClients = useFilteredClients(allClients);
  const clientFilteredTasks = useFilteredTasks(tasks, clients || [], engagements);
  const visibleTasks = useMyTasks(clientFilteredTasks, team);

  const [view, setView] = useState(() => sessionStorage.getItem('taskView') || 'table');
  const [showAdd, setShowAdd] = useState(false);
  const [filters, setFilters] = useState({ assignee: '', client: '', priority: '', status: '', overdueOnly: false, engagementId: '' });

  const visibleEngagements = useMemo(() => {
    if (authz?.fullAccess) return engagements;
    const allowedClientIds = new Set(visibleClients.map(c => c.id));
    return engagements.filter(e => {
      if (!allowedClientIds.has(e.clientId)) return false;
      const clientAuth = authz?.authorizedClients?.find(c => c.clientId === e.clientId);
      if (!clientAuth) return false;
      if (clientAuth.allEngagements) return true;
      return clientAuth.engagementIds.includes(e.id);
    });
  }, [engagements, visibleClients, authz]);

  const filtered = useMemo(() => {
    const clientSortIndex = (clientId) => {
      const client = visibleClients.find(c => c.id === clientId);
      if (!client) return 9999;
      const idx = CLIENT_SORT_ORDER.findIndex(name =>
        name.toLowerCase() === client.name.toLowerCase()
      );
      return idx === -1 ? 9998 : idx;
    };

    return visibleTasks
      .filter((t) => {
        if (filters.assignee && t.assigneeId !== filters.assignee) return false;
        if (filters.client && t.clientId !== filters.client) return false;
        if (filters.priority && t.priority !== filters.priority) return false;
        if (filters.status && t.status !== filters.status) return false;
        if (filters.overdueOnly) {
          const d = daysFromToday(t.deadline);
          if (t.status === 'Completed' || d === null || d >= 0) return false;
        }
        if (filters.engagementId && t.engagementId !== filters.engagementId) return false;
        return true;
      })
      .sort((a, b) => clientSortIndex(a.clientId) - clientSortIndex(b.clientId));
  }, [tasks, filters, visibleClients]);

  // Clients that have zero tasks at all (not just filtered) — show as placeholders in table view
  const clientsWithNoTasks = useMemo(() => {
    // Only show when no filters are active (otherwise confusing)
    const hasFilter = filters.assignee || filters.client || filters.priority || filters.status || filters.overdueOnly || filters.engagementId;
    if (hasFilter) return [];
    const clientIdsWithTasks = new Set(visibleTasks.map(t => t.clientId).filter(Boolean));
    return visibleClients
      .filter(c => !clientIdsWithTasks.has(c.id))
      .sort((a, b) => {
        const ia = CLIENT_SORT_ORDER.findIndex(n => n.toLowerCase() === a.name.toLowerCase());
        const ib = CLIENT_SORT_ORDER.findIndex(n => n.toLowerCase() === b.name.toLowerCase());
        return (ia === -1 ? 9998 : ia) - (ib === -1 ? 9998 : ib);
      });
  }, [visibleClients, visibleTasks, filters]);

  const exportCSV = () => {
    const headers = ['Task', 'Client', 'Assignee', 'Status', 'Priority', 'Deadline', 'Time Allocated', 'Time Taken'];
    const rows = filtered.map((t) => [
      t.name, visibleClients.find((c) => c.id === t.clientId)?.name || '', team.find((m) => m.id === t.assigneeId)?.name || '',
      t.status, t.priority, t.deadline || '', t.timeAllocated || '', t.timeTaken || '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'tasks.csv';
    a.click();
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <CheckSquare className="w-6 h-6 text-primary" />
            Task Command Center
          </h1>
          <p className="text-muted-foreground mt-1">{visibleTasks.filter((t) => t.status !== 'Completed').length} open tasks across all clients</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary text-sm font-medium text-muted-foreground hover:text-foreground border border-border transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {/* View Toggles */}
      <div className="flex items-center gap-2 flex-wrap">
        {[{ id: 'table', label: 'Table', icon: List }, { id: 'kanban', label: 'Board', icon: LayoutGrid }, { id: 'calendar', label: 'Calendar', icon: CalendarIcon }].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => { setView(id); sessionStorage.setItem('taskView', id); }} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all', view === id ? 'bg-primary/15 text-primary border-primary/30' : 'bg-secondary text-muted-foreground border-border hover:text-foreground')}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <select value={filters.assignee} onChange={(e) => setFilters((f) => ({ ...f, assignee: e.target.value }))} className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none">
          <option value="">All Members</option>
          {team.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select value={filters.client} onChange={(e) => setFilters((f) => ({ ...f, client: e.target.value }))} className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none">
          <option value="">All Clients</option>
          {visibleClients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filters.engagementId} onChange={(e) => setFilters((f) => ({ ...f, engagementId: e.target.value }))} className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none">
          <option value="">All Engagements</option>
          {visibleClients.map((c) => {
            const cEngs = visibleEngagements.filter(e => e.clientId === c.id && !e.archived);
            if (!cEngs.length) return null;
            return <optgroup key={c.id} label={c.name}>{cEngs.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</optgroup>;
          })}
        </select>
        <select value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))} className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none">
          <option value="">All Priorities</option>
          {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none">
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={() => setFilters((f) => ({ ...f, overdueOnly: !f.overdueOnly }))} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all', filters.overdueOnly ? 'bg-red-500/15 text-red-400 border-red-500/30' : 'bg-secondary text-muted-foreground border-border hover:text-foreground')}>
          <AlertTriangle className="w-3 h-3" /> Overdue Only
        </button>
        {(filters.assignee || filters.client || filters.priority || filters.status || filters.overdueOnly || filters.engagementId) && (
          <button onClick={() => setFilters({ assignee: '', client: '', priority: '', status: '', overdueOnly: false, engagementId: '' })} className="text-xs text-muted-foreground hover:text-foreground underline">Clear filters</button>
        )}
      </div>

      {/* Views */}
      {visibleTasks.length === 0 && !showAdd ? (
        <NoAccessState message="No tasks available. You'll see tasks here once you have access to client projects." />
      ) : (
        <>
          {view === 'kanban' && <KanbanView tasks={filtered} allClients={visibleClients} team={team} onUpdate={updateTask} engagements={visibleEngagements} />}
          {view === 'table' && <TableView tasks={filtered} allClients={visibleClients} team={team} onUpdate={updateTask} onDelete={deleteTask} engagements={visibleEngagements} clientsWithNoTasks={clientsWithNoTasks} />}
          {view === 'calendar' && <CalendarView tasks={filtered} allClients={visibleClients} />}
        </>
      )}

      <AddTaskModal open={showAdd} onClose={() => setShowAdd(false)} onAdd={addTask} team={team} allClients={visibleClients} engagements={visibleEngagements} />
    </div>
  );
}