import { useState } from 'react';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { useStore } from '@/lib/StoreContext';
import EngagementCard from './EngagementCard';
import EngagementModal from './EngagementModal';
import EngagementDetail from './EngagementDetail';

export default function EngagementsTab({ clientId }) {
  const { engagements, team, tasks, addEngagement, updateEngagement } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editingEng, setEditingEng] = useState(null);
  const [detailEng, setDetailEng] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  const clientEngagements = engagements.filter(e => e.clientId === clientId);
  const active = clientEngagements.filter(e => !e.archived);
  const archived = clientEngagements.filter(e => e.archived);

  const handleSave = (formData) => {
    if (editingEng) {
      updateEngagement(editingEng.id, formData);
      if (detailEng?.id === editingEng.id) setDetailEng({ ...editingEng, ...formData });
    } else {
      addEngagement({ ...formData, clientId });
    }
    setEditingEng(null);
  };

  const handleEdit = (eng) => { setEditingEng(eng); setShowModal(true); };
  const handleRestore = (eng) => updateEngagement(eng.id, { archived: false });

  if (detailEng) {
    const currentEng = engagements.find(e => e.id === detailEng.id) || detailEng;
    return (
      <EngagementDetail
        engagement={currentEng}
        clientId={clientId}
        onClose={() => setDetailEng(null)}
        onUpdate={(updates) => updateEngagement(currentEng.id, updates)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{active.length} engagement{active.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => { setEditingEng(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Engagement
        </button>
      </div>

      {active.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No engagements yet. Click "+ Add Engagement" to create one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map(eng => (
            <EngagementCard
              key={eng.id}
              engagement={eng}
              team={team}
              tasks={tasks}
              onEdit={handleEdit}
              onViewDetail={(e) => setDetailEng(e)}
            />
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <div>
          <button onClick={() => setShowArchived(o => !o)} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-2">
            {showArchived ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            Archived Engagements ({archived.length})
          </button>
          {showArchived && (
            <div className="space-y-3 mt-2">
              {archived.map(eng => (
                <EngagementCard
                  key={eng.id}
                  engagement={eng}
                  team={team}
                  tasks={tasks}
                  onEdit={() => {}}
                  onViewDetail={() => {}}
                  archived
                  onRestore={handleRestore}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <EngagementModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingEng(null); }}
        onSave={handleSave}
        engagement={editingEng}
        team={team}
        clientEngagements={clientEngagements}
      />
    </div>
  );
}