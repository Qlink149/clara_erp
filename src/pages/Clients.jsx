import { useState, useMemo } from 'react';
import { Building2, Plus, TrendingUp, Users, AlertTriangle, ChevronRight, Phone, Mail, Clock, FolderOpen } from 'lucide-react';
import { cn, getStatusColor, formatDate, formatRelative, daysFromToday } from '@/lib/utils';
import { useStore } from '@/lib/StoreContext';
import { useAuthorization, useFilteredClients } from '@/lib/AuthorizationContext';
import NoAccessState from '@/components/ui/NoAccessState';
import ClientDetail from '@/components/clients/ClientDetail';
import UpcomingClientDetail from '@/components/clients/UpcomingClientDetail';
import PastClientDetail from '@/components/clients/PastClientDetail';
import ClientAnalytics from '@/components/clients/ClientAnalytics';
import AddClientModal from '@/components/clients/AddClientModal';
import Drawer from '@/components/ui/SideDrawer';

const TABS = ['Current', 'Upcoming', 'Past', 'Analytics'];

const STATUS_COLORS = {
  'On Track': 'badge-green',
  'At Risk': 'badge-amber',
  'Delayed': 'badge-red',
  'Paused': 'badge-gray',
};

const STAGE_COLORS = {
  'Lead': 'badge-gray',
  'Proposal Sent': 'badge-blue',
  'Negotiation': 'badge-amber',
  'Contract Review': 'badge-violet',
  'Closing': 'badge-green',
};

function CurrentClientCard({ client, tasks, onClick, onViewDocs }) {
  const clientTasks = tasks.filter((t) => t.clientId === client.id);
  const openTasks = clientTasks.filter((t) => t.status !== 'Completed').length;
  const overdueTasks = clientTasks.filter((t) => t.status !== 'Completed' && daysFromToday(t.deadline) !== null && daysFromToday(t.deadline) < 0);
  const overdueItems = (client.pendingItems || []).filter((p) => p.status === 'Awaiting' && daysFromToday(p.deadline) !== null && daysFromToday(p.deadline) < 0);
  const hasAlerts = overdueTasks.length > 0 || overdueItems.length > 0;

  return (
    <div
      className={cn('card-glass card-hover p-5 cursor-pointer group', hasAlerts && 'border-amber-500/30')}
      onClick={() => onClick(client)}
    >
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
            {client.name[0]}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{client.name}</h3>
            <p className="text-xs text-muted-foreground">{client.primaryContact?.name} · {client.primaryContact?.designation}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={cn('px-2 py-0.5 rounded text-xs font-medium border', STATUS_COLORS[client.status])}>{client.status}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onViewDocs(client.id); }}
            className="p-1 rounded hover:bg-primary/15 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
            title="View Documentation"
          >
            <FolderOpen className="w-3.5 h-3.5" />
          </button>
          <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{client.primaryContact?.phone}</span>
        <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3" />{client.primaryContact?.email}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{openTasks}</span>/{clientTasks.length} tasks open
        </div>
        <div className="flex items-center gap-2">
          {hasAlerts && (
            <span className="flex items-center gap-1 text-xs text-amber-400 font-medium">
              <AlertTriangle className="w-3 h-3" />
              {overdueTasks.length + overdueItems.length} alert{overdueTasks.length + overdueItems.length !== 1 ? 's' : ''}
            </span>
          )}
          <span className="text-xs text-muted-foreground">{formatRelative(client.lastUpdateTime)}</span>
        </div>
      </div>

      {client.lastUpdate && (
        <p className="text-xs text-muted-foreground mt-2 truncate border-t border-border pt-2">{client.lastUpdate}</p>
      )}
    </div>
  );
}

