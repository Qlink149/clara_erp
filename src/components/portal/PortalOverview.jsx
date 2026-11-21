import { useMemo } from 'react';
import { ArrowRight, CheckCircle, AlertCircle, Clock, Lock } from 'lucide-react';
import { cn, daysFromToday, formatDate } from '@/lib/utils';
import { format } from 'date-fns';

const STATUS_STYLE = {
  Active:    { color: '#6ee7b7', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)'  },
  Planning:  { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' },
  'On Hold': { color: '#fcd34d', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)'  },
  Completed: { color: '#67e8f9', bg: 'rgba(0,212,255,0.1)',   border: 'rgba(0,212,255,0.2)'   },
  Cancelled: { color: '#fca5a5', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)'   },
};

function CircularProgress({ pct }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90">
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
        <circle cx="44" cy="44" r={r} fill="none" stroke="#F59E0B" strokeWidth="7"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-amber-400">{pct}%</span>
      </div>
    </div>
  );
}

function EngagementCard({ engagement, tasks, pendingItems, onNavigate }) {
  const engTasks = tasks.filter(t => t.engagementId === engagement.id);
  const completedTasks = engTasks.filter(t => t.status === 'Completed');
  const pct = engTasks.length > 0 ? Math.round((completedTasks.length / engTasks.length) * 100) : 0;
  const status = engagement.status || 'Active';
  const style = STATUS_STYLE[status] || STATUS_STYLE.Active;

  const pending = pendingItems.filter(p => p.status === 'Awaiting');
  const nextDeadline = engTasks
    .filter(t => t.status !== 'Completed' && t.deadline)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0];

  const days = engagement.endDate ? daysFromToday(engagement.endDate) : null;

  return (
    <div className="rounded-2xl p-6 border border-amber-500/10 bg-card hover:border-amber-500/25 transition-all duration-300 flex flex-col gap-5"
      style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.03) 0%, rgba(4,8,18,0.8) 100%)' }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-foreground leading-tight">{engagement.name}</h3>
          <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold"
            style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }}>
            {status}
          </span>
        </div>
        <CircularProgress pct={pct} />
      </div>

      {/* Timeline bar */}
      {engagement.startDate && engagement.endDate && (
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Started {format(new Date(engagement.startDate), 'MMM d, yyyy')}</span>
            <span className={cn(days !== null && days < 0 ? 'text-red-400' : 'text-muted-foreground')}>
              {days !== null && days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : days !== null ? `${days}d remaining` : ''} · Target {format(new Date(engagement.endDate), 'MMM d, yyyy')}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full bg-amber-500/60" style={{ width: `${pct}%`, transition: 'width 1s ease' }} />
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-3 bg-secondary/40 border border-border">
          <p className="text-xs text-muted-foreground">Completed Tasks</p>
          <p className="text-base font-bold text-foreground mt-0.5">{completedTasks.length} / {engTasks.length}</p>
        </div>
        <div className="rounded-xl p-3 bg-secondary/40 border border-border">
          <p className="text-xs text-muted-foreground">Next Deadline</p>
          <p className="text-sm font-bold text-foreground mt-0.5">
            {nextDeadline ? formatDate(nextDeadline.deadline, 'MMM d') : 'None'}
          </p>
        </div>
      </div>

      {/* Pending items badge */}
      {pending.length > 0 ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-500/30 bg-amber-500/8">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-sm text-amber-300 font-medium">{pending.length} action{pending.length > 1 ? 's' : ''} required from you</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-green-500/20 bg-green-500/5">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
          <span className="text-sm text-green-300 font-medium">Nothing pending from your side</span>
        </div>
      )}

      <button
        onClick={() => onNavigate(`engagement-${engagement.id}`, engagement.id)}
        className="w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
        style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.25)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.15)'; }}
      >
        View Details <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function PortalOverview({ client, engagements, tasks, userName, onNavigate }) {
  const allPendingItems = (client?.pendingItems || []);

  if (engagements.length === 0) {
    return (
      <div className="p-6 md:p-10 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <Lock className="w-8 h-8 text-amber-400" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-3">Your projects will appear here soon</h2>
          <p className="text-muted-foreground leading-relaxed">
            Once Clara sets up your access, you'll be able to track all your project progress here. Contact{' '}
            <a href="mailto:yogansh@claraai.tech" className="text-amber-400 hover:underline">yogansh@claraai.tech</a>{' '}
            if you need immediate access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-xs tracking-widest uppercase text-amber-500/60 font-semibold mb-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        <h1 className="text-3xl font-bold"
          style={{ background: 'linear-gradient(135deg, #fff 0%, rgba(245,158,11,0.8) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Welcome, {userName}
        </h1>
        {client && <p className="text-muted-foreground mt-1 text-lg">{client.name}</p>}
      </div>

      {/* Engagement cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {engagements.map(eng => (
          <EngagementCard
            key={eng.id}
            engagement={eng}
            tasks={tasks}
            pendingItems={allPendingItems.filter(p =>
              eng.id ? true : true // show all for this client
            )}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}