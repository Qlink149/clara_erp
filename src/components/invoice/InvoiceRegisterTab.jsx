import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Eye, RefreshCw, Pencil, Trash2, X, Printer } from 'lucide-react';
import InvoicePreview from '@/components/invoice/InvoicePreview';
import { printInvoiceHtml } from '@/lib/printInvoice';

const STATUS_OPTIONS = ['Draft', 'Generated', 'Sent', 'Paid'];
const statusColors = {
  Draft: 'badge-gray',
  Generated: 'badge-blue',
  Sent: 'badge-amber',
  Paid: 'badge-green',
};

// Reconstruct settings-like object from saved seller snapshot
function settingsFromInv(inv) {
  return {
    companyName: inv.sellerName || '',
    companyAddress: inv.sellerAddress || '',
    companyGSTIN: inv.sellerGSTIN || '',
    companyPAN: inv.sellerPAN || '',
    companyStateName: inv.sellerStateName || '',
    companyStateCode: inv.sellerStateCode || '',
    companyEmail: inv.sellerEmail || '',
  };
}

// Reconstruct buyer object from saved snapshot
function buyerFromInv(inv) {
  return {
    clientId: inv.clientId || '',
    name: inv.buyerName || '',
    address: inv.buyerAddress || '',
    gstin: inv.buyerGSTIN || '',
    pan: inv.buyerPAN || '',
    stateName: inv.buyerStateName || '',
    stateCode: inv.buyerStateCode || '',
  };
}

function ViewModal({ inv, onClose }) {
  const previewRef = (el) => { window._invoicePreviewEl = el; };

  const settings = settingsFromInv(inv);
  const buyer = buyerFromInv(inv);
  const lines = inv.lineItems || [];
  const gstApplicable = inv.gstApplicable !== false;
  const gstType = inv.gstType || inv.taxType || 'CGST+SGST';
  const igstRate = inv.igstRate || 18;
  const cgstRate = inv.cgstRate || 9;
  const discount = (inv.discountType && inv.discountValue > 0) ? { type: inv.discountType, value: inv.discountValue } : null;

  const handlePrint = () => {
    const el = window._invoicePreviewEl;
    if (!el) return;
    printInvoiceHtml(el.innerHTML);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 overflow-auto py-8 px-4">
      <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-4xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="font-bold text-foreground">Invoice #{inv.invoiceNumber}</span>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90">
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-4 overflow-auto" ref={previewRef}>
          <InvoicePreview
            settings={settings}
            invoiceNo={inv.invoiceNumber}
            invoiceDate={inv.invoiceDate}
            buyer={buyer}
            lines={lines}
            gstApplicable={gstApplicable}
            gstType={gstType}
            igstRate={igstRate}
            cgstRate={cgstRate}
            deliveryNote={inv.deliveryNote}
            paymentTerms={inv.paymentTerms}
            referenceNo={inv.referenceNo}
            discount={discount}
          />
        </div>
      </div>
    </div>
  );
}

