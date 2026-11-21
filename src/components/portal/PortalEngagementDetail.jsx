import { useState } from 'react';
import { CheckCircle, Clock, AlertTriangle, PauseCircle, XCircle, ArrowLeft, ChevronDown, ChevronRight, Send, MessageCircle } from 'lucide-react';
import { cn, daysFromToday, formatDate } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { base44 } from '@/api/base44Client';

const STATUS_STYLE = {
  Active:    { color: '#6ee7b7', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)'  },
  Planning:  { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' },
  'On Hold': { color: '#fcd34d', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)'  },
  Completed: { color: '#67e8f9', bg: 'rgba(0,212,255,0.1)',   border: 'rgba(0,212,255,0.2)'   },
  Cancelled: { color: '#fca5a5', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)'   },
};

function CircularGauge({ pct }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative w-32 h-32">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="#F59E0B" strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-amber-400">{pct}%</span>
        <span className="text-[10px] text-muted-foreground">complete</span>
      </div>
    </div>
  );
}

function taskStatusIcon(status, deadline) {
  const days = daysFromToday(deadline);
  if (status === 'Completed') return <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />;
  if (status === 'Blocked' || (status !== 'Completed' && days !== null && days < 0))
    return <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />;
  if (status === 'In Progress') return <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin flex-shrink-0" />;
  if (status === 'On Hold') return <PauseCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />;
  return <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />;
}

function translateActivity(entry) {
  const a = entry.action || '';
  if (a.includes('marked as Completed') || a.includes('status changed to Completed') || a.includes('has been completed'))
    return { icon: '✅', text: a.replace(/Task\s+"?([^"]+)"?\s+marked as Completed/i, '$1 has been completed').replace(/status changed to Completed/i, 'has been completed') };
  if (a.includes('status changed to In Progress') || a.includes('Work has started'))
    return { icon: '🔄', text: a.replace(/Task\s+"?([^"]+)"?\s+status changed to In Progress/i, 'Work has started on $1') };
  if (a.includes('status changed to Not Started')) return null;
  if (a.includes('status changed to Blocked'))
    return { icon: '⚠️', text: a.replace(/Task\s+"?([^"]+)"?\s+status changed to Blocked/i, '$1 is temporarily paused — our team is working on resolving this') };
  if (a.includes('status changed to On Hold'))
    return { icon: '⏸️', text: a.replace(/Task\s+"?([^"]+)"?\s+status changed to On Hold/i, '$1 has been placed on hold') };
  if (a.includes('New task') && a.includes('created'))
    return { icon: '📋', text: a.replace(/New task\s+"?([^"]+)"?\s+created/i, 'New milestone added: $1') };
  if (a.includes('Pending item') && a.includes('added'))
    return { icon: '📬', text: a.replace(/Pending item\s+"?([^"]+)"?\s+added/i, "We've requested something from you: $1") };
  if (a.includes('Pending item') && (a.includes('received') || a.includes('Received')))
    return { icon: '✅', text: a.replace(/Pending item\s+"?([^"]+)"?\s+received/i, 'We received $1 from you — thank you!') };
  if (a.includes('marked as sent via Client Portal'))
    return { icon: '✅', text: a.replace(/Pending item "?([^"]+)"? marked as sent via Client Portal/i, 'You marked "$1" as sent') };
  // Skip internal entries
  if (a.includes('team discussion') || a.includes('internal') || a.includes('note')) return null;
  return null;
}

