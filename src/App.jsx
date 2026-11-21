import { useState, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { StoreProvider, useStore } from '@/lib/StoreContext';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { AuthorizationProvider, useAuthorization } from '@/lib/AuthorizationContext';

import Sidebar from '@/components/layout/Sidebar';
import OnboardingGate from '@/components/OnboardingGate';
import TopBar from '@/components/layout/TopBar';

import Dashboard from '@/pages/Dashboard';
import Clients from '@/pages/Clients';
import Team from '@/pages/Team';
import Tasks from '@/pages/Tasks';
import AccessControl from '@/pages/AccessControl';
import ClientPortal from '@/pages/ClientPortal';
import InvoiceCalendar from '@/pages/InvoiceCalendar';
import KpiTracker from '@/pages/KpiTracker';
import ProformaInvoices from '@/pages/ProformaInvoices';
import Documentation from '@/pages/Documentation';
import ClientPortalAdmin from '@/pages/ClientPortalAdmin';
import ClientPortalPublic from '@/pages/ClientPortalPublic';

function AppInner() {
  const [activePage, setActivePage] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [clientToOpen, setClientToOpen] = useState(null);
  const [proformaPrefill, setProformaPrefill] = useState(null);
  const { theme, loading } = useStore();
  const authz = useAuthorization();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
  }, [theme]);

  // Apply dark background by default
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const handleNavigate = (page, client = null) => {
    setActivePage(page);
    if (client) setClientToOpen(client);
    else setClientToOpen(null);
  };

  const sidebarWidth = 'lg:pl-60';

  if (loading || !authz) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center animate-glow-pulse"
            style={{ background: 'linear-gradient(135deg, #8d57de, #1f0798)', boxShadow: '0 0 24px rgba(93,39,202,0.4)' }}>
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <div className="text-xs tracking-widest uppercase text-cyan-500/60 animate-pulse">Loading Clara.ai...</div>
        </div>
      </div>
    );
  }

  // New user — needs to identify themselves
  if (authz.role === 'NEEDS_ONBOARDING') {
    return (
      <OnboardingGate
        user={authz.user}
        onComplete={() => {
          // Re-fetch authz after submission
          window.location.reload();
        }}
      />
    );
  }

  // Pending client or approved client — key forces remount when role changes
  if (authz.role === 'PENDING_CLIENT' || authz.role === 'CLIENT') {
    return <ClientPortal key={authz.role} user={authz.user} />;
  }

  return (
    <div className="executive-shell min-h-screen text-foreground font-space">
        <div className="exec-blob-mid" />
        <Sidebar
          activePage={activePage}
          onNavigate={handleNavigate}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />

        <div className={`${sidebarWidth} min-h-screen flex flex-col relative z-10`}>
          <TopBar
            onMenuClick={() => setMobileMenuOpen(true)}
            onNavigate={handleNavigate}
          />

          <main className="flex-1 overflow-x-hidden">
            {activePage === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
            {activePage === 'clients' && <Clients initialClient={clientToOpen} key={clientToOpen?.id || 'clients'} onNavigate={handleNavigate} />}
            {activePage === 'team' && <Team />}
            {activePage === 'tasks' && <Tasks />}
            {activePage === 'invoice-calendar' && <InvoiceCalendar onNavigateProforma={(entry) => { setProformaPrefill(entry); setActivePage('proforma-invoices'); }} />}
            {activePage === 'proforma-invoices' && <ProformaInvoices prefillEntry={proformaPrefill} onClearPrefill={() => setProformaPrefill(null)} />}
            {activePage === 'documentation' && <Documentation initialClientId={clientToOpen?.id || null} />}
            {activePage === 'client-portal' && <ClientPortalAdmin />}
            {activePage === 'kpi-tracker' && <KpiTracker />}
            {activePage === 'access-control' && <AccessControl />}
          </main>
        </div>
      </div>
  );
}

function App() {
  // Standalone client-facing portal — bypasses ERP auth/providers entirely
  const portalMatch = window.location.pathname.match(/^\/portal\/([^/]+)/);
  if (portalMatch) {
    return <ClientPortalPublic slug={portalMatch[1]} />;
  }

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <StoreProvider>
          <AuthorizationProvider>
            <AppInner />
          </AuthorizationProvider>
        </StoreProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;