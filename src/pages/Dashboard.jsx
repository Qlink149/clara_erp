import { useState, useMemo } from 'react';
import { format, isToday, parseISO, isWithinInterval, addDays, isValid } from 'date-fns';
import { AlertTriangle, CheckSquare, Users, Building2, Clock, Plus, TrendingUp, Activity, Calendar, Zap, ArrowUpRight, Lock, ListChecks } from 'lucide-react';
import { cn, formatRelative, daysFromToday, computeAlerts } from '@/lib/utils';
import { useStore } from '@/lib/StoreContext';
import Modal from '@/components/ui/Modal';
import { useAuthorization, useFilteredClients, useFilteredTasks, useMyTasks } from '@/lib/AuthorizationContext';
import NoAccessState from '@/components/ui/NoAccessState';

function StatCard({ label, value, icon: Icon, color = 'cyan', alert = false }) {
  const palette = {
    cyan:   { bg: '#ffffff', border: 'rgba(31,7,152,0.18)',  text: '#1f0798', glow: 'rgba(31,7,152,0.14)' },
    violet: { bg: '#ffffff', border: 'rgba(93,39,202,0.2)',  text: '#5d27ca', glow: 'rgba(93,39,202,0.14)' },
    amber:  { bg: '#ffffff', border: 'rgba(245,158,11,0.3)', text: '#b45309', glow: 'rgba(245,158,11,0.16)' },
    red:    { bg: '#ffffff', border: 'rgba(210,95,134,0.3)', text: '#a83060', glow: 'rgba(210,95,134,0.16)' },
    green:  { bg: '#ffffff', border: 'rgba(34,176,125,0.3)', text: '#0f7a55', glow: 'rgba(34,176,125,0.16)' },
    primary:{ bg: '#ffffff', border: 'rgba(31,7,152,0.18)',  text: '#1f0798', glow: 'rgba(31,7,152,0.14)' },
  };
  const c = alert && value > 0 ? palette.red : (palette[color] || palette.cyan);

  return (
    <div className="relative rounded-2xl p-5 flex flex-col gap-3 overflow-hidden card-hover transition-all duration-300 cursor-default hud-corner"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
    >
      <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-30 blur-2xl pointer-events-none"
        style={{ background: c.glow }} />

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: c.text, opacity: 0.8 }}>{label}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: c.bg, border: `1px solid ${c.border}` }}>
          <Icon className="w-4 h-4" style={{ color: c.text }} />
        </div>
      </div>
      <div className="text-4xl font-bold tracking-tight" style={{ color: c.text }}>
        {value}
      </div>
      <div className="h-px w-full" style={{ background: `linear-gradient(90deg, ${c.border}, transparent)` }} />
    </div>
  );
}

