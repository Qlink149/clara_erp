import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';

const STATUS_STYLES = {
  'Completed': 'badge-green',
  'Partial': 'badge-amber',
  'Not Done': 'badge-red',
};

function ProgressBar({ score }) {
  const color = score >= 80 ? 'bg-green-400' : score >= 50 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-2.5 bg-secondary rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-sm font-bold text-foreground">{score}%</span>
    </div>
  );
}

export default function KpiMemberView({ member, kpis, progress, period, onBack, onRefresh, isAdmin }) {
  const [updating, setUpdating] = useState(null);

  const calcScore = () => {
    if (!kpis.length) return 0;
    let totalWeight = 0, weightedScore = 0;
    for (const kpi of kpis) {
      const prog = progress.find(p => p.kpiId === kpi.id);
      totalWeight += kpi.weightage || 0;
      if (!prog) continue;
      if (prog.status === 'Completed') weightedScore += kpi.weightage || 0;
      else if (prog.status === 'Partial') weightedScore += (kpi.weightage || 0) * 0.5;
    }
    return totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;
  };

  const getProgress = (kpiId) => progress.find(p => p.kpiId === kpiId);

  const updateProgress = async (kpi, field, value) => {
    setUpdating(kpi.id);
    const existing = getProgress(kpi.id);
    if (existing) {
      await base44.entities.KPIProgress.update(existing.id, { [field]: value });
    } else {
      await base44.entities.KPIProgress.create({ kpiId: kpi.id, teamMemberId: member.id, period, [field]: value, status: field === 'status' ? value : 'Not Done' });
    }
    await onRefresh();
    setUpdating(null);
  };

  const score = calcScore();
  const completed = kpis.filter(k => getProgress(k.id)?.status === 'Completed').length;

  return (
    <div className="space-y-5 animate-fade-in">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to team overview
        </button>
      )}

      {/* Member Header */}
      <div className="card-glass p-5 flex items-center gap-5">
        <div className={cn('w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold', `bg-${member.color || 'cyan'}-500/20 text-${member.color || 'cyan'}-300`)}>
          {member.avatar}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-foreground">{member.name}</h2>
          <p className="text-sm text-muted-foreground">{member.role} · {period}</p>
          <ProgressBar score={score} />
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-foreground">{score}%</div>
          <div className="text-xs text-muted-foreground">{completed}/{kpis.length} completed</div>
        </div>
      </div>

      {/* KPI List */}
      <div className="space-y-3">
        {kpis.length === 0 && <div className="card-glass p-8 text-center text-muted-foreground text-sm">No KPIs defined for this team member.</div>}
        {kpis.map(kpi => {
          const prog = getProgress(kpi.id);
          const isUpdating = updating === kpi.id;
          return (
            <div key={kpi.id} className="card-glass p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{kpi.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium badge-gray">{kpi.frequency}</span>
                    <span className="text-[10px] text-muted-foreground">{kpi.weightage}%</span>
                  </div>
                  {kpi.description && <p className="text-xs text-muted-foreground mt-0.5">{kpi.description}</p>}
                </div>
                {prog && <span className={cn('px-2 py-0.5 rounded text-[10px] font-semibold border', STATUS_STYLES[prog.status] || 'badge-gray')}>{prog.status}</span>}
              </div>

              {isAdmin && (
                <div className="grid grid-cols-2 gap-3">
                  {kpi.targetType === 'number' ? (
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-1">Achieved Value (Target: {kpi.targetValue})</label>
                      <input
                        type="number"
                        defaultValue={prog?.achievedValue || ''}
                        onBlur={e => updateProgress(kpi, 'achievedValue', parseFloat(e.target.value))}
                        disabled={isUpdating}
                        className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-1">Achieved?</label>
                      <select defaultValue={prog?.achievedYesNo ? 'yes' : 'no'} onChange={e => updateProgress(kpi, 'achievedYesNo', e.target.value === 'yes')} disabled={isUpdating}
                        className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none">
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-1">Status</label>
                    <select value={prog?.status || 'Not Done'} onChange={e => updateProgress(kpi, 'status', e.target.value)} disabled={isUpdating}
                      className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none">
                      {['Completed', 'Partial', 'Not Done'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-muted-foreground block mb-1">Comments</label>
                    <input
                      type="text"
                      defaultValue={prog?.comments || ''}
                      onBlur={e => updateProgress(kpi, 'comments', e.target.value)}
                      disabled={isUpdating}
                      className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none"
                      placeholder="Optional notes..."
                    />
                  </div>
                </div>
              )}
              {!isAdmin && prog && (
                <div className="text-xs text-muted-foreground">
                  {kpi.targetType === 'number' && <span>Achieved: {prog.achievedValue ?? '—'} / {kpi.targetValue}</span>}
                  {prog.comments && <span className="ml-3">{prog.comments}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}