import { useMemo } from 'react';
import { Building2, AlertTriangle, Clock, Users, Activity } from 'lucide-react';
import { cn, formatRelative, daysFromToday } from '@/lib/utils';
import { useStore } from '@/lib/StoreContext';

export default function ClientAnalytics() {
  const { currentClients, upcomingClients, pastClients, tasks, team, activityLog } = useStore();

  const overdueTasks = tasks.filter((t) => {
    if (t.status === 'Completed') return false;
    const d = daysFromToday(t.deadline);
    return d !== null && d < 0;
  }).filter((t) => currentClients.find((c) => c.id === t.clientId));

  const pendingItems = currentClients.flatMap((c) => c.pendingItems || []).filter((p) => p.status === 'Awaiting');

  const memberWorkload = team.map((m) => {
    const clientCount = currentClients.filter((c) => c.assignedTeam?.includes(m.id)).length;
    return { ...m, clientCount };
  }).sort((a, b) => b.clientCount - a.clientCount);

  const topMember = memberWorkload[0];

  const stats = [
    { label: 'Current Clients', value: currentClients.length, icon: Building2, color: 'violet' },
    { label: 'Upcoming Clients', value: upcomingClients.length, icon: Building2, color: 'cyan' },
    { label: 'Past Clients', value: pastClients.length, icon: Building2, color: 'gray' },
    { label: 'Overdue Tasks', value: overdueTasks.length, icon: AlertTriangle, color: 'red', alert: overdueTasks.length > 0 },
    { label: 'Pending Items', value: pendingItems.length, icon: Clock, color: 'amber' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={cn('card-glass p-4', s.alert && 'border-red-500/30 bg-red-500/5')}>
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-3',
                s.color === 'violet' && 'bg-violet-500/15 text-violet-400',
                s.color === 'cyan' && 'bg-cyan-500/15 text-cyan-400',
                s.color === 'amber' && 'bg-amber-500/15 text-amber-400',
                s.color === 'red' && 'bg-red-500/15 text-red-400',
                s.color === 'gray' && 'bg-muted text-muted-foreground',
              )}>
                <Icon className="w-4 h-4" />
              </div>
              <div className={cn('text-2xl font-bold mb-0.5', s.alert ? 'text-red-400' : 'text-foreground')}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Top Member Workload */}
      {topMember && (
        <div className="card-glass p-5">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-primary" />
            Team Client Workload
          </h3>
          <div className="space-y-3">
            {memberWorkload.map((m) => (
              <div key={m.id} className="flex items-center gap-4">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0', `bg-${m.color}-500/20 text-${m.color}-300`)}>{m.avatar}</div>
                <div className="w-32 flex-shrink-0">
                  <p className="text-sm font-medium text-foreground">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.clientCount} client{m.clientCount !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, (m.clientCount / Math.max(...memberWorkload.map((x) => x.clientCount), 1)) * 100)}%` }}
                  />
                </div>
                {m.id === topMember.id && (
                  <span className="text-xs font-semibold text-primary flex-shrink-0">Highest</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="card-glass p-5">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-cyan-400" />
          Recent Activity
        </h3>
        <div className="space-y-3">
          {activityLog.slice(0, 5).map((entry) => (
            <div key={entry.id} className="flex gap-3 items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{entry.action}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatRelative(entry.date)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}