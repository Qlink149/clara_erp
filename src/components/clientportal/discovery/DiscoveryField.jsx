import { useState } from 'react';
import { Lock, ChevronDown, ChevronRight, Lightbulb } from 'lucide-react';

export const inputCls = "bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 w-full";

export function InternalBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-amber-400 text-[9px] font-bold uppercase ml-1.5 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/25">
      <Lock className="w-2.5 h-2.5" /> Internal
    </span>
  );
}

// Auto-saving field: change() buffers, flush() writes (on blur / immediately for selects)
export function Field({ form, k, label, type = 'text', options, rows, internal, hint, placeholder, change, flush }) {
  const commit = (v) => { change(k, v); flush(); };
  return (
    <div className={internal ? 'rounded-lg bg-amber-500/[0.07] border border-amber-500/15 p-2' : ''} title={hint || undefined}>
      <label className="text-xs text-muted-foreground mb-1 block font-medium">
        {label}{internal && <InternalBadge />}
      </label>
      {type === 'select' ? (
        <select value={form[k] || ''} onChange={e => commit(e.target.value)} className={inputCls}>
          <option value="">—</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea value={form[k] || ''} onChange={e => change(k, e.target.value)} onBlur={flush} rows={rows || 2} className={inputCls} placeholder={placeholder} />
      ) : type === 'checkbox' ? (
        <input type="checkbox" checked={!!form[k]} onChange={e => commit(e.target.checked)} className="w-4 h-4" />
      ) : (
        <input value={form[k] || ''} onChange={e => change(k, e.target.value)} onBlur={flush} className={inputCls} placeholder={placeholder} />
      )}
      {hint && <p className="text-[10px] text-muted-foreground/70 mt-1 italic">{hint}</p>}
    </div>
  );
}

export function Section({ id, title, subtitle, children }) {
  const [open, setOpen] = useState(true);
  return (
    <section id={id} className="card-glass p-5 space-y-4 scroll-mt-24">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between text-left">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400">{title}</h3>
          {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && children}
    </section>
  );
}

export function ReminderChip({ children }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 text-[11px] text-cyan-300/90">
      <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}