function AlertCard({ alert, onResolve, team = [] }) {
  const cfgs = {
    Critical: { border: 'rgba(210,95,134,0.4)', bg: 'rgba(210,95,134,0.06)', tag: '#a83060', tagBg: 'rgba(210,95,134,0.1)', tagBorder: 'rgba(210,95,134,0.3)' },
    Warning:  { border: 'rgba(245,158,11,0.4)', bg: 'rgba(245,158,11,0.06)', tag: '#b45309', tagBg: 'rgba(245,158,11,0.12)', tagBorder: 'rgba(245,158,11,0.3)' },
    Info:     { border: 'rgba(93,39,202,0.25)', bg: 'rgba(93,39,202,0.04)',  tag: '#5d27ca', tagBg: 'rgba(93,39,202,0.08)', tagBorder: 'rgba(93,39,202,0.25)' },
  };
  const c = cfgs[alert.severity] || cfgs.Info;
  const assignee = alert.assigneeId ? team.find((x) => x.id === alert.assigneeId) : null;

  return (
    <div className="relative rounded-xl p-3 flex items-start justify-between gap-3 overflow-hidden"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
            style={{ color: c.tag, background: c.tagBg, border: `1px solid ${c.tagBorder}` }}>
            {alert.severity}
          </span>
          <span className="text-xs font-semibold text-foreground truncate">{alert.title}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{alert.description}</p>
        {assignee && (
          <p className="text-[10px] text-muted-foreground mt-1">
            Assigned to <span className="font-semibold" style={{ color: c.tag }}>{assignee.name}</span>
          </p>
        )}
      </div>
      <button
        onClick={() => onResolve(alert.id)}
        className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
      >
        Dismiss
      </button>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, iconColor = '#5d27ca', action, onAction }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm tracking-wide">
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
        <span className="uppercase tracking-widest text-[11px] font-bold text-foreground/80">{title}</span>
      </h2>
      {action && (
        <button onClick={onAction} className="text-[10px] tracking-widest uppercase font-semibold transition-colors flex items-center gap-1"
          style={{ color: 'rgba(93,39,202,0.7)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#1f0798'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(93,39,202,0.7)'}
        >
          {action} <ArrowUpRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function getFirstName(authz, team) {
  if (!authz?.user) return null;
  const email = authz.user.email;
  // Check team members first
  const member = team.find(m => m.email && m.email.toLowerCase() === email.toLowerCase());
  if (member?.name) return member.name.split(' ')[0];
  // Fall back to full_name from auth profile
  if (authz.user.full_name) return authz.user.full_name.split(' ')[0];
  return null;
}

const PRIORITY_ORDER = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
const PRIORITY_STYLE = {
  Urgent: { color: '#a83060', bg: 'rgba(210,95,134,0.1)',  border: 'rgba(210,95,134,0.3)'  },
  High:   { color: '#b45309', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)'  },
  Medium: { color: '#5d27ca', bg: 'rgba(93,39,202,0.08)',  border: 'rgba(93,39,202,0.2)'   },
  Low:    { color: '#6d668d', bg: 'rgba(12,8,40,0.04)',    border: 'rgba(12,8,40,0.1)'     },
};

function MyPendingTasks({ visibleTasks, team, authz, getClientName, getMember, onNavigate }) {
  // visibleTasks is already filtered to current user's scope by useMyTasks
  const pendingTasks = useMemo(() => {
    return visibleTasks
      .filter(t => t.status !== 'Completed')
      .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4));
  }, [visibleTasks]);

  return (
    <div className="card-glass p-5">
      <SectionHeader
        icon={ListChecks}
        title="My Pending Tasks"
        iconColor="#5d27ca"
        action="View All"
        onAction={() => onNavigate('tasks')}
      />
      {pendingTasks.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-2xl mb-2">✦</div>
          <p className="text-sm text-muted-foreground tracking-wide">No pending tasks — you're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {pendingTasks.slice(0, 15).map((t) => {
            const m = getMember(t.assigneeId);
            const p = PRIORITY_STYLE[t.priority] || PRIORITY_STYLE.Low;
            const days = daysFromToday(t.deadline);
            const isOverdue = days !== null && days < 0;
            return (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(12,8,40,0.03)', border: `1px solid ${isOverdue ? 'rgba(210,95,134,0.35)' : 'rgba(12,8,40,0.07)'}` }}
              >
                {/* Priority badge */}
                <span className="flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: p.color, background: p.bg, border: `1px solid ${p.border}` }}>
                  {t.priority}
                </span>
                {/* Task name + client */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground tracking-wider">
                    {getClientName(t.clientId)}{m ? ` · ${m.name}` : ''}
                  </p>
                </div>
                {/* Deadline */}
                {t.deadline && (
                  <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-lg"
                    style={isOverdue
                      ? { color: '#a83060', background: 'rgba(210,95,134,0.1)', border: '1px solid rgba(210,95,134,0.3)' }
                      : { color: '#5d27ca', background: 'rgba(93,39,202,0.06)', border: '1px solid rgba(93,39,202,0.15)' }
                    }>
                    {isOverdue ? `${Math.abs(days)}d overdue` : days === 0 ? 'TODAY' : `+${days}d`}
                  </span>
                )}
                {/* Status */}
                <span className="flex-shrink-0 text-[10px] text-muted-foreground">{t.status}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Dashboard({ onNavigate }) {
  const { currentClients, upcomingClients, tasks, team, activityLog, resolvedAlerts, snoozedAlerts, resolveAlert, engagements, clients } = useStore();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const authz = useAuthorization();
  const isSuperAdmin = authz?.role === 'SUPER_ADMIN';
  const isUnauthorized = authz?.role === 'UNAUTHORIZED' || (authz && !authz.fullAccess && authz.authorizedClients?.length === 0 && authz.role !== 'SUPER_ADMIN');
  const firstName = getFirstName(authz, team);

  // Filtered data based on authorization
  const visibleCurrentClients = useFilteredClients(currentClients);
  const allVisibleClients = useFilteredClients(clients || []);
  const clientFilteredTasks = useFilteredTasks(tasks, clients, engagements);
  const visibleTasks = useMyTasks(clientFilteredTasks, team);
  const visibleActivityLog = useMemo(() => {
    if (isSuperAdmin) return activityLog;
    const allowedIds = new Set(allVisibleClients.map(c => c.id));
    return activityLog.filter(e => allowedIds.has(e.clientId));
  }, [activityLog, allVisibleClients, isSuperAdmin]);

  const alerts = useMemo(() =>
    computeAlerts(visibleCurrentClients, visibleTasks, team, resolvedAlerts, snoozedAlerts, engagements),
    [visibleCurrentClients, visibleTasks, team, resolvedAlerts, snoozedAlerts, engagements]
  );

  const openTasks = visibleTasks.filter((t) => t.status !== 'Completed');
  const overdueTasks = visibleTasks.filter((t) => {
    if (t.status === 'Completed') return false;
    const d = daysFromToday(t.deadline);
    return d !== null && d < 0;
  });
  const pendingItems = visibleCurrentClients.flatMap((c) => c.pendingItems || []).filter((p) => p.status === 'Awaiting');

  const todaysTasks = visibleTasks.filter((t) => {
    if (!t.deadline) return false;
    try { return isToday(parseISO(t.deadline)); } catch { return false; }
  });

  const next7DaysTasks = useMemo(() => {
    const now = new Date();
    const end = addDays(now, 7);
    return visibleTasks
      .filter((t) => {
        if (!t.deadline || t.status === 'Completed') return false;
        try {
          const d = parseISO(t.deadline);
          return isValid(d) && isWithinInterval(d, { start: now, end });
        } catch { return false; }
      })
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  }, [visibleTasks]);

  // criticalAlerts kept for possible future use but not displayed on dashboard

  // Workload: non-admins see only their own bar
  const workloadTeam = isSuperAdmin ? team : team.filter(m => m.email === authz?.email);

  const getClientName = (clientId) => {
    if (!clientId) return 'Internal';
    const all = [...currentClients, ...upcomingClients];
    return all.find((c) => c.id === clientId)?.name || clientId;
  };
  const getMember = (id) => team.find((m) => m.id === id);

  const workloadData = workloadTeam.map((m) => {
    const memberTasks = visibleTasks.filter((t) => t.assigneeId === m.id && t.status !== 'Completed');
    const pct = Math.min(100, Math.round((memberTasks.length / 8) * 100));
    return { ...m, taskCount: memberTasks.length, workload: pct };
  });

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #5d27ca, rgba(93,39,202,0.2))' }} />
            <span className="text-[10px] tracking-widest uppercase font-semibold text-cyan-500/60">Operations Command</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {firstName ? `Welcome back, ${firstName}` : 'Welcome to Clara Command'}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm tracking-wide">
            {firstName ? format(new Date(), 'EEEE, MMMM d, yyyy') : 'Your operations hub for all clients and projects.'}
          </p>
        </div>
        <button
          onClick={() => setShowQuickAdd(true)}
          className="btn-primary-cyber flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
        >
          <Zap className="w-4 h-4" /> Quick Add
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Active Clients"  value={visibleCurrentClients.length}  icon={Building2}     color="violet" />
        <StatCard label="Team Members"    value={team.length}                    icon={Users}         color="cyan"   />
        <StatCard label="Open Tasks"      value={openTasks.length}               icon={CheckSquare}   color="amber"  />
        <StatCard label="Overdue Tasks"   value={overdueTasks.length}            icon={AlertTriangle} color="red"    alert />
        <StatCard label="Pending Items"   value={pendingItems.length}            icon={Clock}         color="primary"/>
      </div>

      {/* My Pending Tasks */}
      {!isUnauthorized && <MyPendingTasks
        visibleTasks={visibleTasks}
        team={team}
        authz={authz}
        getClientName={getClientName}
        getMember={getMember}
        onNavigate={onNavigate}
      />}

      {/* Team Workload — hidden for unauthorized users */}
      {!isUnauthorized && <div className="card-glass p-5">
        <SectionHeader icon={TrendingUp} title="Team Workload" iconColor="#8d57de" />
        <div className="space-y-4">
          {workloadData.map((m) => {
            const barColor = m.workload < 60
              ? { from: '#22b07d', to: '#4cc99a', glow: 'rgba(34,176,125,0.3)' }
              : m.workload < 85
              ? { from: '#f59e0b', to: '#fbbf24', glow: 'rgba(245,158,11,0.3)' }
              : { from: '#d25f86', to: '#e18aa8', glow: 'rgba(210,95,134,0.3)' };
            return (
              <div key={m.id} className="flex items-center gap-4">
                <div className={cn('w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold', `bg-${m.color}-500/20 text-${m.color}-300`)}>
                  {m.avatar}
                </div>
                <div className="w-24 flex-shrink-0">
                  <span className="text-xs font-semibold text-foreground tracking-wide">{m.name}</span>
                  <p className="text-[10px] text-muted-foreground tracking-wider">{m.taskCount} active tasks</p>
                </div>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(12,8,40,0.08)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${m.workload}%`,
                      background: `linear-gradient(90deg, ${barColor.from}, ${barColor.to})`,
                      boxShadow: `0 0 8px ${barColor.glow}`,
                    }}
                  />
                </div>
                <span className="text-xs font-bold w-8 text-right flex-shrink-0"
                  style={{ color: m.workload < 60 ? '#0f7a55' : m.workload < 85 ? '#b45309' : '#a83060' }}>
                  {m.workload}%
                </span>
              </div>
            );
          })}
        </div>
      </div>}

      {/* Due Today + Next 7 Days — hidden for unauthorized users */}
      {!isUnauthorized && <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Due Today */}
        <div className="card-glass p-5">
          <SectionHeader icon={Calendar} title="Due Today" iconColor="#b45309" />
          {todaysTasks.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground tracking-wide">Nothing due today ✦</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todaysTasks.map((t) => {
                const m = getMember(t.assigneeId);
                const statusCfg = {
                  'Completed':   { color: '#0f7a55', bg: 'rgba(34,176,125,0.1)',  border: 'rgba(34,176,125,0.25)' },
                  'In Progress': { color: '#5d27ca', bg: 'rgba(93,39,202,0.08)',  border: 'rgba(93,39,202,0.2)'   },
                  'Not Started': { color: '#6d668d', bg: 'rgba(12,8,40,0.04)',    border: 'rgba(12,8,40,0.12)'    },
                }[t.status] || { color: '#6d668d', bg: 'rgba(12,8,40,0.04)', border: 'rgba(12,8,40,0.12)' };
                return (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                    style={{ background: 'rgba(12,8,40,0.03)', border: '1px solid rgba(12,8,40,0.07)' }}
                  >
                    <div className={cn('w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold',
                      m ? `bg-${m.color}-500/20 text-${m.color}-300` : 'bg-secondary text-muted-foreground'
                    )}>{m?.avatar || '?'}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate tracking-wide">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground tracking-wider">{getClientName(t.clientId)}{m ? ` · ${m.name}` : ''}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex-shrink-0"
                      style={{ color: statusCfg.color, background: statusCfg.bg, border: `1px solid ${statusCfg.border}` }}>
                      {t.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Next 7 Days */}
        <div className="card-glass p-5">
          <SectionHeader icon={Clock} title="Next 7 Days" iconColor="#5d27ca" />
          {next7DaysTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6 tracking-wide">No upcoming deadlines</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {next7DaysTasks.slice(0, 10).map((t) => {
                const m = getMember(t.assigneeId);
                const days = daysFromToday(t.deadline);
                const isUrgent = days !== null && days <= 2;
                return (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                    style={{ background: 'rgba(12,8,40,0.03)', border: `1px solid ${isUrgent ? 'rgba(245,158,11,0.35)' : 'rgba(12,8,40,0.07)'}` }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate tracking-wide">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground tracking-wider">{getClientName(t.clientId)} · {m?.name}</p>
                    </div>
                    <span className="text-[10px] font-bold flex-shrink-0 px-2 py-0.5 rounded-lg tracking-widest"
                      style={isUrgent
                        ? { color: '#b45309', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }
                        : { color: '#5d27ca', background: 'rgba(93,39,202,0.06)', border: '1px solid rgba(93,39,202,0.15)' }
                      }>
                      {days === 0 ? 'TODAY' : `+${days}d`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>}

      {/* Quick Add Modal */}
      <Modal open={showQuickAdd} onClose={() => setShowQuickAdd(false)} title="Quick Add" size="sm">
        <div className="space-y-3">
          {[
            { label: '+ New Task',   page: 'tasks',   color: { text: '#1f0798', bg: 'rgba(31,7,152,0.06)',   border: 'rgba(31,7,152,0.18)'   } },
            { label: '+ New Client', page: 'clients', color: { text: '#5d27ca', bg: 'rgba(93,39,202,0.08)',  border: 'rgba(93,39,202,0.2)'   } },
            { label: '+ View Team',  page: 'team',    color: { text: '#b45309', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)'  } },
          ].map((item) => (
            <button
              key={item.page}
              onClick={() => { setShowQuickAdd(false); onNavigate(item.page); }}
              className="w-full text-left px-4 py-3.5 rounded-xl font-semibold text-sm transition-all tracking-wide uppercase"
              style={{ color: item.color.text, background: item.color.bg, border: `1px solid ${item.color.border}` }}
              onMouseEnter={(e) => { e.currentTarget.style.background = item.color.bg.replace('0.08', '0.15'); }}
              onMouseLeave={(e) => { e.currentTarget.style.background = item.color.bg; }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}