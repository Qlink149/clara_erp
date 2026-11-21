import { format, parseISO } from 'date-fns';
import { FileText } from 'lucide-react';
import { STATUS_STYLE, inr } from '@/lib/billingCycles';

const STATUSES = ['Pending', 'Generated', 'Sent', 'Received'];

export default function MonthInvoiceRow({ entry, clientName, cycle, onStatus, onGenerate }) {
  const overdue = entry.status === 'Pending' && entry.dueDate < format(new Date(), 'yyyy-MM-dd');
  const badge = STATUS_STYLE[overdue ? 'Overdue' : entry.status];
  return (
    <div className="grid grid-cols-12 gap-3 items-center px-4 py-3 border-t border-border text-sm">
      <div className="col-span-2">
        <div className="font-semibold text-foreground">{format(parseISO(entry.dueDate), 'dd MMM')}</div>
        <div className="text-[11px] text-muted-foreground">{format(parseISO(entry.dueDate), 'EEEE')}</div>
      </div>
      <div className="col-span-4 min-w-0">
        <div className="font-medium text-foreground truncate">{clientName}</div>
        <div className="text-xs text-muted-foreground truncate">{entry.description}{cycle ? ` · every ${cycle}` : ''}</div>
      </div>
      <div className="col-span-2 font-semibold text-foreground">{inr(entry.amount)}</div>
      <div className="col-span-2">
        <select value={entry.status} onChange={e => onStatus(e.target.value)}
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer ${badge}`}>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {overdue && <div className="text-[10px] text-red-500 mt-1">Overdue</div>}
      </div>
      <div className="col-span-2 text-right">
        {entry.status === 'Pending' && (
          <button onClick={onGenerate} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            <FileText className="w-3.5 h-3.5" /> Generate
          </button>
        )}
      </div>
    </div>
  );
}