import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Generic repeatable-rows editor backed by an entity.
// columns: [{ key, label, type: 'text'|'number'|'select'|'checkbox'|'date'|'tags', options, width }]
export default function RepeatableRows({ entityName, parentField, parentId, columns, title, addLabel = 'Add Another', defaults = {}, extraQuery = {}, onRowsChange }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const setAndNotify = (updater) => {
    setRows(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      onRowsChange && onRowsChange(next);
      return next;
    });
  };

  useEffect(() => {
    if (!parentId) return;
    base44.entities[entityName].filter({ [parentField]: parentId, ...extraQuery }).then(recs => {
      setAndNotify(recs);
      setLoading(false);
    });
  }, [parentId]);

  const addRow = async () => {
    const created = await base44.entities[entityName].create({ [parentField]: parentId, ...extraQuery, ...defaults });
    setAndNotify(prev => [...prev, created]);
  };

  const updateLocal = (id, key, val) => setAndNotify(prev => prev.map(r => r.id === id ? { ...r, [key]: val } : r));
  const saveField = (id, key, val) => base44.entities[entityName].update(id, { [key]: val });
  const removeRow = async (id) => {
    await base44.entities[entityName].delete(id);
    setAndNotify(prev => prev.filter(r => r.id !== id));
  };

  const inputCls = "bg-input border border-border rounded px-2 py-1 text-xs text-foreground w-full focus:outline-none focus:border-primary/50";

  const renderCell = (row, col) => {
    const val = row[col.key];
    if (col.type === 'checkbox') {
      return <input type="checkbox" checked={!!val} onChange={e => { updateLocal(row.id, col.key, e.target.checked); saveField(row.id, col.key, e.target.checked); }} className="w-3.5 h-3.5" />;
    }
    if (col.type === 'select') {
      return (
        <select value={val || ''} onChange={e => { updateLocal(row.id, col.key, e.target.value); saveField(row.id, col.key, e.target.value); }} className={inputCls} style={{ minWidth: col.width || 110 }}>
          <option value="">—</option>
          {col.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    if (col.type === 'tags') {
      return (
        <input
          defaultValue={Array.isArray(val) ? val.join(', ') : ''}
          onBlur={e => {
            const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
            updateLocal(row.id, col.key, arr);
            saveField(row.id, col.key, arr);
          }}
          className={inputCls} style={{ minWidth: col.width || 140 }} placeholder="comma separated"
        />
      );
    }
    return (
      <input
        type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
        value={val ?? ''}
        onChange={e => updateLocal(row.id, col.key, col.type === 'number' ? (parseFloat(e.target.value) || 0) : e.target.value)}
        onBlur={e => saveField(row.id, col.key, col.type === 'number' ? (parseFloat(e.target.value) || 0) : e.target.value)}
        className={inputCls} style={{ minWidth: col.width || 110 }}
      />
    );
  };

  return (
    <div className="space-y-2">
      {title && <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</h4>}
      {loading ? (
        <div className="text-xs text-muted-foreground">Loading...</div>
      ) : (
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
                  {columns.map(c => <td key={c.key} className={`py-1.5 px-1 align-top ${c.tdClass || ''}`}>{renderCell(row, c)}</td>)}
                  <td className="py-1.5 px-1">
                    <button onClick={() => removeRow(row.id)} className="text-muted-foreground hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={columns.length + 1} className="py-3 text-center text-muted-foreground">No entries yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <button onClick={addRow} className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300">
        <Plus className="w-3.5 h-3.5" /> {addLabel}
      </button>
    </div>
  );
}