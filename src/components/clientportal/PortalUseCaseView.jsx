import { ArrowLeft, ExternalLink, Video, FileText, ClipboardList } from 'lucide-react';

const MEETING_BADGE = {
  'Scheduled': 'badge-cyan',
  'Completed': 'badge-green',
  'Cancelled': 'badge-red',
  'Rescheduled': 'badge-amber',
};

function SectionCard({ title, children }) {
  return (
    <div className="card-glass p-5 space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400">{title}</h3>
      {children}
    </div>
  );
}

export default function PortalUseCaseView({ data, useCase, onBack, onOpenForm }) {
  const { meetings, forms, dataSources, steps, exceptions } = data;
  const form = forms.find(f => f.use_case_id === useCase.id);
  const ucMeetings = meetings.filter(m => m.use_case_id === useCase.id)
    .sort((a, b) => (b.meeting_date || '').localeCompare(a.meeting_date || ''));
  const formSteps = form ? steps.filter(s => s.form_id === form.id).sort((a, b) => (a.step_number || 0) - (b.step_number || 0)) : [];
  const formExceptions = form ? exceptions.filter(e => e.form_id === form.id) : [];
  const formSources = form ? dataSources.filter(d => d.form_id === form.id) : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground"><ArrowLeft className="w-4 h-4" /></button>
          <h2 className="text-xl font-bold text-foreground">{useCase.process_name}</h2>
        </div>
        {onOpenForm && (
          <button onClick={onOpenForm} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:bg-primary/90">
            <ClipboardList className="w-4 h-4" /> Open Discovery Form
          </button>
        )}
      </div>

      {/* Summary */}
      <SectionCard title="Summary">
        {useCase.problem_statement && <p className="text-sm text-foreground"><span className="text-red-400/80 font-semibold text-xs uppercase mr-2">Problem</span>{useCase.problem_statement}</p>}
        {useCase.solution_statement && <p className="text-sm text-foreground"><span className="text-emerald-400/80 font-semibold text-xs uppercase mr-2">Solution</span>{useCase.solution_statement}</p>}
        <div className="flex items-center gap-3 flex-wrap pt-1">
          <span className="badge-cyan text-[10px] px-2.5 py-1 rounded-full border font-semibold">{useCase.status || 'Discovery'}</span>
          {useCase.automation_type && <span className="badge-violet text-[10px] px-2.5 py-1 rounded-full border font-semibold">{useCase.automation_type}</span>}
          {useCase.demo_link && (
            <a href={useCase.demo_link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:bg-primary/90">
              View Demo <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </SectionCard>

      {/* Process Diagram */}
      {useCase.process_diagram_url && (
        <SectionCard title="Process Diagram">
          <a href={useCase.process_diagram_url} target="_blank" rel="noreferrer">
            <img src={useCase.process_diagram_url} alt={`${useCase.process_name} process diagram`} className="w-full rounded-xl border border-border" />
          </a>
        </SectionCard>
      )}

      {/* Meetings */}
      <SectionCard title="Meetings">
        {ucMeetings.length === 0 ? (
          <p className="text-xs text-muted-foreground">No meetings recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {ucMeetings.map(m => (
              <div key={m.id} className={`p-3 rounded-xl border ${m.status === 'Scheduled' ? 'border-cyan-500/40 bg-cyan-500/5' : 'border-border'}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <span className="font-medium text-sm text-foreground">{m.meeting_title}</span>
                    <span className="text-xs text-muted-foreground ml-2">{m.meeting_date || 'Date TBC'} · {m.meeting_type}</span>
                  </div>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${MEETING_BADGE[m.status] || 'badge-gray'}`}>{m.status}</span>
                </div>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {m.recording_link && (
                    <a href={m.recording_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300">
                      <Video className="w-3.5 h-3.5" /> Watch Recording
                    </a>
                  )}
                  {m.transcript_link && (
                    <a href={m.transcript_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300">
                      <FileText className="w-3.5 h-3.5" /> Transcript
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Process Overview */}
      {(formSteps.length > 0 || formExceptions.length > 0 || formSources.length > 0) && (
        <SectionCard title="Process Overview">
          {formSteps.length > 0 && (
            <div className="space-y-2">
              {formSteps.map(s => (
                <div key={s.id} className={`flex items-start gap-3 p-3 rounded-xl border ${s.is_pain_point ? 'border-red-500/30 bg-red-500/5' : 'border-border'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${s.is_pain_point ? 'bg-red-500/20 text-red-300' : 'bg-cyan-500/15 text-cyan-300'}`}>{s.step_number}</div>
                  <div className="min-w-0 text-xs">
                    <div className="text-sm text-foreground">{s.description}</div>
                    <div className="text-muted-foreground mt-0.5">
                      {[s.owner, s.system_used, s.approx_time].filter(Boolean).join(' · ')}
                    </div>
                    {s.is_pain_point && s.pain_point_note && <div className="text-red-400/90 mt-1">⚠ {s.pain_point_note}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {formExceptions.length > 0 && (
            <div className="pt-2">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Exceptions & Special Cases</h4>
              <div className="space-y-1.5">
                {formExceptions.map(e => (
                  <div key={e.id} className="text-xs text-muted-foreground"><span className="text-foreground font-medium">{e.condition}</span> — {e.current_handling}</div>
                ))}
              </div>
            </div>
          )}
          {formSources.length > 0 && (
            <div className="pt-2">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Data Sources</h4>
              <div className="flex flex-wrap gap-2">
                {formSources.map(s => (
                  <span key={s.id} className="badge-blue text-[10px] px-2.5 py-1 rounded-full border">
                    {s.source_name || s.system}{s.format ? ` · ${s.format}` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* Outcome */}
      {form && (form.goal_statement || form.must_haves || form.nice_to_haves || form.success_metric) && (
        <SectionCard title="Outcome">
          {form.goal_statement && <p className="text-sm text-foreground italic">"{form.goal_statement}"</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {form.must_haves && (
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1">Must-Haves</h4>
                <p className="text-xs text-muted-foreground whitespace-pre-line">{form.must_haves}</p>
              </div>
            )}
            {form.nice_to_haves && (
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-1">Nice-to-Haves</h4>
                <p className="text-xs text-muted-foreground whitespace-pre-line">{form.nice_to_haves}</p>
              </div>
            )}
          </div>
          {form.success_metric && (
            <p className="text-xs text-muted-foreground pt-1"><span className="text-foreground font-semibold">Success metric:</span> {form.success_metric}</p>
          )}
        </SectionCard>
      )}
    </div>
  );
}