export default function PortalEngagementDetail({ engagement, tasks, client, team, documents, portalAccessLevel, onBack }) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [sentItems, setSentItems] = useState({});
  const [sendingItem, setSendingItem] = useState(null);

  if (!engagement) return null;

  const engTasks = tasks.filter(t => t.engagementId === engagement.id);
  const completedTasks = engTasks.filter(t => t.status === 'Completed');
  const pct = engTasks.length > 0 ? Math.round((completedTasks.length / engTasks.length) * 100) : 0;

  const status = engagement.status || 'Active';
  const style = STATUS_STYLE[status] || STATUS_STYLE.Active;
  const days = engagement.endDate ? daysFromToday(engagement.endDate) : null;

  const pendingItems = (client?.pendingItems || []);
  const awaitingItems = pendingItems.filter(p => p.status === 'Awaiting');
  const receivedItems = pendingItems.filter(p => p.status === 'Received');

  const activityLog = (client?.activityLog || [])
    .filter(e => !e.source || e.source !== 'internal_only')
    .map(e => ({ ...e, translated: translateActivity(e) }))
    .filter(e => e.translated !== null)
    .slice(0, 10);

  const engDocs = documents.filter(d => d.clientId === client?.id && d.client_visible && !d.deleted);

  const poc = engagement.poc;
  const pocMember = poc?.name ? team.find(m => m.name === poc.name || m.id === poc.id) : null;

  const sortedTasks = [...engTasks].sort((a, b) => {
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline) - new Date(b.deadline);
  });
  const activeTasks = sortedTasks.filter(t => t.status !== 'Completed');
  const doneTasksList = sortedTasks.filter(t => t.status === 'Completed');

  const handleMarkSent = async (item) => {
    setSendingItem(item.id);
    await base44.functions.invoke('clientPortalAction', {
      action: 'markPendingItemSent',
      clientId: client.id,
      itemId: item.id,
      itemDescription: item.description || item.item,
    });
    setSentItems(prev => ({ ...prev, [item.id]: true }));
    setSendingItem(null);
  };

  const paymentSprints = portalAccessLevel === 'full' ? (engagement.paymentSprints || []) : [];

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to My Projects
      </button>

      {/* SECTION A — Header */}
      <div className="rounded-2xl p-6 border border-amber-500/15"
        style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.05) 0%, rgba(4,8,18,0.8) 100%)' }}>
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{engagement.name}</h1>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-sm font-semibold"
              style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }}>
              {status}
            </span>

            {/* Timeline */}
            <div className={cn('mt-4 text-sm', days !== null && days < 0 ? 'text-red-400' : 'text-muted-foreground')}>
              {engagement.startDate && <span>Started {format(new Date(engagement.startDate), 'MMM d, yyyy')}</span>}
              {engagement.endDate && <span> · Target {format(new Date(engagement.endDate), 'MMM d, yyyy')}</span>}
              {days !== null && (
                <span> · <strong>{days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? 'Due today' : `${days} days remaining`}</strong></span>
              )}
            </div>

            {/* POC */}
            {poc && (
              <div className="mt-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' }}>
                  {(poc.name || '?')[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Your Clara Contact: {poc.name}</p>
                  {poc.phone && (
                    <a href={`https://wa.me/${poc.phone.replace(/\D/g, '')}?text=Hi ${poc.name}, I have a question about my ${engagement.name} project at Clara.`}
                      target="_blank" rel="noreferrer"
                      className="text-xs text-green-400 hover:underline flex items-center gap-1 mt-0.5">
                      <MessageCircle className="w-3 h-3" /> WhatsApp
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
          <CircularGauge pct={pct} />
        </div>
      </div>

      {/* SECTION B — Tasks / Milestones */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-foreground uppercase tracking-widest text-[12px] text-muted-foreground">
          {portalAccessLevel === 'full' ? 'Project Timeline' : 'Progress'}
        </h2>

        {portalAccessLevel === 'full' ? (
          <div className="space-y-2">
            {activeTasks.length === 0 && doneTasksList.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No tasks added yet.</p>
            )}
            {activeTasks.map(task => {
              const d = daysFromToday(task.deadline);
              const isOverdue = d !== null && d < 0 && task.status !== 'Completed';
              return (
                <div key={task.id} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-secondary/20 hover:bg-secondary/30 transition-colors">
                  {taskStatusIcon(task.status, task.deadline)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{task.name}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                      {task.deadline && (
                        <span className={cn('text-xs', isOverdue ? 'text-red-400 font-semibold' : 'text-muted-foreground')}>
                          {isOverdue ? `${Math.abs(d)}d overdue · ` : ''}Due {formatDate(task.deadline, 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0',
                    task.status === 'Completed' ? 'bg-green-500/10 text-green-400' :
                    task.status === 'In Progress' ? 'bg-cyan-500/10 text-cyan-400' :
                    task.status === 'Blocked' ? 'bg-red-500/10 text-red-400' :
                    'bg-secondary text-muted-foreground'
                  )}>{task.status}</span>
                </div>
              );
            })}

            {/* Completed tasks toggle */}
            {doneTasksList.length > 0 && (
              <div>
                <button onClick={() => setShowCompleted(o => !o)}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-2">
                  {showCompleted ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  {showCompleted ? 'Hide' : 'Show'} {doneTasksList.length} completed task{doneTasksList.length > 1 ? 's' : ''}
                </button>
                {showCompleted && (
                  <div className="space-y-2 opacity-60">
                    {doneTasksList.map(task => (
                      <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-secondary/10">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground line-through">{task.name}</p>
                        {task.dateCompleted && (
                          <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                            {formatDate(task.dateCompleted, 'MMM d')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // Summary Only view
          <div className="p-5 rounded-2xl border border-border bg-secondary/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">Overall Progress</span>
              <span className="text-sm font-bold text-amber-400">{pct}%</span>
            </div>
            <div className="h-3 rounded-full bg-white/5 overflow-hidden mb-4">
              <div className="h-full rounded-full bg-amber-500/70" style={{ width: `${pct}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {['Completed', 'In Progress', 'Not Started'].map(s => {
                const count = engTasks.filter(t => t.status === s).length;
                return (
                  <div key={s} className="rounded-xl p-3 bg-secondary/40 border border-border">
                    <p className="text-lg font-bold text-foreground">{count}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* SECTION C — Action Required */}
      <div className="space-y-3">
        <h2 className="text-[12px] font-bold text-foreground uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Action Required From You
        </h2>

        {awaitingItems.length === 0 && !sentItems[Object.keys(sentItems)[0]] ? (
          <div className="p-5 rounded-2xl border border-green-500/20 bg-green-500/5 text-center">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-green-300">Nothing pending from your side right now. You're all caught up! 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            {awaitingItems.map(item => {
              const alreadySent = sentItems[item.id];
              const isLoading = sendingItem === item.id;
              const d = daysFromToday(item.deadline);
              return (
                <div key={item.id} className="p-4 rounded-2xl border-l-4 border-amber-500"
                  style={{ background: 'rgba(245,158,11,0.05)', borderTop: '1px solid rgba(245,158,11,0.15)', borderRight: '1px solid rgba(245,158,11,0.15)', borderBottom: '1px solid rgba(245,158,11,0.15)' }}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{item.description || item.item}</p>
                      {item.requestedAt && (
                        <p className="text-xs text-muted-foreground mt-1">Requested {formatDistanceToNow(new Date(item.requestedAt), { addSuffix: true })}</p>
                      )}
                      {item.deadline && (
                        <p className={cn('text-xs font-medium mt-0.5', d !== null && d < 0 ? 'text-red-400' : d === 0 ? 'text-amber-400' : 'text-green-400')}>
                          {d !== null && d < 0 ? `${Math.abs(d)}d overdue` : d === 0 ? 'Due today' : `Due in ${d} days`} · {formatDate(item.deadline, 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => !alreadySent && !isLoading && handleMarkSent(item)}
                      disabled={isLoading}
                      className={cn(
                        'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold flex-shrink-0 transition-all',
                        alreadySent
                          ? 'bg-green-500/15 text-green-400 border border-green-500/20 cursor-default'
                          : 'border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 cursor-pointer'
                      )}
                      style={{ background: alreadySent ? undefined : 'rgba(245,158,11,0.1)' }}
                    >
                      {alreadySent ? <><CheckCircle className="w-3.5 h-3.5" /> Sent ✓</> : isLoading ? 'Sending...' : <><Send className="w-3.5 h-3.5" /> Mark as Sent</>}
                    </button>
                  </div>
                </div>
              );
            })}
            {receivedItems.length > 0 && (
              <div className="space-y-2 opacity-50 mt-2">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Already Sent</p>
                {receivedItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary/10">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground line-through">{item.description || item.item}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION D — Recent Updates */}
      {activityLog.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">Recent Updates</h2>
          <div className="space-y-2">
            {activityLog.map((entry, i) => (
              <div key={entry.id || i} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-secondary/10">
                <span className="text-lg flex-shrink-0 mt-0.5">{entry.translated.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">{entry.translated.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(entry.date), { addSuffix: true })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION E — Payment Schedule (full only) */}
      {portalAccessLevel === 'full' && paymentSprints.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">Payment Schedule</h2>
          <div className="rounded-2xl border border-border overflow-hidden">
            {paymentSprints.map((sprint, i) => {
              const d = sprint.dueDate ? daysFromToday(sprint.dueDate) : null;
              const isPaid = sprint.status === 'Received' || sprint.status === 'Paid';
              const isOverdue = !isPaid && d !== null && d < 0;
              return (
                <div key={i} className={cn('flex items-center justify-between px-5 py-3.5', i > 0 && 'border-t border-border')}>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{sprint.milestone || sprint.name || `Sprint ${i + 1}`}</p>
                    {sprint.dueDate && (
                      <p className={cn('text-xs mt-0.5', isOverdue ? 'text-red-400' : 'text-muted-foreground')}>
                        Due {formatDate(sprint.dueDate, 'MMM d, yyyy')}{isOverdue ? ` · ${Math.abs(d)}d overdue` : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {sprint.amount && <span className="text-sm font-bold text-foreground">₹{Number(sprint.amount).toLocaleString('en-IN')}</span>}
                    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold',
                      isPaid ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                      isOverdue ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    )}>
                      {isPaid ? 'Received' : isOverdue ? 'Overdue' : 'Pending'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION F — Documents */}
      {engDocs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">Project Documents</h2>
          <div className="space-y-2">
            {engDocs.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-secondary/20">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-500/10 border border-amber-500/20 flex-shrink-0">
                  <span className="text-amber-400 text-xs font-bold">PDF</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">{doc.category}</p>
                </div>
                {doc.url && (
                  <a href={doc.url} target="_blank" rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-amber-400 border border-amber-500/20 hover:bg-amber-500/10 transition-colors flex-shrink-0">
                    View →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}