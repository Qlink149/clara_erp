import { format, parseISO } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { nextDate, inr } from '@/lib/billingCycles';

export default function PlanList({ plans, clientName, onDelete }) {
  return (
    <div className="card-glass overflow-hidden">
      <div className="px-4 py-3">
        <h3 className="font-semibold text-foreground">Billing plans</h3>
        <p className="text-xs text-muted-foreground">One row per client engagement — invoices are created from these automatically.</p>
      </div>
      {plans.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground border-t border-border">No billing plans yet. Click "Add billing plan" to start.</p>
      ) : plans.map(p => {
        const next = nextDate(p);
        return (
          <div key={p.id} className="grid grid-cols-12 gap-3 items-center px-4 py-3 border-t border-border text-sm">
            <div className="col-span-4 min-w-0">
              <div className="font-medium text-foreground truncate">{clientName(p.clientId)}</div>
              <div className="text-xs text-muted-foreground truncate">{p.description}</div>
            </div>
            <div className="col-span-2 font-semibold">{inr(p.amount)}</div>
            <div className="col-span-2 text-xs text-muted-foreground">Started {format(parseISO(p.firstInvoiceDate), 'dd MMM yyyy')}</div>
            <div className="col-span-2 text-xs"><span className="badge-violet px-2 py-0.5 rounded-full border">{p.billingCycle}</span></div>
            <div className="col-span-1 text-xs text-muted-foreground">{next ? `Next ${format(parseISO(next), 'dd MMM')}` : 'Done'}</div>
            <div className="col-span-1 text-right">
              <button onClick={() => onDelete(p)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        );
      })}
    </div>
  );
}