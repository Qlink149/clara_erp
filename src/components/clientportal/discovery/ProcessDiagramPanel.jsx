import { forwardRef } from 'react';
import { ArrowDown, CornerDownRight } from 'lucide-react';

// Live view-only flow diagram: auto-renders steps top-to-bottom; pain points red; exceptions as branches.
const ProcessDiagramPanel = forwardRef(function ProcessDiagramPanel({ steps, exceptions, processName }, ref) {
  const sorted = [...steps].sort((a, b) => (a.step_number || 0) - (b.step_number || 0));
  return (
    <div ref={ref} className="rounded-2xl border border-border p-5 space-y-1" style={{ background: '#ffffff', boxShadow: '0 1px 3px rgb(12 8 40 / 0.06), 0 8px 24px rgb(12 8 40 / 0.05)' }}>
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-3">Process Diagram — {processName}</h4>
      {sorted.length === 0 && (
        <p className="text-xs text-muted-foreground py-6 text-center">Add steps in Section D — the diagram draws itself as you type.</p>
      )}
      {sorted.map((s, i) => (
        <div key={s.id}>
          <div className={`px-3 py-2.5 rounded-xl border text-xs ${s.is_pain_point ? 'border-red-500/50 bg-red-500/10' : 'border-cyan-500/30 bg-cyan-500/5'}`}>
            <div className="flex items-start gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${s.is_pain_point ? 'bg-red-500/25 text-red-300' : 'bg-cyan-500/20 text-cyan-300'}`}>{s.step_number}</span>
              <div className="min-w-0">
                <div className="text-foreground">{s.description || '—'}</div>
                <div className="text-muted-foreground text-[10px] mt-0.5">{[s.owner, s.system_used, s.approx_time].filter(Boolean).join(' · ')}</div>
                {s.is_pain_point && s.pain_point_note && <div className="text-red-400/90 text-[10px] mt-1">⚠ {s.pain_point_note}</div>}
              </div>
            </div>
          </div>
          {i < sorted.length - 1 && (
            <div className="flex justify-center py-0.5"><ArrowDown className="w-3.5 h-3.5 text-cyan-500/50" /></div>
          )}
        </div>
      ))}
      {exceptions.length > 0 && (
        <div className="pt-4 space-y-1.5">
          <h5 className="text-[9px] font-bold uppercase tracking-widest text-amber-400/80">Exception Branches</h5>
          {exceptions.map(e => (
            <div key={e.id} className="flex items-start gap-1.5 text-[10px]">
              <CornerDownRight className="w-3 h-3 text-amber-400/60 flex-shrink-0 mt-0.5" />
              <div className="px-2.5 py-1.5 rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5 text-amber-200/80 flex-1">
                <span className="font-semibold">{e.condition || '—'}</span>
                {e.current_handling && <span className="text-muted-foreground"> → {e.current_handling}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default ProcessDiagramPanel;