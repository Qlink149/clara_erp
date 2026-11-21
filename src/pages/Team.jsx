import { useState } from 'react';
import { Users, Plus, Mail, Phone, Briefcase, TrendingUp, CheckCircle, Clock, Star, Lock } from 'lucide-react';
import { cn, getStatusColor, formatDate, daysFromToday } from '@/lib/utils';
import { useStore } from '@/lib/StoreContext';
import Drawer from '@/components/ui/Drawer';
import { InlineTextEdit, InlineSelectEdit, InlineDateEdit } from '@/components/ui/InlineEdit';
import AddTeamMemberModal from '@/components/team/AddTeamMemberModal';
import { useAuthorization } from '@/lib/AuthorizationContext';

const STATUS_OPTIONS = ['Available', 'Busy', 'Overloaded', 'On Leave'];
const STATUS_COLORS = { Available: 'bg-green-500', Busy: 'bg-amber-500', Overloaded: 'bg-red-500', 'On Leave': 'bg-gray-500' };

function TeamMemberCard({ member, tasks, currentClients, onClick, showDetails }) {
  const activeTasks = tasks.filter((t) => t.assigneeId === member.id && t.status !== 'Completed');
  const completedThisMonth = tasks.filter((t) => t.assigneeId === member.id && t.status === 'Completed');
  const workload = Math.min(100, Math.round((activeTasks.length / 8) * 100));
  const assignedClients = currentClients.filter((c) => c.assignedTeam?.includes(member.id));

  return (
    <div
      className="card-glass card-hover p-5 cursor-pointer"
      onClick={() => onClick(member)}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0', `bg-${member.color}-500/20 text-${member.color}-300`)}>
          {member.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground">{member.name}</h3>
            <div className="flex items-center gap-1.5">
              <div className={cn('w-2 h-2 rounded-full', STATUS_COLORS[member.status])} />
              <span className="text-xs text-muted-foreground">{member.status}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{member.role}</p>
          <p className="text-xs text-muted-foreground">{member.department}</p>
        </div>
      </div>

      {showDetails ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-foreground">{activeTasks.length}</div>
              <div className="text-xs text-muted-foreground">Active Tasks</div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-foreground">{completedThisMonth.length}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
          </div>

          {/* Workload Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Workload</span>
              <span className={cn('font-semibold', workload < 60 ? 'text-green-400' : workload < 85 ? 'text-amber-400' : 'text-red-400')}>
                {workload}%
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', workload < 60 ? 'bg-green-500' : workload < 85 ? 'bg-amber-500' : 'bg-red-500')}
                style={{ width: `${workload}%` }}
              />
            </div>
          </div>

          {/* Clients */}
          {assignedClients.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {assignedClients.slice(0, 3).map((c) => (
                <span key={c.id} className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-xs border border-primary/20">{c.name}</span>
              ))}
              {assignedClients.length > 3 && (
                <span className="px-2 py-0.5 bg-secondary text-muted-foreground rounded-md text-xs border border-border">+{assignedClients.length - 3}</span>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center gap-2 text-xs text-muted-foreground border border-dashed border-border rounded-lg px-3 py-2">
          <Lock className="w-3.5 h-3.5" />
          <span>Details restricted</span>
        </div>
      )}
    </div>
  );
}

function MemberDrawer({ member, tasks, currentClients, team, onClose, onUpdate }) {
  if (!member) return null;
  const allTasks = tasks.filter((t) => t.assigneeId === member.id);
  const activeTasks = allTasks.filter((t) => t.status !== 'Completed');
  const completedTasks = allTasks.filter((t) => t.status === 'Completed');
  const completionRate = allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0;
  const workload = Math.min(100, Math.round((activeTasks.length / 8) * 100));
  const assignedClients = currentClients.filter((c) => c.assignedTeam?.includes(member.id));

  const getClient = (id) => currentClients.find((c) => c.id === id);

  return (
    <div className="space-y-6">
      {/* Personal Info */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Personal Info</h3>
        <div className="card-glass p-4 space-y-3">
          <div className="flex items-center gap-4">
            <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold', `bg-${member.color}-500/20 text-${member.color}-300`)}>
              {member.avatar}
            </div>
            <div>
              <InlineTextEdit value={member.name} onSave={(v) => onUpdate(member.id, { name: v })} className="text-lg font-bold text-foreground" />
              <InlineTextEdit value={member.role} onSave={(v) => onUpdate(member.id, { role: v })} className="text-sm text-muted-foreground" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Status</label>
              <InlineSelectEdit value={member.status} options={STATUS_OPTIONS} onSave={(v) => onUpdate(member.id, { status: v })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Department</label>
              <InlineTextEdit value={member.department} onSave={(v) => onUpdate(member.id, { department: v })} />
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
              <InlineTextEdit value={member.email} onSave={(v) => onUpdate(member.id, { email: v })} />
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-muted-foreground" />
              <InlineTextEdit value={member.phone} onSave={(v) => onUpdate(member.id, { phone: v })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Start Date</label>
              <InlineDateEdit value={member.startDate} onSave={(v) => onUpdate(member.id, { startDate: v })} />
            </div>
          </div>
        </div>
      </section>

      {/* Performance */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Performance Snapshot</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total Assigned', value: allTasks.length, color: 'text-foreground' },
            { label: 'Completed', value: completedTasks.length, color: 'text-green-400' },
            { label: 'Completion Rate', value: `${completionRate}%`, color: completionRate >= 80 ? 'text-green-400' : completionRate >= 60 ? 'text-amber-400' : 'text-red-400' },
            { label: 'Current Workload', value: `${workload}%`, color: workload < 60 ? 'text-green-400' : workload < 85 ? 'text-amber-400' : 'text-red-400' },
          ].map((stat) => (
            <div key={stat.label} className="card-glass p-3 text-center">
              <div className={cn('text-2xl font-bold', stat.color)}>{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 card-glass p-3">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-muted-foreground">Workload Capacity</span>
            <span className={workload < 60 ? 'text-green-400' : workload < 85 ? 'text-amber-400' : 'text-red-400'}>{workload}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className={cn('h-full rounded-full', workload < 60 ? 'bg-green-500' : workload < 85 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${workload}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {workload < 60 ? `Can take ~${8 - activeTasks.length} more tasks` : workload < 85 ? 'Near capacity' : 'At or over capacity'}
          </p>
        </div>
      </section>

      {/* Active Tasks */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Active Tasks ({activeTasks.length})</h3>
        {activeTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground card-glass p-4 text-center">No active tasks</p>
        ) : (
          <div className="space-y-2">
            {activeTasks.map((t) => {
              const days = daysFromToday(t.deadline);
              const client = getClient(t.clientId);
              return (
                <div key={t.id} className="card-glass p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{client?.name || 'Internal'}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium border',
                        t.priority === 'Urgent' ? 'badge-red' : t.priority === 'High' ? 'badge-amber' : t.priority === 'Medium' ? 'badge-blue' : 'badge-gray'
                      )}>{t.priority}</span>
                      {days !== null && (
                        <span className={cn('text-xs font-semibold', days < 0 ? 'text-red-400' : days === 0 ? 'text-amber-400' : 'text-muted-foreground')}>
                          {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Client Assignments */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Client Assignments</h3>
        {assignedClients.length === 0 ? (
          <p className="text-sm text-muted-foreground card-glass p-4 text-center">No clients assigned</p>
        ) : (
          <div className="space-y-2">
            {assignedClients.map((c) => (
              <div key={c.id} className="card-glass p-3 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{c.name}</span>
                <span className={cn('px-2 py-0.5 rounded text-xs font-medium border',
                  c.status === 'On Track' ? 'badge-green' : c.status === 'At Risk' ? 'badge-amber' : c.status === 'Delayed' ? 'badge-red' : 'badge-gray'
                )}>{c.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Task History */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Task History ({completedTasks.length})</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {completedTasks.map((t) => {
            const client = getClient(t.clientId);
            return (
              <div key={t.id} className="card-glass p-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{client?.name || 'Internal'} · {formatDate(t.dateCompleted)}</p>
                </div>
                <span className="badge-green px-2 py-0.5 rounded text-xs font-medium border flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Done
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default function Team() {
  const { team, tasks, currentClients, updateTeamMember, addTeamMember } = useStore();
  const authz = useAuthorization();
  const isSuperAdmin = authz?.role === 'SUPER_ADMIN';
  const isUnauthorized = authz?.role === 'UNAUTHORIZED' || (!authz?.fullAccess && !authz?.authorizedClients?.length && authz?.role !== 'SUPER_ADMIN');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Users className="w-6 h-6 text-primary" />
            Team
          </h1>
          <p className="text-muted-foreground mt-1">{team.length} members · claraai.tech</p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Team Member
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {team.map((member) => (
          <TeamMemberCard
            key={member.id}
            member={member}
            tasks={tasks}
            currentClients={currentClients}
            onClick={!isUnauthorized ? setSelectedMember : () => {}}
            showDetails={!isUnauthorized}
          />
        ))}
      </div>

      <Drawer
        open={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        title={selectedMember ? `${selectedMember.name} — ${selectedMember.role}` : ''}
        width="max-w-xl"
      >
        <MemberDrawer
          member={selectedMember}
          tasks={tasks}
          currentClients={currentClients}
          team={team}
          onClose={() => setSelectedMember(null)}
          onUpdate={(id, updates) => {
            updateTeamMember(id, updates);
            setSelectedMember((prev) => prev ? { ...prev, ...updates } : prev);
          }}
        />
      </Drawer>

      <AddTeamMemberModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addTeamMember}
        team={team}
      />
    </div>
  );
}