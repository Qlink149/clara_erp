import { useState, useEffect, useMemo } from 'react';
import { FolderOpen, Search, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/StoreContext';
import { base44 } from '@/api/base44Client';
import { useDocsEditAccess } from '@/lib/moduleAccess';
import LegalDocuments from '@/components/docs/LegalDocuments';
import DigitalAssets from '@/components/docs/DigitalAssets';
import DocNotes from '@/components/docs/DocNotes';
import GlobalDocSearch from '@/components/docs/GlobalDocSearch';

export default function Documentation({ initialClientId }) {
  const { clients } = useStore();
  const isAdmin = useDocsEditAccess();
  const allClients = clients || [];

  const [selectedClientId, setSelectedClientId] = useState(initialClientId || null);
  const [clientSearch, setClientSearch] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');

  // All data for global search
  const [allDocs, setAllDocs] = useState([]);
  const [allAssets, setAllAssets] = useState([]);

  useEffect(() => {
    base44.entities.ClientDocument.list().then(setAllDocs);
    base44.entities.ClientAsset.list().then(setAllAssets);
  }, []);

  const selectedClient = allClients.find(c => c.id === selectedClientId);

  const filteredClients = useMemo(() => {
    const q = clientSearch.toLowerCase();
    return allClients.filter(c => c.name.toLowerCase().includes(q));
  }, [allClients, clientSearch]);

  const showGlobalSearch = globalSearch.trim().length > 0;

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <FolderOpen className="w-6 h-6 text-primary" />
          Documentation
        </h1>
        <p className="text-muted-foreground mt-1">Client contracts, digital assets & reference links — all in one place</p>
      </div>

      {/* Global Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={globalSearch}
          onChange={e => setGlobalSearch(e.target.value)}
          placeholder="Search all documents & assets across all clients…"
          className="w-full pl-9 pr-4 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
        {globalSearch && (
          <button onClick={() => setGlobalSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs">✕</button>
        )}
      </div>

      {showGlobalSearch ? (
        <GlobalDocSearch query={globalSearch} docs={allDocs} assets={allAssets} allClients={allClients} onSelectClient={(id) => { setSelectedClientId(id); setGlobalSearch(''); }} />
      ) : (
        <div className="flex gap-4 h-[calc(100vh-260px)] min-h-[500px]">
          {/* Left: Client List */}
          <div className="w-64 flex-shrink-0 flex flex-col card-glass rounded-xl overflow-hidden">
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={clientSearch}
                  onChange={e => setClientSearch(e.target.value)}
                  placeholder="Search clients…"
                  className="w-full pl-8 pr-3 py-1.5 bg-secondary border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {filteredClients.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">No clients found</p>
              )}
              {filteredClients.map(client => (
                <button
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all group',
                    selectedClientId === client.id
                      ? 'bg-primary/15 text-primary border border-primary/25'
                      : 'text-foreground hover:bg-secondary'
                  )}
                >
                  <div className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0',
                    selectedClientId === client.id ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
                  )}>
                    {client.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{client.name}</p>
                    <p className={cn('text-[10px] truncate', selectedClientId === client.id ? 'text-primary/70' : 'text-muted-foreground')}>
                      {client.client_type}
                    </p>
                  </div>
                  <ChevronRight className={cn('w-3 h-3 flex-shrink-0 transition-opacity', selectedClientId === client.id ? 'opacity-100 text-primary' : 'opacity-0 group-hover:opacity-50')} />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Hub */}
          <div className="flex-1 overflow-y-auto">
            {!selectedClient ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-3">
                  <FolderOpen className="w-12 h-12 text-primary/30 mx-auto" />
                  <p className="text-muted-foreground text-sm">Select a client to view their Documentation Hub</p>
                </div>
              </div>
            ) : (
              <ClientDocHub
                client={selectedClient}
                isAdmin={isAdmin}
                onDataChange={() => {
                  base44.entities.ClientDocument.list().then(setAllDocs);
                  base44.entities.ClientAsset.list().then(setAllAssets);
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ClientDocHub({ client, isAdmin, onDataChange }) {
  const [activeSection, setActiveSection] = useState('legal');

  const SECTIONS = [
    { id: 'legal', label: 'Legal Documents' },
    { id: 'assets', label: 'Digital Assets & Links' },
    { id: 'notes', label: 'General Notes' },
  ];

  return (
    <div className="space-y-4">
      {/* Client Header */}
      <div className="card-glass p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary">
          {client.name[0]}
        </div>
        <div>
          <h2 className="font-semibold text-foreground">{client.name}</h2>
          <p className="text-xs text-muted-foreground capitalize">{client.client_type} client</p>
        </div>
        {!isAdmin && (
          <span className="ml-auto text-xs px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">View Only</span>
        )}
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 border-b border-border">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap',
              activeSection === s.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {activeSection === 'legal' && <LegalDocuments clientId={client.id} isAdmin={isAdmin} onDataChange={onDataChange} />}
      {activeSection === 'assets' && <DigitalAssets clientId={client.id} isAdmin={isAdmin} onDataChange={onDataChange} />}
      {activeSection === 'notes' && <DocNotes clientId={client.id} isAdmin={isAdmin} />}
    </div>
  );
}