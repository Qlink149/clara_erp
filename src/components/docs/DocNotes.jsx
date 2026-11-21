import { useState, useEffect } from 'react';
import { Save, StickyNote } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function DocNotes({ clientId, isAdmin }) {
  const [content, setContent] = useState('');
  const [recordId, setRecordId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.ClientDocNote.filter({ clientId }).then(recs => {
      if (recs.length > 0) {
        setContent(recs[0].content || '');
        setRecordId(recs[0].id);
      }
      setLoading(false);
    });
  }, [clientId]);

  const handleSave = async () => {
    setSaving(true);
    if (recordId) {
      await base44.entities.ClientDocNote.update(recordId, { content });
    } else {
      const rec = await base44.entities.ClientDocNote.create({ clientId, content });
      setRecordId(rec.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <StickyNote className="w-3.5 h-3.5" /> Free-text notes — legal contacts, special clauses, internal reminders
        </p>
        {isAdmin && (
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/15 text-primary border border-primary/25 rounded-lg text-xs font-medium hover:bg-primary/25 transition-colors disabled:opacity-50">
            <Save className="w-3.5 h-3.5" />
            {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Notes'}
          </button>
        )}
      </div>

      <div className="card-glass rounded-xl overflow-hidden">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          disabled={!isAdmin}
          rows={14}
          placeholder={isAdmin ? "Add general notes here — key legal contacts, special contract clauses, internal reminders, etc." : "No notes yet."}
          className="w-full p-4 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none disabled:cursor-default"
        />
      </div>
      {!isAdmin && !content && (
        <p className="text-xs text-muted-foreground text-center">No notes have been added yet.</p>
      )}
    </div>
  );
}