export default function InvoiceRegisterTab({ allClients, onEditInvoice }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterClient, setFilterClient] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [viewingInv, setViewingInv] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // invoice to delete
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.ProformaInvoice.list('-invoiceDate');
    setInvoices(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    await base44.entities.ProformaInvoice.update(id, { status });
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    await base44.entities.ProformaInvoice.delete(deleteConfirm.id);
    setInvoices(prev => prev.filter(i => i.id !== deleteConfirm.id));
    setDeleteConfirm(null);
    setDeleting(false);
  };

  const getClientName = (clientId) => allClients.find(c => c.id === clientId)?.name || '—';

  const filtered = invoices.filter(inv => {
    if (filterClient && inv.clientId !== filterClient) return false;
    if (filterStatus && inv.status !== filterStatus) return false;
    if (filterFrom && inv.invoiceDate < filterFrom) return false;
    if (filterTo && inv.invoiceDate > filterTo) return false;
    return true;
  });

  const totalInvoiced = Math.round(filtered.reduce((s, i) => s + Math.round(i.totalAmount || 0), 0));
  const totalTax = Math.round(filtered.reduce((s, i) => s + Math.round(i.taxAmount || 0), 0));
  const outstanding = Math.round(filtered.filter(i => i.status !== 'Paid').reduce((s, i) => s + Math.round(i.totalAmount || 0), 0));
  const thisMonth = format(new Date(), 'yyyy-MM');
  const thisMonthCount = invoices.filter(i => i.invoiceDate?.startsWith(thisMonth) && i.status !== 'Draft').length;

  const fmt = (n) => Math.round(n || 0).toLocaleString('en-IN');

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-glass p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Generated This Month</p>
          <p className="text-2xl font-bold text-cyan-400">{thisMonthCount}</p>
        </div>
        <div className="card-glass p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Invoiced</p>
          <p className="text-xl font-bold text-foreground">₹{fmt(totalInvoiced)}</p>
        </div>
        <div className="card-glass p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Tax Collected</p>
          <p className="text-xl font-bold text-purple-400">₹{fmt(totalTax)}</p>
        </div>
        <div className="card-glass p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Outstanding</p>
          <p className="text-xl font-bold text-amber-400">₹{fmt(outstanding)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card-glass p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Client</label>
          <select value={filterClient} onChange={e => setFilterClient(e.target.value)} className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none">
            <option value="">All Clients</option>
            {allClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none">
            <option value="">All</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">From</label>
          <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">To</label>
          <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none" />
        </div>
        <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-muted-foreground hover:text-foreground">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading...</div>
      ) : (
        <div className="card-glass overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {['Inv No.', 'Date', 'Client', 'Description', 'Taxable (₹)', 'Tax Type', 'Tax (₹)', 'Total (₹)', 'Status', 'Source', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-muted-foreground font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={11} className="text-center py-12 text-muted-foreground">No invoices found</td></tr>
              )}
              {filtered.map(inv => (
                <tr key={inv.id} className="border-b border-border/40 hover:bg-white/2">
                  <td className="py-3 px-3 font-mono font-semibold text-foreground">#{inv.invoiceNumber}</td>
                  <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">{inv.invoiceDate}</td>
                  <td className="py-3 px-3 text-foreground font-medium">{getClientName(inv.clientId)}</td>
                  <td className="py-3 px-3 text-muted-foreground max-w-[180px] truncate">
                    {(inv.lineItems || []).map(l => l.description).join('; ')}
                  </td>
                  <td className="py-3 px-3 text-right text-foreground">{fmt(inv.taxableAmount)}</td>
                  <td className="py-3 px-3 text-center text-muted-foreground">{inv.taxType} {inv.taxType === 'IGST' ? '18%' : '9%+9%'}</td>
                  <td className="py-3 px-3 text-right text-foreground">{fmt(inv.taxAmount)}</td>
                  <td className="py-3 px-3 text-right font-bold text-foreground">{fmt(inv.totalAmount)}</td>
                  <td className="py-3 px-3">
                    <select
                      value={inv.status}
                      onChange={e => updateStatus(inv.id, e.target.value)}
                      className={cn('rounded px-2 py-1 text-[10px] font-semibold border focus:outline-none cursor-pointer', statusColors[inv.status])}
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground text-[10px]">
                    {inv.scheduleEntryId ? 'Calendar' : 'Ad-hoc'}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewingInv(inv)}
                        className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-[10px] font-medium"
                        title="View Invoice"
                      >
                        <Eye className="w-3 h-3" /> View
                      </button>
                      <button
                        onClick={() => onEditInvoice && onEditInvoice(inv)}
                        className="flex items-center gap-1 text-amber-400 hover:text-amber-300 text-[10px] font-medium"
                        title="Edit Invoice"
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(inv)}
                        className="flex items-center gap-1 text-red-400 hover:text-red-300 text-[10px] font-medium"
                        title="Delete Invoice"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View Modal */}
      {viewingInv && (
        <ViewModal inv={viewingInv} onClose={() => setViewingInv(null)} />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-background rounded-2xl border border-border shadow-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-foreground">Delete Invoice</h3>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to permanently delete <span className="text-foreground font-semibold">Invoice #{deleteConfirm.invoiceNumber}</span> for <span className="text-foreground font-semibold">{getClientName(deleteConfirm.clientId)}</span>? This cannot be undone. The invoice number will not be reused.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-60">
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}