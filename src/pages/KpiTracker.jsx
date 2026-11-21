import { useState, useEffect, useMemo } from 'react';
import { BarChart2, Plus, Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useStore } from '@/lib/StoreContext';
import { useAuthorization } from '@/lib/AuthorizationContext';
import { useKpiAdminAccess, useKpiViewOwnAccess } from '@/lib/moduleAccess';
import NoAccessState from '@/components/ui/NoAccessState';
import KpiTeamOverview from '@/components/kpi/KpiTeamOverview';
import KpiMemberView from '@/components/kpi/KpiMemberView';
import AddKpiModal from '@/components/kpi/AddKpiModal';
import { format } from 'date-fns';

export default function KpiTracker() {
  const isAdmin = useKpiAdminAccess();
  const canViewOwn = useKpiViewOwnAccess();
  const authz = useAuthorization();
  const { team } = useStore();

  const [kpis, setKpis] = useState([]);
  const [progress, setProgress] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showAddKpi, setShowAddKpi] = useState(false);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(format(new Date(), 'yyyy-MM'));

  const load = async () => {
    setLoading(true);
    const [k, p] = await Promise.all([
      base44.entities.KPI.list(),
      base44.entities.KPIProgress.filter({ period }),
    ]);
    setKpis(k);
    setProgress(p);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin || canViewOwn) load(); }, [isAdmin, canViewOwn, period]);

  // For non-admin, find their own member record
  const myMember = useMemo(() => {
    if (isAdmin) return null;
    return team.find(m => m.email && m.email.toLowerCase() === authz?.email?.toLowerCase());
  }, [team, authz, isAdmin]);

  if (!isAdmin && !canViewOwn) return <NoAccessState message="KPI Tracker access is restricted. Contact Yogansh." />;

  // Non-admin: show only own KPIs
  if (!isAdmin && myMember) {
    const myKpis = kpis.filter(k => k.teamMemberId === myMember.id && k.isActive);
    const myProgress = progress.filter(p => p.teamMemberId === myMember.id);
    return (
      <div className="p-6 space-y-5 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <BarChart2 className="w-6 h-6 text-primary" />
            My KPIs
          </h1>
          <p className="text-muted-foreground mt-1">Your performance for {period}</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Period:</label>
          <input type="month" value={period} onChange={e => setPeriod(e.target.value)} className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none" />
        </div>
        {loading ? <div className="text-muted-foreground text-sm">Loading...</div> : (
          <KpiMemberView member={myMember} kpis={myKpis} progress={myProgress} period={period} onRefresh={load} isAdmin={false} />
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <BarChart2 className="w-6 h-6 text-primary" />
            KPI Tracker
          </h1>
          <p className="text-muted-foreground mt-1">Team performance overview</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="month" value={period} onChange={e => setPeriod(e.target.value)} className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none" />
          <button onClick={() => setShowAddKpi(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90">
            <Plus className="w-4 h-4" /> Add KPI
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading...</div>
      ) : selectedMember ? (
        <KpiMemberView
          member={selectedMember}
          kpis={kpis.filter(k => k.teamMemberId === selectedMember.id && k.isActive)}
          progress={progress.filter(p => p.teamMemberId === selectedMember.id)}
          period={period}
          onBack={() => setSelectedMember(null)}
          onRefresh={load}
          isAdmin={true}
        />
      ) : (
        <KpiTeamOverview team={team} kpis={kpis} progress={progress} period={period} onSelectMember={setSelectedMember} />
      )}

      {showAddKpi && <AddKpiModal open={showAddKpi} onClose={() => setShowAddKpi(false)} team={team} onSaved={load} />}
    </div>
  );
}