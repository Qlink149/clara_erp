import { useState, useRef, useEffect } from 'react';
import { Search, Sun, Moon, Menu, Building2, CheckSquare, Users } from 'lucide-react';
import { format } from 'date-fns';
import { cn, formatRelative } from '@/lib/utils';
import { useStore } from '@/lib/StoreContext';
import { useFilteredClients, useFilteredTasks } from '@/lib/AuthorizationContext';

export default function TopBar({ onMenuClick, onNavigate }) {
  const { theme, toggleTheme, currentClients, upcomingClients, pastClients, tasks, team, engagements, clients } = useStore();
  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  const allClients = [...currentClients, ...upcomingClients, ...pastClients];
  const visibleClients = useFilteredClients(allClients);
  const visibleTasks = useFilteredTasks(tasks, clients || [], engagements);

  const results = search.length > 1 ? {
    clients: visibleClients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())).slice(0, 4),
    tasks: visibleTasks.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())).slice(0, 4),
    team: team.filter((m) => m.name.toLowerCase().includes(search.toLowerCase())).slice(0, 3),
  } : null;

  const hasResults = results && (results.clients.length > 0 || results.tasks.length > 0 || results.team.length > 0);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="h-16 flex items-center px-4 lg:px-6 border-b border-cyan-500/10 sticky top-0 z-30"
      style={{
        background: 'rgba(255,255,255,0.94)',
        borderBottom: '1px solid rgba(12,8,40,0.09)',
        boxShadow: '0 1px 2px rgba(12,8,40,0.04), 0 4px 20px rgba(12,8,40,0.04)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Brand accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: 'linear-gradient(90deg, rgba(31,7,152,0.88) 0%, rgba(141,87,222,0.42) 52%, transparent 100%)' }}
      />

      {/* Mobile menu */}
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-xl hover:bg-white/5 text-muted-foreground mr-3 transition-colors">
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-lg mx-auto relative" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/50" />
          <input
            className="w-full rounded-xl pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all tracking-wide"
            style={{
              background: 'rgba(255,255,255,0.94)',
              border: '1px solid rgba(12,8,40,0.12)',
            }}
            onFocus={(e) => {
              e.target.style.border = '1px solid rgba(93,39,202,0.35)';
              e.target.style.boxShadow = '0 0 0 4px rgba(93,39,202,0.1)';
              setShowResults(true);
            }}
            onBlur={(e) => {
              e.target.style.border = '1px solid rgba(12,8,40,0.12)';
              e.target.style.boxShadow = 'none';
            }}
            placeholder="Search clients, tasks, team..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowResults(true); }}
          />
        </div>
        {showResults && hasResults && (
          <div className="absolute top-full mt-2 left-0 right-0 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in border border-cyan-500/15"
            style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)', boxShadow: '0 12px 32px rgba(12,8,40,0.12)' }}
          >
            {results.clients.length > 0 && (
              <div>
                <div className="px-3 py-2 text-[10px] font-semibold text-cyan-500/50 uppercase tracking-widest border-b border-cyan-500/10 flex items-center gap-1.5">
                  <Building2 className="w-3 h-3" /> Clients
                </div>
                {results.clients.map((c) => (
                  <button key={c.id} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-cyan-500/5 text-left transition-colors"
                    onClick={() => { setSearch(''); setShowResults(false); onNavigate('clients', c); }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-cyan-300 text-xs font-bold"
                      style={{ background: 'rgba(93,39,202,0.08)', border: '1px solid rgba(93,39,202,0.2)' }}>
                      {c.name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{c.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{c.type} client</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {results.tasks.length > 0 && (
              <div>
                <div className="px-3 py-2 text-[10px] font-semibold text-cyan-500/50 uppercase tracking-widest border-b border-t border-cyan-500/10 flex items-center gap-1.5">
                  <CheckSquare className="w-3 h-3" /> Tasks
                </div>
                {results.tasks.map((t) => (
                  <button key={t.id} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-cyan-500/5 text-left transition-colors"
                    onClick={() => { setSearch(''); setShowResults(false); onNavigate('tasks'); }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)' }}>
                      <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.status} · {t.priority}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {results.team.length > 0 && (
              <div>
                <div className="px-3 py-2 text-[10px] font-semibold text-cyan-500/50 uppercase tracking-widest border-b border-t border-cyan-500/10 flex items-center gap-1.5">
                  <Users className="w-3 h-3" /> Team
                </div>
                {results.team.map((m) => (
                  <button key={m.id} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-cyan-500/5 text-left transition-colors"
                    onClick={() => { setSearch(''); setShowResults(false); onNavigate('team'); }}>
                    <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold', `bg-${m.color}-500/20 text-${m.color}-300`)}>{m.avatar}</div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 ml-4">
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/10 bg-cyan-500/5">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[10px] text-cyan-400/70 tracking-widest uppercase font-medium whitespace-nowrap">
            {format(new Date(), 'EEE, MMM d')}
          </span>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-cyan-400 transition-colors"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

      </div>
    </header>
  );
}