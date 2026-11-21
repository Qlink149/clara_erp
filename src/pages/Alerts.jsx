import { useMemo, useState } from 'react';
import { Bell, AlertTriangle, Clock, Users, FileText, Calendar, CheckCircle, Moon, ChevronDown, Lock } from 'lucide-react';
import { cn, computeAlerts, formatDate, daysFromToday } from '@/lib/utils';
import { useStore } from '@/lib/StoreContext';
import { useAuthorization, useFilteredClients, useFilteredTasks } from '@/lib/AuthorizationContext';

const CATEGORIES = [
  { id: 'all', label: 'All Alerts', icon: Bell },
  { id: 'task-overdue', label: 'Overdue Tasks', icon: AlertTriangle },
  { id: 'sprint-overdue', label: 'Payment Sprints', icon: FileText },
  { id: 'pending-item', label: 'Pending Items', icon: FileText },
  { id: 'upcoming-deadline', label: 'Upcoming (48h)', icon: Clock },
  { id: 'followup', label: 'Follow-ups', icon: Calendar },
  { id: 'overloaded', label: 'Overloaded Team', icon: Users },
  { id: 'contract', label: 'Contract End', icon: FileText },
];

const SEVERITY_STYLES = {
  Critical: { badge: 'badge-red', border: 'border-red-500/25 bg-red-500/5' },
  Warning: { badge: 'badge-amber', border: 'border-amber-500/25 bg-amber-500/5' },
  Info: { badge: 'badge-blue', border: 'border-blue-500/25 bg-blue-500/5' },
};

export default function Alerts({ onNavigate }) {
  const { currentClients, tasks, team, resolvedAlerts, snoozedAlerts, resolveAlert, snoozeAlert, engagements, clients } = useStore();
  const authz = useAuthorization();
  const isUnauthorized = authz?.role === 'UNAUTHORIZED' || (authz && !authz.fullAccess && authz.authorizedClients?.length === 0 && authz.role !== 'SUPER_ADMIN');
  const visibleCurrentClients = useFilteredClients(currentClients);
  const visibleTasks = useFilteredTasks(tasks, clients || [], engagements);
  const [activeCategory, setActiveCategory] = useState('all');
  const [snoozeOpenFor, setSnoozeOpenFor] = useState(null);

  const alerts = useMemo(() =>
    computeAlerts(visibleCurrentClients, visibleTasks, team, resolvedAlerts, snoozedAlerts, engagements),
    [visibleCurrentClients, visibleTasks, team, resolvedAlerts, snoozedAlerts, engagements]
  );

  const filtered = activeCategory === 'all' ? alerts : alerts.filter((a) => a.type === activeCategory);

  const criticalCount = alerts.filter((a) => a.severity === 'Critical').length;
  const warningCount = alerts.filter((a) => a.severity === 'Warning').length;
  const infoCount = alerts.filter((a) => a.severity === 'Info').length;

  const getMember = (id) => team.find((m) => m.id === id);

  if (isUnauthorized) {
    return (
      <div className="p-6 animate-fade-in">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Bell className="w-6 h-6 text-primary" />
              Alerts & Reminders
            </h1>
          </div>
        </div>
        <div className="card-glass p-16 text-center">
          <Lock className="w-12 h-12 text-primary/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No Access</h3>
          <p className="text-muted-foreground mt-2">You don't have access to any projects yet. Contact Yogansh to get authorized.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Bell className="w-6 h-6 text-primary" />
            Alerts & Reminders
          </h1>
          <p className="text-muted-foreground mt-1">Centralized hub for everything that needs attention</p>
        </div>
        <div className="flex gap-3">
          <div className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
            <div className="text-lg font-bold text-red-400">{criticalCount}</div>
            <div className="text-xs text-muted-foreground">Critical</div>
          </div>
          <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
            <div className="text-lg font-bold text-amber-400">{warningCount}</div>
            <div className="text-xs text-muted-foreground">Warning</div>
          </div>
          <div className="px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
            <div className="text-lg font-bold text-blue-400">{infoCount}</div>
            <div className="text-xs text-muted-foreground">Info</div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const count = cat.id === 'all' ? alerts.length : alerts.filter((a) => a.type === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
                activeCategory === cat.id
                  ? 'bg-primary/15 text-primary border-primary/30'
                  : 'bg-secondary text-muted-foreground border-border hover:text-foreground'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
              {count > 0 && (
                <span className={cn('ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold',
                  activeCategory === cat.id ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                )}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Alert List */}
      {filtered.length === 0 ? (
        <div className="card-glass p-16 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">All clear!</h3>
          <p className="text-muted-foreground mt-1">No alerts in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => {
            const styles = SEVERITY_STYLES[alert.severity];
            const member = alert.assigneeId ? getMember(alert.assigneeId) : null;
            return (
              <div key={alert.id} className={cn('card-glass p-4 border', styles.border)}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={cn('px-2 py-0.5 rounded text-xs font-semibold border', styles.badge)}>
                        {alert.severity}
                      </span>
                      <span className="text-sm font-semibold text-foreground">{alert.title}</span>
                      {alert.daysOverdue && (
                        <span className="text-xs font-bold text-destructive">{alert.daysOverdue}d overdue</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                    {alert.clientId && (
                      <button
                        onClick={() => {
                          const client = visibleCurrentClients.find((c) => c.id === alert.clientId);
                          if (client) onNavigate('clients', client);
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        View client →
                      </button>
                    )}
                    {member && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold', `bg-${member.color}-500/20 text-${member.color}-300`)}>
                          {member.avatar}
                        </div>
                        <span className="text-xs text-muted-foreground">{member.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Snooze */}
                    <div className="relative">
                      <button
                        onClick={() => setSnoozeOpenFor(snoozeOpenFor === alert.id ? null : alert.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary hover:bg-secondary/80 text-muted-foreground transition-colors border border-border"
                      >
                        <Moon className="w-3 h-3" />
                        Snooze
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      {snoozeOpenFor === alert.id && (
                        <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-xl z-20 overflow-hidden min-w-[120px]">
                          {[1, 3, 7].map((days) => (
                            <button
                              key={days}
                              onClick={() => { snoozeAlert(alert.id, days); setSnoozeOpenFor(null); }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-secondary text-foreground transition-colors"
                            >
                              {days} day{days > 1 ? 's' : ''}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Resolve */}
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/15 hover:bg-green-500/25 text-green-400 transition-colors border border-green-500/20"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Resolve
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}