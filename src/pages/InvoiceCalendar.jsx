import { useState, useEffect } from 'react';
import { FileText, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { useStore } from '@/lib/StoreContext';
import { useInvoiceAccess } from '@/lib/moduleAccess';
import NoAccessState from '@/components/ui/NoAccessState';
import { datesInMonth } from '@/lib/billingCycles';
import MonthSummary from '@/components/invoice/simple/MonthSummary';
import MonthInvoiceRow from '@/components/invoice/simple/MonthInvoiceRow';
import PlanList from '@/components/invoice/simple/PlanList';
import AddPlanModal from '@/components/invoice/simple/AddPlanModal';

export default function InvoiceCalendar({ onNavigateProforma }) {
  const canSee = useInvoiceAccess();
  const { clients } = useStore();
  const allClients = clients || [];
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [plans, setPlans] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    setLoading(true);
    const range = { $gte: format(month, 'yyyy-MM-dd'), $lte: format(endOfMonth(month), 'yyyy-MM-dd') };
    const [planPage, entryPage] = await Promise.all([
      base44.entities.InvoiceSchedule.filter({}, { sort: '-created_date', limit: 500 }),
      base44.entities.InvoiceEntry.filter({ dueDate: range }, { sort: 'dueDate', limit: 500 }),
    ]);
    let monthEntries = entryPage.items;
    const have = new Set(monthEntries.map(e => `${e.scheduleId}|${e.dueDate}`));
    const missing = planPage.items.filter(p => p.isActive !== false).flatMap(p =>
      datesInMonth(p, month).filter(d => !have.has(`${p.id}|${d}`)).map(d => ({
        scheduleId: p.id, clientId: p.clientId, description: p.description, amount: p.amount,
        dueDate: d, gstApplicable: p.gstApplicable, status: 'Pending',
      })));
    if (missing.length) {
      await base44.entities.InvoiceEntry.bulkCreate(missing);
      monthEntries = (await base44.entities.InvoiceEntry.filter({ dueDate: range }, { sort: 'dueDate', limit: 500 })).items;
    }
    setPlans(planPage.items);
    setEntries(monthEntries);
    setLoading(false);
  };

  useEffect(() => { if (canSee) load(); }, [canSee, month]);

  const clientName = (id) => allClients.find(c => c.id === id)?.name || 'Unknown client';
  const cycleOf = (sid) => plans.find(p => p.id === sid)?.billingCycle;

  const setStatus = async (id, status) => {
    await base44.entities.InvoiceEntry.update(id, { status });
    setEntries(prev => prev.map(e => (e.id === id ? { ...e, status } : e)));
  };

  const deletePlan = async (plan) => {
    if (!window.confirm(`Delete the billing plan "${plan.description}"? Its pending invoices will be removed.`)) return;
    await base44.entities.InvoiceEntry.deleteMany({ scheduleId: plan.id, status: 'Pending' });
    await base44.entities.InvoiceSchedule.delete(plan.id);
    load();
  };

  if (!canSee) return <NoAccessState message="Invoice Calendar is restricted. Contact Yogansh to get access." />;

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3"><FileText className="w-6 h-6 text-primary" /> Invoice Calendar</h1>
          <p className="text-muted-foreground mt-1">Who to bill, how much, and when — month by month.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="brand-button px-4 py-2 text-sm"><Plus className="w-4 h-4" /> Add billing plan</button>
      </div>

      <div className="inline-flex items-center gap-2 card-glass rounded-full px-2 py-1.5">
        <button onClick={() => setMonth(m => addMonths(m, -1))} className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"><ChevronLeft className="w-4 h-4" /></button>
        <h2 className="text-lg font-semibold text-foreground min-w-[150px] text-center">{format(month, 'MMMM yyyy')}</h2>
        <button onClick={() => setMonth(m => addMonths(m, 1))} className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"><ChevronRight className="w-4 h-4" /></button>
        <button onClick={() => setMonth(startOfMonth(new Date()))} className="ml-1 mr-2 px-3 py-1.5 rounded-full text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/15">This month</button>
      </div>

      <MonthSummary entries={entries} />

      <div className="card-glass overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-4 py-2.5 text-[11px] uppercase tracking-wider text-muted-foreground">
          <div className="col-span-2">Due date</div><div className="col-span-4">Client · Invoice title</div>
          <div className="col-span-2">Amount</div><div className="col-span-2">Status</div><div className="col-span-2" />
        </div>
        {loading ? <p className="py-10 text-center text-sm text-muted-foreground border-t border-border">Loading…</p>
          : entries.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground border-t border-border">No invoices due in {format(month, 'MMMM')}.</p>
          : entries.map(e => (
            <MonthInvoiceRow key={e.id} entry={e} clientName={clientName(e.clientId)} cycle={cycleOf(e.scheduleId)}
              onStatus={(s) => setStatus(e.id, s)} onGenerate={() => onNavigateProforma(e)} />
          ))}
      </div>

      <PlanList plans={plans} clientName={clientName} onDelete={deletePlan} />

      {showAdd && <AddPlanModal open={showAdd} onClose={() => setShowAdd(false)} clients={allClients} onSaved={load} />}
    </div>
  );
}