function UpcomingClientCard({ client, onClick }) {
  const nextActionDays = daysFromToday(client.nextActionDate);
  return (
    <div className="card-glass card-hover p-5 cursor-pointer group" onClick={() => onClick(client)}>
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-sm font-bold text-violet-400 flex-shrink-0">
            {client.name[0]}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{client.name}</h3>
            <p className="text-xs text-muted-foreground">{client.primaryContact?.name}</p>
          </div>
        </div>
        <span className={cn('px-2 py-0.5 rounded text-xs font-medium border flex-shrink-0', STAGE_COLORS[client.pipelineStage])}>{client.pipelineStage}</span>
      </div>

      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <span className="text-xs px-2 py-0.5 bg-secondary border border-border rounded-md text-muted-foreground">{client.source}</span>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Phone className="w-3 h-3" />{client.primaryContact?.phone}
        </span>
      </div>

      {client.nextAction && (
        <div className="text-xs">
          <span className="text-muted-foreground">Next: </span>
          <span className="text-foreground">{client.nextAction}</span>
          {nextActionDays !== null && (
            <span className={cn('ml-2 font-semibold', nextActionDays < 0 ? 'text-red-400' : nextActionDays === 0 ? 'text-amber-400' : 'text-muted-foreground')}>
              {nextActionDays < 0 ? `${Math.abs(nextActionDays)}d overdue` : nextActionDays === 0 ? 'Today' : `in ${nextActionDays}d`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function PastClientCard({ client, onReactivate, onClick }) {
  return (
    <div className="card-glass card-hover p-5 cursor-pointer group" onClick={() => onClick(client)}>
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-sm font-bold text-muted-foreground flex-shrink-0">
            {client.name[0]}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{client.name}</h3>
            <p className="text-xs text-muted-foreground">{client.primaryContact?.name}</p>
          </div>
        </div>
        <span className="badge-gray px-2 py-0.5 rounded text-xs font-medium border flex-shrink-0">Closed</span>
      </div>
      <p className="text-xs text-muted-foreground mb-1">{formatDate(client.projectStartDate)} – {formatDate(client.projectEndDate)}</p>
      <p className="text-xs text-muted-foreground mb-3">{client.closureReason}</p>
      <button
        onClick={(e) => { e.stopPropagation(); onReactivate(client.id); }}
        className="text-xs px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 border border-green-500/20 hover:bg-green-500/25 transition-colors font-medium"
      >
        Reactivate
      </button>
    </div>
  );
}

export default function Clients({ initialClient, onNavigate }) {
  const { currentClients, upcomingClients, pastClients, tasks, team, reactivateClient, convertToCurrentClient, moveToPast, updateCurrentClient } = useStore();
  const authz = useAuthorization();
  const visibleCurrentClients = useFilteredClients(currentClients);
  const visibleUpcomingClients = useFilteredClients(upcomingClients);
  const visiblePastClients = useFilteredClients(pastClients);

  const [activeTab, setActiveTab] = useState(initialClient ? 'Current' : 'Current');
  const [selectedCurrentClient, setSelectedCurrentClient] = useState(
    initialClient && (authz?.fullAccess || authz?.authorizedClients?.some(c => c.clientId === initialClient.id)) ? initialClient : null
  );
  const [selectedUpcomingClient, setSelectedUpcomingClient] = useState(null);
  const [selectedPastClient, setSelectedPastClient] = useState(null);
  const [showAddClient, setShowAddClient] = useState(false);

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Building2 className="w-6 h-6 text-primary" />
            Clients
          </h1>
          <p className="text-muted-foreground mt-1">
            {visibleCurrentClients.length} current · {visibleUpcomingClients.length} upcoming · {visiblePastClients.length} past
          </p>
        </div>
        <button onClick={() => setShowAddClient(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-0">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px',
              activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab}
            {tab === 'Current' && <span className="ml-1.5 px-1.5 py-0.5 bg-primary/15 text-primary rounded-full text-xs">{visibleCurrentClients.length}</span>}
            {tab === 'Upcoming' && <span className="ml-1.5 px-1.5 py-0.5 bg-violet-500/15 text-violet-400 rounded-full text-xs">{visibleUpcomingClients.length}</span>}
          </button>
        ))}
      </div>

      {/* Current Clients */}
      {activeTab === 'Current' && (
        visibleCurrentClients.length === 0 ? (
          <NoAccessState message="No clients available. Contact Yogansh to get access to client projects." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleCurrentClients.map((client) => (
              <CurrentClientCard key={client.id} client={client} tasks={tasks} onClick={setSelectedCurrentClient} onViewDocs={(id) => onNavigate?.('documentation', { id })} />
            ))}
          </div>
        )
      )}

      {/* Upcoming Clients */}
      {activeTab === 'Upcoming' && (
        visibleUpcomingClients.length === 0 ? (
          <NoAccessState message="No upcoming clients available for your access level." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleUpcomingClients.map((client) => (
              <UpcomingClientCard key={client.id} client={client} onClick={setSelectedUpcomingClient} />
            ))}
          </div>
        )
      )}

      {/* Past Clients */}
      {activeTab === 'Past' && (
        visiblePastClients.length === 0 ? (
          <NoAccessState message="No past clients available for your access level." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visiblePastClients.map((client) => (
              <PastClientCard key={client.id} client={client} onReactivate={reactivateClient} onClick={setSelectedPastClient} />
            ))}
          </div>
        )
      )}

      {/* Analytics */}
      {activeTab === 'Analytics' && <ClientAnalytics />}

      {/* Drawers */}
      <Drawer open={!!selectedCurrentClient} onClose={() => setSelectedCurrentClient(null)} title={selectedCurrentClient?.name || ''} width="max-w-3xl">
        {selectedCurrentClient && <ClientDetail client={selectedCurrentClient} onClose={() => setSelectedCurrentClient(null)} onUpdate={(id, upd) => { updateCurrentClient(id, upd); setSelectedCurrentClient((c) => c ? { ...c, ...upd } : c); }} onMoveToPast={(id) => { moveToPast(id); setSelectedCurrentClient(null); }} />}
      </Drawer>

      <Drawer open={!!selectedUpcomingClient} onClose={() => setSelectedUpcomingClient(null)} title={selectedUpcomingClient?.name || ''} width="max-w-2xl">
        {selectedUpcomingClient && <UpcomingClientDetail client={selectedUpcomingClient} onClose={() => setSelectedUpcomingClient(null)} onConvert={convertToCurrentClient} />}
      </Drawer>

      <Drawer open={!!selectedPastClient} onClose={() => setSelectedPastClient(null)} title={selectedPastClient?.name || ''} width="max-w-2xl">
        {selectedPastClient && <PastClientDetail client={selectedPastClient} onReactivate={reactivateClient} onClose={() => setSelectedPastClient(null)} />}
      </Drawer>

      <AddClientModal open={showAddClient} onClose={() => setShowAddClient(false)} />
    </div>
  );
}