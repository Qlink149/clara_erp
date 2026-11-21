import { Plus, Trash2 } from 'lucide-react';

const inputCls = "bg-input border border-border rounded px-2 py-1 text-xs text-foreground w-full focus:outline-none focus:border-primary/50";

// Row editor for the client-facing discovery form — all writes go through callbacks (backend-proxied).
export default function PortalRowsEditor({ rows, columns, onAdd, onUpdate, onDelete, addLabel = 'Add Another' }) {
  const renderCell = (row, col) => {
    const val = row[col.key];
    if (col.type === 'checkbox') {
      return <input type="checkbox" checked={!!val} onChange={e => onUpdate(row.id, col.key, e.target.checked)} className="w-3.5 h-3.5" />;
    }
    if (col.type === 'select') {
      return (
        <select value={val || ''} onChange={e => onUpdate(row.id, col.key, e.target.value)} className={inputCls} style={{ minWidth: col.width || 110 }}>
          <option value="">—</option>
          {col.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    return (
      <input
        type={col.type === 'number' ? 'number' : 'text'}
        defaultValue={val ?? ''}
        onBlur={e => onUpdate(row.id, col.key, col.type === 'number' ? (parseFloat(e.target.value) || 0) : e.target.value)}
        className={inputCls} style={{ minWidth: col.width || 110 }}
      />
    );
  };

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              {columns.map(c => <th key={c.key} className="text-left py-1.5 px-1 text-muted-foreground font-semibold">{c.label}</th>)}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id} className="border-b border-border/40">
                {columns.map(c => <td key={c.key} className="py-1.5 px-1 align-top">{renderCell(row, c)}</td>)}
                <td className="py-1.5 px-1">
                  <button onClick={() => onDelete(row.id)} className="text-muted-foreground hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={columns.length + 1} className="py-3 text-center text-muted-foreground">No entries yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <button onClick={onAdd} className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300">
        <Plus className="w-3.5 h-3.5" /> {addLabel}
      </button>
    </div>
  );
}