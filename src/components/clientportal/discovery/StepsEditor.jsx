import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { base44 } from '@/api/base44Client';
import { inputCls } from './DiscoveryField';

// Drag-and-drop reorderable process steps, backed by PortalProcessStep.
export default function StepsEditor({ formId, onRowsChange, markSaved }) {
  const [rows, setRows] = useState([]);

  const setAndNotify = (updater) => {
    setRows(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      onRowsChange && onRowsChange(next);
      return next;
    });
  };

  useEffect(() => {
    if (!formId) return;
    base44.entities.PortalProcessStep.filter({ form_id: formId }).then(recs =>
      setAndNotify(recs.sort((a, b) => (a.step_number || 0) - (b.step_number || 0)))
    );
  }, [formId]);

  const addRow = async () => {
    const created = await base44.entities.PortalProcessStep.create({ form_id: formId, step_number: rows.length + 1 });
    setAndNotify(prev => [...prev, created]);
    markSaved && markSaved();
  };

  const updateLocal = (id, key, val) => setAndNotify(prev => prev.map(r => r.id === id ? { ...r, [key]: val } : r));
  const saveField = async (id, key, val) => { await base44.entities.PortalProcessStep.update(id, { [key]: val }); markSaved && markSaved(); };

  const removeRow = async (id) => {
    await base44.entities.PortalProcessStep.delete(id);
    const remaining = rows.filter(r => r.id !== id).map((r, i) => ({ ...r, step_number: i + 1 }));
    setAndNotify(remaining);
    await base44.entities.PortalProcessStep.bulkUpdate(remaining.map(r => ({ id: r.id, step_number: r.step_number })));
    markSaved && markSaved();
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const reordered = [...rows];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    const renumbered = reordered.map((r, i) => ({ ...r, step_number: i + 1 }));
    setAndNotify(renumbered);
    await base44.entities.PortalProcessStep.bulkUpdate(renumbered.map(r => ({ id: r.id, step_number: r.step_number })));
    markSaved && markSaved();
  };

  return (
    <div className="space-y-2">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Steps (drag to reorder)</h4>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="steps">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
              {rows.map((row, index) => (
                <Draggable key={row.id} draggableId={row.id} index={index}>
                  {(prov) => (
                    <div ref={prov.innerRef} {...prov.draggableProps}
                      className={`p-2.5 rounded-xl border ${row.is_pain_point ? 'border-red-500/30 bg-red-500/5' : 'border-border bg-secondary/20'}`}>
                      <div className="flex items-start gap-2">
                        <div {...prov.dragHandleProps} className="pt-2 text-muted-foreground cursor-grab"><GripVertical className="w-4 h-4" /></div>
                        <span className="w-6 h-6 mt-1 rounded-full bg-cyan-500/15 text-cyan-300 flex items-center justify-center text-[10px] font-bold flex-shrink-0">{row.step_number}</span>
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                          <input value={row.description ?? ''} onChange={e => updateLocal(row.id, 'description', e.target.value)} onBlur={e => saveField(row.id, 'description', e.target.value)} className={`${inputCls} text-xs col-span-2 md:col-span-4`} placeholder="Step description" />
                          <input value={row.owner ?? ''} onChange={e => updateLocal(row.id, 'owner', e.target.value)} onBlur={e => saveField(row.id, 'owner', e.target.value)} className={`${inputCls} text-xs`} placeholder="Owner" />
                          <input value={row.system_used ?? ''} onChange={e => updateLocal(row.id, 'system_used', e.target.value)} onBlur={e => saveField(row.id, 'system_used', e.target.value)} className={`${inputCls} text-xs`} placeholder="System used" />
                          <input value={row.approx_time ?? ''} onChange={e => updateLocal(row.id, 'approx_time', e.target.value)} onBlur={e => saveField(row.id, 'approx_time', e.target.value)} className={`${inputCls} text-xs`} placeholder="Approx. time" />
                          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                            <input type="checkbox" checked={!!row.is_pain_point} onChange={e => { updateLocal(row.id, 'is_pain_point', e.target.checked); saveField(row.id, 'is_pain_point', e.target.checked); }} className="w-3.5 h-3.5" />
                            Pain point
                          </label>
                          {row.is_pain_point && (
                            <input value={row.pain_point_note ?? ''} onChange={e => updateLocal(row.id, 'pain_point_note', e.target.value)} onBlur={e => saveField(row.id, 'pain_point_note', e.target.value)} className={`${inputCls} text-xs col-span-2 md:col-span-4 border-red-500/30`} placeholder="Pain point note" />
                          )}
                        </div>
                        <button onClick={() => removeRow(row.id)} className="pt-2 text-muted-foreground hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <button onClick={addRow} className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300">
        <Plus className="w-3.5 h-3.5" /> Add Another Step
      </button>
    </div>
  );
}