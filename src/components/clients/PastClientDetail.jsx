import { cn, formatDate } from '@/lib/utils';
import useStore from '@/lib/store';
import { InlineTextEdit } from '@/components/ui/InlineEdit';
import { CheckCircle, RotateCcw } from 'lucide-react';

export default function PastClientDetail({ client, onReactivate, onClose }) {
  const { updatePastClient, team } = useStore();
  const update = (field, value) => updatePastClient(client.id, { [field]: value });
  const getMember = (id) => team.find((m) => m.id === id);

  return (
    <div className="space-y-5">
      {/* Overview */}
      <div className="card-glass p-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <label className="text-xs text-muted-foreground">Project Period</label>
          <p className="text-foreground mt-0.5">{formatDate(client.projectStartDate)} – {formatDate(client.projectEndDate)}</p>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Closure Reason</label>
          <p className="text-foreground mt-0.5">{client.closureReason}</p>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Contact</label>
          <p className="text-foreground mt-0.5">{client.primaryContact?.name} · {client.primaryContact?.phone}</p>
        </div>
      </div>

      {/* Notes */}
      <div className="card-glass p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Project Notes</h3>
        <p className="text-sm text-muted-foreground">{client.internalNotes}</p>
      </div>

      {/* Re-engagement Note */}
      <div className="card-glass p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Re-engagement Note</h3>
        <InlineTextEdit value={client.reEngagementNote} onSave={(v) => update('reEngagementNote', v)} multiline placeholder="Notes for re-engagement..." className="text-sm text-muted-foreground w-full" />
      </div>

      {/* Task History */}
      <div className="card-glass p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Task History ({(client.taskHistory || []).length})</h3>
        <div className="space-y-2">
          {(client.taskHistory || []).map((task) => {
            const member = getMember(task.assigneeId);
            return (
              <div key={task.id} className="flex items-center justify-between gap-3 p-3 bg-secondary/50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{task.name}</p>
                  <p className="text-xs text-muted-foreground">{member?.name} · {formatDate(task.dateCompleted)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-muted-foreground">{task.timeTaken}h / {task.timeAllocated}h</span>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reactivate */}
      <button
        onClick={() => { onReactivate(client.id); onClose(); }}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500/25 transition-colors font-medium text-sm"
      >
        <RotateCcw className="w-4 h-4" />
        Reactivate Client
      </button>
    </div>
  );
}