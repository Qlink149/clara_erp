import { inr } from '@/lib/billingCycles';

const CARDS = [
  { key: 'all', label: 'Invoices this month', tone: 'text-foreground' },
  { key: 'Pending', label: 'Pending — to raise', tone: 'text-amber-600' },
  { key: 'Generated', label: 'Generated', tone: 'text-violet-500' },
  { key: 'Sent', label: 'Sent — awaiting payment', tone: 'text-blue-600' },
  { key: 'Received', label: 'Received', tone: 'text-emerald-600' },
];

export default function MonthSummary({ entries }) {
  const pick = (k) => (k === 'all' ? entries : entries.filter(e => e.status === k));
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {CARDS.map(c => {
        const list = pick(c.key);
        return (
          <div key={c.key} className="card-glass p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{c.label}</p>
            <p className={`text-3xl font-bold mt-1 ${c.tone}`}>{list.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{inr(list.reduce((s, e) => s + (e.amount || 0), 0))}</p>
          </div>
        );
      })}
    </div>
  );
}