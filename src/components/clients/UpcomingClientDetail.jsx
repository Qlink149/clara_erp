import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn, formatDate, daysFromToday } from '@/lib/utils';
import useStore from '@/lib/store';
import { InlineTextEdit, InlineSelectEdit, InlineDateEdit } from '@/components/ui/InlineEdit';

const STAGE_OPTIONS = ['Lead', 'Proposal Sent', 'Negotiation', 'Contract Review', 'Closing'];
const SOURCE_OPTIONS = ['Referral', 'LinkedIn', 'Cold Outreach', 'Inbound', 'Other'];

export default function UpcomingClientDetail({ client, onConvert, onClose }) {
  const { updateUpcomingClient } = useStore();
  const [logText, setLogText] = useState('');

  const update = (field, value) => updateUpcomingClient(client.id, { [field]: value });

  return (
    <div className="space-y-5">
      {/* Pipeline Stage */}
      <div className="card-glass p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pipeline</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Stage</label>
            <InlineSelectEdit value={client.pipelineStage} options={STAGE_OPTIONS} onSave={(v) => update('pipelineStage', v)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Source</label>
            <InlineSelectEdit value={client.source} options={SOURCE_OPTIONS} onSave={(v) => update('source', v)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Expected Start</label>
            <InlineDateEdit value={client.expectedStartDate} onSave={(v) => update('expectedStartDate', v)} />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="card-glass p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contact</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {['name', 'designation', 'phone', 'email'].map((f) => (
            <div key={f}>
              <label className="text-xs text-muted-foreground block mb-0.5 capitalize">{f}</label>
              <InlineTextEdit value={client.primaryContact?.[f]} onSave={(v) => update('primaryContact', { ...client.primaryContact, [f]: v })} className="text-foreground" />
            </div>
          ))}
        </div>
      </div>

      {/* Next Action */}
      <div className="card-glass p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Next Action</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-0.5">Action</label>
            <InlineTextEdit value={client.nextAction} onSave={(v) => update('nextAction', v)} className="text-sm text-foreground" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-0.5">Due Date</label>
            <div className="flex items-center gap-2">
              <InlineDateEdit value={client.nextActionDate} onSave={(v) => update('nextActionDate', v)} />
              {client.nextActionDate && daysFromToday(client.nextActionDate) < 0 && (
                <span className="text-xs font-bold text-red-400">{Math.abs(daysFromToday(client.nextActionDate))}d overdue</span>
              )}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-0.5">Last Touchpoint</label>
            <InlineTextEdit value={client.lastTouchpointSummary} onSave={(v) => update('lastTouchpointSummary', v)} multiline className="text-sm text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="card-glass p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Notes</h3>
        <InlineTextEdit value={client.notes} onSave={(v) => update('notes', v)} multiline placeholder="Add notes..." className="text-sm text-muted-foreground w-full" />
      </div>

      {/* Convert Button */}
      <button
        onClick={() => { onConvert(client.id); onClose(); }}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500/25 transition-colors font-medium text-sm"
      >
        <ArrowRight className="w-4 h-4" />
        Convert to Current Client
      </button>
    </div>
  );
}