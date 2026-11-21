const cls = "bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 w-full";
const labelCls = "text-xs text-muted-foreground mb-1 block font-medium";

export default function PortalFormField({ label, value, onSave, type = 'text', options = [], rows = 2, placeholder, className = '' }) {
  return (
    <div className={className}>
      <label className={labelCls}>{label}</label>
      {type === 'select' ? (
        <select value={value || ''} onChange={e => onSave(e.target.value)} className={cls}>
          <option value="">—</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea defaultValue={value || ''} onBlur={e => onSave(e.target.value)} rows={rows} className={cls} placeholder={placeholder} />
      ) : (
        <input defaultValue={value || ''} onBlur={e => onSave(e.target.value)} className={cls} placeholder={placeholder} />
      )}
    </div>
  );
}