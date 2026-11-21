import { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PortalLoginForm from '@/components/clientportal/PortalLoginForm';
import PortalDeptGrid from '@/components/clientportal/PortalDeptGrid';
import PortalDeptDetail from '@/components/clientportal/PortalDeptDetail';
import PortalUseCaseView from '@/components/clientportal/PortalUseCaseView';
import PortalDiscoveryForm from '@/components/clientportal/publicform/PortalDiscoveryForm';

// Standalone client-facing portal — renders OUTSIDE the ERP shell and auth providers.
export default function ClientPortalPublic({ slug }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [nav, setNav] = useState({ view: 'departments', dept: null, uc: null });
  const [creds, setCreds] = useState(null);

  const login = async (email, password) => {
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('portalClientData', { slug, email, password });
      setData(res.data);
      setCreds({ email, password });
      sessionStorage.setItem(`portal_creds_${slug}`, JSON.stringify({ email, password }));
    } catch (e) {
      setError(e?.response?.data?.error || 'Login failed. Please check your credentials.');
    }
    setLoading(false);
  };

  useEffect(() => {
    const saved = sessionStorage.getItem(`portal_creds_${slug}`);
    if (saved) {
      const { email, password } = JSON.parse(saved);
      login(email, password).finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, [slug]);

  const logout = () => {
    sessionStorage.removeItem(`portal_creds_${slug}`);
    setData(null);
    setCreds(null);
    setNav({ view: 'departments', dept: null, uc: null });
  };

  // Backend-proxied writes for the portal client (create use case, edit discovery form)
  const mutate = async (payload) => {
    const res = await base44.functions.invoke('portalClientMutate', { slug, ...creds, ...payload });
    return res.data;
  };

  const refresh = async () => {
    if (!creds) return;
    const res = await base44.functions.invoke('portalClientData', { slug, ...creds });
    setData(res.data);
    return res.data;
  };

  const openUseCase = (uc, dept = null) => {
    const d = dept || data.departments.find(x => x.id === uc.department_id) || null;
    setNav({ view: 'uc', dept: d, uc });
  };

  const createUseCase = async (dept, name) => {
    const res = await mutate({ action: 'createUseCase', department_id: dept.id, process_name: name });
    await refresh();
    setNav({ view: 'form', dept, uc: res.useCase });
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xs tracking-widest uppercase text-cyan-500/60 animate-pulse">Loading portal...</div>
      </div>
    );
  }

  if (!data) {
    return <PortalLoginForm onLogin={login} loading={loading} error={error} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-space">
      <header className="sticky top-0 z-40 backdrop-blur-xl"
        style={{ background: 'rgba(255,255,255,0.94)', borderBottom: '1px solid rgba(12,8,40,0.09)', boxShadow: '0 1px 2px rgba(12,8,40,0.04), 0 4px 20px rgba(12,8,40,0.04)' }}>
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {data.client.company_logo_url ? (
              <img src={data.client.company_logo_url} alt={data.client.client_name} className="h-8 w-auto object-contain rounded" />
            ) : (
              <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm text-white"
                style={{ background: 'linear-gradient(135deg, #8d57de, #1f0798)' }}>
                {data.client.client_name?.[0]}
              </div>
            )}
            <div>
              <span className="font-bold text-foreground text-sm">{data.client.client_name}</span>
              <span className="text-[10px] text-cyan-500/60 tracking-widest uppercase block -mt-0.5">Clara.ai Client Portal</span>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400">
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 animate-fade-in">
        {nav.view === 'departments' && (
          <PortalDeptGrid
            data={data}
            onOpenDept={(dept) => setNav({ view: 'dept', dept, uc: null })}
            onOpenUseCase={(uc) => openUseCase(uc)}
          />
        )}
        {nav.view === 'dept' && (
          <PortalDeptDetail
            data={data} dept={nav.dept}
            onBack={() => setNav({ view: 'departments', dept: null, uc: null })}
            onOpenUseCase={(uc) => setNav({ view: 'uc', dept: nav.dept, uc })}
            onCreateUseCase={(name) => createUseCase(nav.dept, name)}
          />
        )}
        {nav.view === 'uc' && (
          <PortalUseCaseView
            data={data} useCase={nav.uc}
            onBack={() => nav.dept ? setNav({ view: 'dept', dept: nav.dept, uc: null }) : setNav({ view: 'departments', dept: null, uc: null })}
            onOpenForm={() => setNav({ view: 'form', dept: nav.dept, uc: nav.uc })}
          />
        )}
        {nav.view === 'form' && (
          <PortalDiscoveryForm
            data={data} useCase={nav.uc} mutate={mutate}
            onBack={async () => { await refresh(); setNav({ view: 'uc', dept: nav.dept, uc: nav.uc }); }}
          />
        )}
      </main>
    </div>
  );
}