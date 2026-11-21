import { cn } from '@/lib/utils';
import { BarChart2, TrendingUp } from 'lucide-react';

function calcScore(kpis, progress) {
  if (!kpis.length) return { score: 0, completed: 0, total: kpis.length };
  let totalWeight = 0;
  let weightedScore = 0;
  let completed = 0;
  for (const kpi of kpis) {
    const prog = progress.find(p => p.kpiId === kpi.id);
    totalWeight += kpi.weightage || 0;
    if (!prog) continue;
    if (prog.status === 'Completed') {
      weightedScore += kpi.weightage || 0;
      completed++;
    } else if (prog.status === 'Partial') {
      weightedScore += (kpi.weightage || 0) * 0.5;
    }
  }
  const score = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;
  return { score, completed, total: kpis.length };
}

function ScoreBar({ score }) {
  const color = score >= 80 ? 'bg-green-400' : score >= 50 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold text-foreground w-8 text-right">{score}%</span>
    </div>
  );
}

export default function KpiTeamOverview({ team, kpis, progress, period, onSelectMember }) {
  const rows = team.map(member => {
    const memberKpis = kpis.filter(k => k.teamMemberId === member.id && k.isActive);
    const memberProgress = progress.filter(p => p.teamMemberId === member.id);
    return { member, ...calcScore(memberKpis, memberProgress) };
  }).sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-4">
      {/* Leaderboard */}
      <div className="card-glass p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-foreground/70">Team Leaderboard — {period}</span>
        </div>
        <div className="space-y-3">
          {rows.map(({ member, score, completed, total }, idx) => (
            <button key={member.id} onClick={() => onSelectMember(member)} className="w-full flex items-center gap-4 p-3 rounded-xl border border-border hover:bg-secondary/30 transition-colors text-left">
              <span className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold', idx === 0 ? 'bg-amber-400/20 text-amber-400' : idx === 1 ? 'bg-gray-400/20 text-gray-300' : idx === 2 ? 'bg-orange-400/20 text-orange-400' : 'bg-secondary text-muted-foreground')}>
                {idx + 1}
              </span>
              <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0', `bg-${member.color || 'cyan'}-500/20 text-${member.color || 'cyan'}-300`)}>
                {member.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-foreground">{member.name}</span>
                  <span className="text-xs text-muted-foreground">{completed}/{total} KPIs</span>
                </div>
                <ScoreBar score={score} />
              </div>
            </button>
          ))}
          {rows.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No team members found.</p>}
        </div>
      </div>
    </div>
  );
}