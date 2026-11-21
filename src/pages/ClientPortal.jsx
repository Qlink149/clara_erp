import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PortalLayout from '@/components/portal/PortalLayout';
import PortalOverview from '@/components/portal/PortalOverview';
import PortalEngagementDetail from '@/components/portal/PortalEngagementDetail';
import PortalDocuments from '@/components/portal/PortalDocuments';
import PortalContact from '@/components/portal/PortalContact';

export default function ClientPortal({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('overview');
  const [activeEngagementId, setActiveEngagementId] = useState(null);

  useEffect(() => {
    async function load() {
      const res = await base44.functions.invoke('clientPortalData', {});
      setData(res.data);
      setLoading(false);
    }
    load();
  }, []);

  const handleNavigate = (page, engagementId = null) => {
    setActivePage(page);
    setActiveEngagementId(engagementId);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center animate-pulse"
            style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <span className="text-amber-400 font-bold text-sm">C</span>
          </div>
          <div className="text-xs tracking-widest uppercase text-amber-500/60 animate-pulse">Loading your portal...</div>
        </div>
      </div>
    );
  }

  if (!data || !data.client) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-foreground mb-3">Portal Access Pending</h2>
          <p className="text-muted-foreground">Your client portal is being set up. Please contact <a href="mailto:yogansh@claraai.tech" className="text-amber-400 hover:underline">yogansh@claraai.tech</a> if you need immediate access.</p>
        </div>
      </div>
    );
  }

  const { client, engagements, tasks, documents, team, portalAccessLevel, isPending } = data;
  const firstName = (user?.full_name || user?.email || '').split(' ')[0];
  const activeEngagement = engagements.find(e => e.id === activeEngagementId);

  return (
    <PortalLayout
      activePage={activePage}
      onNavigate={handleNavigate}
      engagements={engagements}
      clientName={client.name}
    >
      {isPending && (
        <div className="mx-6 mt-4 rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <span className="text-xl">⏳</span>
          <div>
            <p className="text-sm font-semibold text-amber-400">Access Pending Approval</p>
            <p className="text-xs text-amber-400/70">Your portal is in preview mode. The Clara.ai team will approve your full access shortly. Contact <a href="mailto:yogansh@claraai.tech" className="underline">yogansh@claraai.tech</a> to expedite.</p>
          </div>
        </div>
      )}
      {activePage === 'overview' && (
        <PortalOverview
          client={client}
          engagements={engagements}
          tasks={tasks}
          userName={firstName}
          onNavigate={handleNavigate}
        />
      )}
      {activePage.startsWith('engagement-') && activeEngagement && (
        <PortalEngagementDetail
          engagement={activeEngagement}
          tasks={tasks}
          client={client}
          team={team}
          documents={documents}
          portalAccessLevel={portalAccessLevel}
          onBack={() => handleNavigate('overview')}
        />
      )}
      {activePage === 'documents' && (
        <PortalDocuments
          documents={documents}
          engagements={engagements}
        />
      )}
      {activePage === 'contact' && (
        <PortalContact
          engagements={engagements}
          client={client}
        />
      )}
    </PortalLayout>
  );
}