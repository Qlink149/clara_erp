import { Pencil, ArrowRight, RotateCcw } from 'lucide-react';
import { cn, daysFromToday } from '@/lib/utils';
import { differenceInDays, parseISO, isValid } from 'date-fns';

const STATUS_STYLE = {
  Planning:  { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.25)' },
  Active:    { color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.25)'  },
  'On Hold': { color: '#fcd34d', bg: 'rgba(252,211,77,0.1)',  border: 'rgba(252,211,77,0.25)'  },
  Completed: { color: '#67e8f9', bg: 'rgba(103,232,249,0.1)', border: 'rgba(103,232,249,0.25)' },
  Cancelled: { color: '#fca5a5', bg: 'rgba(252,165,165,0.1)', border: 'rgba(252,165,165,0.25)' },
};

function TimelineBar({ startDate, endDate }) {
  if (!startDate) return <span className="text-xs text-muted-foreground">No start date</span>;
  if (!endDate) return <span className="text-xs text-muted-foreground">{startDate} → Ongoing</span>;
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
      <div>
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
          <span>{startDate}</span>
          <span className={overdue ? 'text-amber-400' : ''}>{endDate}</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: overdue ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'linear-gradient(90deg,#00d4ff,#0ea5e9)' }} />
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">{pct}% elapsed</p>
      </div>
    );
  } catch { return null; }
}

export default function EngagementCard({ engagement, team, tasks, onEdit, onViewDetail, archived = false, onRestore }) {
  const member = team.find(m => m.id === engagement.assigneeId);
  const engTasks = tasks.filter(t => t.engagementId === engagement.id);
  const openTasks = engTasks.filter(t => t.status !== 'Completed').length;

  const today = new Date();
  const sprints = (engagement.paymentSprints || []);
  const overdueSprints = sprints.filter(s => s.dueDate && s.status === 'Pending' && new Date(s.dueDate) < today);
  const nextPending = sprints.filter(s => s.status === 'Pending' && s.dueDate && new Date(s.dueDate) >= today).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];

  const statusStyle = STATUS_STYLE[engagement.status] || STATUS_STYLE.Planning;

  return (
    <div className={cn('card-glass p-4 space-y-3 transition-all', archived ? 'opacity-50' : 'card-hover')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground text-sm">{engagement.name}</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ color: statusStyle.color, background: statusStyle.bg, border: `1px solid ${statusStyle.border}` }}>
              {engagement.status}
            </span>
          </div>
          {engagement.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{engagement.description}</p>}
        </div>
        {!archived ? (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => onEdit(engagement)} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-cyan-400 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={() => onViewDetail(engagement)} className="p-1.5 rounded-lg hover:bg-cyan-500/10 text-muted-foreground hover:text-cyan-400 transition-colors"><ArrowRight className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <button onClick={() => onRestore(engagement)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/10 transition-colors">
            <RotateCcw className="w-3 h-3" /> Restore
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        {/* Assignee */}
        <div>
          <p className="text-muted-foreground mb-1">Team Member</p>
          {member ? (
            <div className="flex items-center gap-1.5">
              <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold', `bg-${member.color}-500/20 text-${member.color}-300`)}>{member.avatar}</div>
              <span className="text-foreground">{member.name}</span>
            </div>
          ) : <span className="text-muted-foreground">Unassigned</span>}
        </div>

        {/* POC */}
        <div>
          <p className="text-muted-foreground mb-1">Client POC</p>
          {engagement.poc?.name ? (
            <div>
              <p className="text-foreground">{engagement.poc.name}</p>
              {engagement.poc.phone && <p className="text-muted-foreground">{engagement.poc.phone}</p>}
            </div>
          ) : <span className="text-muted-foreground">—</span>}
        </div>

        {/* Tasks */}
        <div>
          <p className="text-muted-foreground mb-1">Tasks</p>
          <span className="text-foreground">{openTasks}/{engTasks.length} open</span>
        </div>

        {/* Next Payment */}
        <div>
          <p className="text-muted-foreground mb-1">Next Payment</p>
          {overdueSprints.length > 0 ? (
            <span className="text-red-400 font-semibold">OVERDUE: {overdueSprints[0].name}</span>
          ) : nextPending ? (
            <span className="text-foreground">{nextPending.name} · {nextPending.dueDate}</span>
          ) : <span className="text-muted-foreground">—</span>}
        </div>
      </div>

      {/* Timeline */}
      <TimelineBar startDate={engagement.startDate} endDate={engagement.expectedEndDate} />

      {(engagement.tags || []).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {engagement.tags.map(t => <span key={t} className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px]">{t}</span>)}
        </div>
      )}
    </div>
  );
}