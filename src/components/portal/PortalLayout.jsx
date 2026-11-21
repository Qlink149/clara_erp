import { useState } from 'react';
import { Home, FileText, MessageCircle, LogOut, ChevronRight, Cpu, Menu, X, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';

export default function PortalLayout({ activePage, onNavigate, engagements, clientName, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: 'overview', label: 'My Projects', icon: Home },
    ...engagements.map(e => ({ id: `engagement-${e.id}`, label: e.name, icon: BarChart2, engagementId: e.id })),
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'contact', label: 'Contact Clara', icon: MessageCircle },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center h-16 px-5 border-b border-amber-500/10 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.9), rgba(217,119,6,0.9))', boxShadow: '0 0 16px rgba(245,158,11,0.3)' }}>
            <Cpu className="w-4 h-4 text-[#050a14]" />
          </div>
          <div>
            <span className="font-bold text-white text-sm tracking-widest uppercase">CLARA</span>
            <span className="text-amber-400 text-[9px] tracking-widest ml-0.5">.AI</span>
            <div className="text-[9px] text-amber-500/50 tracking-widest uppercase -mt-0.5">CLIENT PORTAL</div>
          </div>
        </div>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden ml-auto p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Client name */}
      <div className="px-5 py-3 border-b border-amber-500/10 flex-shrink-0">
        <p className="text-[10px] text-amber-500/50 uppercase tracking-widest font-semibold">Viewing as</p>
        <p className="text-sm font-semibold text-foreground mt-0.5">{clientName}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 mb-1">
          <span className="text-[9px] tracking-widest uppercase text-amber-500/40 font-semibold">Navigation</span>
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          const isEngagement = item.id.startsWith('engagement-');
          return (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id, item.engagementId); setMobileOpen(false); }}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left transition-all duration-150',
                isActive
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5',
                isEngagement && 'pl-6 text-xs'
              )}
            >
              <Icon className={cn('w-[18px] h-[18px] flex-shrink-0', isActive ? 'text-amber-400' : '')} />
              <span className="flex-1 truncate">{item.label}</span>
              {isActive && <div className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-amber-500/10 flex-shrink-0">
        <button
          onClick={() => base44.auth.logout()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left text-muted-foreground hover:text-red-400 hover:bg-white/5 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-space flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 z-50 flex flex-col border-r border-amber-500/10 transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{
          background: 'linear-gradient(180deg, rgba(5,10,20,0.98) 0%, rgba(3,7,14,0.98) 100%)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="absolute left-0 top-8 bottom-8 w-px"
          style={{ background: 'linear-gradient(180deg, transparent, rgba(245,158,11,0.4), transparent)' }} />
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="lg:pl-64 flex-1 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center h-14 px-4 border-b border-amber-500/10 sticky top-0 z-30"
          style={{ background: 'rgba(3,7,14,0.95)', backdropFilter: 'blur(20px)' }}>
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground mr-3">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.3)' }}>
              <Cpu className="w-3 h-3 text-amber-400" />
            </div>
            <span className="text-sm font-bold text-foreground">CLARA.AI <span className="text-amber-400">Portal</span></span>
          </div>
        </div>

        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}