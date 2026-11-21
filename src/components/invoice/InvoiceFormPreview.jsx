import { useState, useRef } from 'react';
import { Plus, Trash2, Save, Download, Send } from 'lucide-react';
import { emptyLine, autoGstType } from '@/lib/invoiceUtils';
import { cn } from '@/lib/utils';
import InvoicePreview from '@/components/invoice/InvoicePreview';
import ClientSearchCombobox from '@/components/invoice/ClientSearchCombobox';

const GST_TYPE_OPTIONS = [
  { value: 'IGST', label: 'IGST Only (18% integrated — inter-state)' },
  { value: 'CGST+SGST', label: 'CGST + SGST (9% + 9% — intra-state)' },
  { value: 'IGST+CGST', label: 'IGST + CGST (custom rates — set manually)' },
  { value: 'EXEMPT', label: 'Exempt / No GST (zero tax)' },
];

export default function InvoiceFormPreview({
  settings,
  invoiceNo, setInvoiceNo,
  invoiceDate, setInvoiceDate,
  buyer, setBuyer,
  lines, setLines,
  gstApplicable, setGstApplicable,
  gstType, setGstType,
  igstRate, setIgstRate,
  cgstRate, setCgstRate,
  deliveryNote, setDeliveryNote,
  paymentTerms, setPaymentTerms,
  referenceNo, setReferenceNo,
  discount, setDiscount,
  allClients,
  onSaveDraft,
  onGenerate,
  onGenerateAndSend,
  saving,
  onSaveToBuyer,
  previewRef,
}) {
  const [discountExpanded, setDiscountExpanded] = useState(false);

  const updateBuyer = (field, val) => setBuyer(prev => ({ ...prev, [field]: val }));

  const updateLine = (i, k, v) => {
    setLines(prev => prev.map((l, idx) => {
      if (idx !== i) return l;
      const updated = { ...l, [k]: v };
      if (!updated.directAmount && (k === 'quantity' || k === 'rate')) {
        const q = parseFloat(k === 'quantity' ? v : l.quantity) || 0;
        const r = parseFloat(k === 'rate' ? v : l.rate) || 0;
        updated.amount = q * r;
      }
      return updated;
    }));
  };

  const toggleDirectAmount = (i) => {
    setLines(prev => prev.map((l, idx) => {
      if (idx !== i) return l;
      if (!l.directAmount) {
        return { ...l, directAmount: true, quantity: '', rate: '', per: '' };
      }
      return { ...l, directAmount: false, quantity: '1', rate: '', per: 'NOS.', amount: 0 };
    }));
  };

  const addLine = () => setLines(prev => [...prev, emptyLine(prev.length + 1)]);
  const removeLine = (i) => setLines(prev => prev.filter((_, idx) => idx !== i).map((l, idx) => ({ ...l, slNo: idx + 1 })));

  const inputCls = "bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 w-full";
  const labelCls = "text-xs text-muted-foreground mb-1 block font-medium";

  const handleClientChange = (clientId) => {
    const client = allClients.find(c => c.id === clientId) || {};
    setBuyer({
      clientId,
      name: client.legalName || client.name || '',
      address: client.billingAddress || '',
      gstin: client.gstin || '',
      pan: client.pan || '',
      stateName: client.stateName || '',
      stateCode: client.stateCode || '',
    });
    setGstType(autoGstType(client.stateCode || '', settings.companyStateCode || ''));
  };

  const isMixed = gstType === 'IGST+CGST';
  const hasDiscount = discount && discount.type && discount.value > 0;

  const expandDiscount = () => {
    setDiscountExpanded(true);
    if (!discount) setDiscount({ type: 'percentage', value: 0 });
  };

  const removeDiscount = () => {
    setDiscountExpanded(false);
    setDiscount(null);
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* LEFT: Form */}
      <div className="flex-1 space-y-5 min-w-0">
        {/* Invoice Meta */}
        <div className="card-glass p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Invoice Details</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Invoice No.</label>
              <input type="number" value={invoiceNo} onChange={e => setInvoiceNo(parseInt(e.target.value) || 1)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Invoice Date</label>
              <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Delivery Note</label>
              <input value={deliveryNote} onChange={e => setDeliveryNote(e.target.value)} className={inputCls} placeholder="Optional" />
            </div>
            <div>
              <label className={labelCls}>Mode/Terms of Payment</label>
              <input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className={inputCls} placeholder="e.g. NEFT / 30 days" />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Reference No. & Date</label>
              <input value={referenceNo} onChange={e => setReferenceNo(e.target.value)} className={inputCls} placeholder="Optional" />
            </div>
          </div>
        </div>

        {/* Seller (read-only) */}
        <div className="card-glass p-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Seller (Company Settings)</h3>
          <div className="text-sm text-foreground font-semibold">{settings.companyName}</div>
          <div className="text-xs text-muted-foreground">{settings.companyAddress}</div>
          <div className="text-xs text-muted-foreground">GSTIN: {settings.companyGSTIN} · PAN: {settings.companyPAN} · State: {settings.companyStateName} ({settings.companyStateCode})</div>
        </div>

        {/* Buyer */}
        <div className="card-glass p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Buyer (Bill To)</h3>
            {onSaveToBuyer && buyer.clientId && (
              <button onClick={onSaveToBuyer} className="text-[10px] text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 px-2 py-1 rounded">
                Save to Client Profile
              </button>
            )}
          </div>
          <div>
            <label className={labelCls}>Select Client</label>
            <ClientSearchCombobox
              clients={allClients}
              value={buyer.clientId || ''}
              onSelect={handleClientChange}
              placeholder="Type to search client name..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelCls}>Legal Billing Name</label>
              <input value={buyer.name} onChange={e => updateBuyer('name', e.target.value)} className={inputCls} placeholder="Legal company name on invoice" />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Billing Address</label>
              <textarea value={buyer.address} onChange={e => updateBuyer('address', e.target.value)} rows={3} className={inputCls} placeholder="Full billing address" />
            </div>
            <div>
              <label className={labelCls}>GSTIN/UIN</label>
              <input value={buyer.gstin} onChange={e => updateBuyer('gstin', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>PAN</label>
              <input value={buyer.pan} onChange={e => updateBuyer('pan', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>State Name</label>
              <input value={buyer.stateName} onChange={e => updateBuyer('stateName', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>State Code</label>
              <input value={buyer.stateCode} onChange={e => updateBuyer('stateCode', e.target.value)} className={inputCls} placeholder="e.g. 06" maxLength={2} />
            </div>
          </div>

          {/* GST Controls */}
          <div className="space-y-2 pt-1 border-t border-border">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="gst-applicable" checked={gstApplicable} onChange={e => setGstApplicable(e.target.checked)} className="w-3.5 h-3.5" />
              <label htmlFor="gst-applicable" className="text-xs text-muted-foreground cursor-pointer">GST Applicable</label>
            </div>
            {gstApplicable && (
              <div className="space-y-2">
                <div>
                  <label className={labelCls}>GST Type</label>
                  <select value={gstType} onChange={e => setGstType(e.target.value)} className={inputCls}>
                    {GST_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                {isMixed && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>IGST Rate (%)</label>
                      <input type="number" value={igstRate} onChange={e => setIgstRate(parseFloat(e.target.value) || 0)} className={inputCls} placeholder="e.g. 18" />
                    </div>
                    <div>
                      <label className={labelCls}>CGST Rate (%)</label>
                      <input type="number" value={cgstRate} onChange={e => setCgstRate(parseFloat(e.target.value) || 0)} className={inputCls} placeholder="e.g. 9" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div className="card-glass p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Line Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {['#', 'Description', 'HSN/SAC', 'Qty', 'Rate (₹)', 'Per', 'Amount (₹)', 'GST', ''].map(h => (
                    <th key={h} className="text-left py-2 px-1 text-muted-foreground font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i} className="border-b border-border/40">
                    <td className="py-2 px-1 text-muted-foreground">{line.slNo}</td>
                    <td className="py-2 px-1">
                      <textarea value={line.description} onChange={e => updateLine(i, 'description', e.target.value)} rows={2} className="bg-input border border-border rounded px-2 py-1 text-foreground w-full focus:outline-none focus:border-primary/50 resize-none text-xs min-w-[160px]" />
                    </td>
                    <td className="py-2 px-1">
                      <input value={line.hsn} onChange={e => updateLine(i, 'hsn', e.target.value)} className="bg-input border border-border rounded px-2 py-1 text-foreground w-16 focus:outline-none text-xs" />
                    </td>
                    <td className="py-2 px-1">
                      {line.directAmount ? (
                        <span className="text-muted-foreground text-center block">—</span>
                      ) : (
                        <input type="number" value={line.quantity} onChange={e => updateLine(i, 'quantity', e.target.value)} className="bg-input border border-border rounded px-2 py-1 text-foreground w-14 focus:outline-none text-xs" placeholder="0" />
                      )}
                    </td>
                    <td className="py-2 px-1">
                      {line.directAmount ? (
                        <span className="text-muted-foreground text-center block">—</span>
                      ) : (
                        <input type="number" value={line.rate} onChange={e => updateLine(i, 'rate', e.target.value)} className="bg-input border border-border rounded px-2 py-1 text-foreground w-20 focus:outline-none text-xs" placeholder="0" />
                      )}
                    </td>
                    <td className="py-2 px-1">
                      {line.directAmount ? (
                        <span className="text-muted-foreground text-center block">—</span>
                      ) : (
                        <input value={line.per} onChange={e => updateLine(i, 'per', e.target.value)} className="bg-input border border-border rounded px-2 py-1 text-foreground w-14 focus:outline-none text-xs" />
                      )}
                    </td>
                    <td className="py-2 px-1">
                      {line.directAmount ? (
                        <input type="number" value={line.amount} onChange={e => updateLine(i, 'amount', parseFloat(e.target.value) || 0)} className="bg-input border border-border rounded px-2 py-1 text-foreground w-24 focus:outline-none focus:border-primary/50 text-xs text-right" placeholder="0" />
                      ) : (
                        <span className="text-right font-medium text-foreground block">{Math.round(parseFloat(line.amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      )}
                    </td>
                    <td className="py-2 px-1">
                      <label
                        className={cn('flex flex-col items-center gap-1 text-[9px] cursor-pointer whitespace-nowrap', gstApplicable ? (line.gstExempt ? 'text-amber-400' : 'text-muted-foreground') : 'text-muted-foreground/50')}
                        title="Tick to bill this line without GST (e.g. reimbursements)"
                      >
                        <input type="checkbox" checked={line.gstExempt || false} onChange={e => updateLine(i, 'gstExempt', e.target.checked)} disabled={!gstApplicable} className="w-3.5 h-3.5" />
                        {line.gstExempt ? 'Exempt' : 'Taxable'}
                      </label>
                    </td>
                    <td className="py-2 px-1">
                      <div className="flex flex-col gap-1.5 items-start">
                        <label className="flex items-center gap-1 text-[9px] text-muted-foreground cursor-pointer whitespace-nowrap">
                          <input type="checkbox" checked={line.directAmount || false} onChange={() => toggleDirectAmount(i)} className="w-3 h-3" />
                          Direct
                        </label>
                        {lines.length > 1 && (
                          <button onClick={() => removeLine(i)} className="text-muted-foreground hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={addLine} className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300">
            <Plus className="w-3.5 h-3.5" /> Add Line Item
          </button>
          <p className="text-[10px] text-muted-foreground">
            Untick a line in the GST column (mark it Exempt) to bill it without tax — for example a reimbursement paid on the client’s behalf. The rest of the invoice stays taxable.
          </p>
        </div>

        {/* Discount Section (collapsible, collapsed by default) */}
        <div className="card-glass p-4 space-y-3">
          {!discountExpanded ? (
            <button onClick={expandDiscount} className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300">
              <Plus className="w-3.5 h-3.5" /> Add Discount
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Discount (applied before tax)</h3>
                <button onClick={removeDiscount} className="text-xs text-muted-foreground hover:text-red-400">Remove</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Discount Type</label>
                  <select value={discount?.type || 'percentage'} onChange={e => setDiscount({ ...discount, type: e.target.value })} className={inputCls}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Discount Value</label>
                  <input type="number" value={discount?.value || 0} onChange={e => setDiscount({ ...discount, value: parseFloat(e.target.value) || 0 })} className={inputCls} placeholder="0" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => onSaveDraft()} disabled={saving} className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-border bg-secondary text-foreground hover:bg-secondary/80', saving && 'opacity-60')}>
            <Save className="w-4 h-4" /> Save Draft
          </button>
          <button onClick={() => onGenerate()} disabled={saving} className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90', saving && 'opacity-60')}>
            <Download className="w-4 h-4" /> Generate PDF
          </button>
          <button onClick={() => onGenerateAndSend()} disabled={saving} className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10', saving && 'opacity-60')}>
            <Send className="w-4 h-4" /> Generate & Mark Sent
          </button>
        </div>
      </div>

      {/* RIGHT: Live Preview */}
      <div className="xl:w-[620px] flex-shrink-0 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Live Preview</h3>
        <div ref={previewRef} className="overflow-auto max-h-[800px] rounded-xl border border-border">
          <InvoicePreview
            settings={settings}
            invoiceNo={invoiceNo}
            invoiceDate={invoiceDate}
            buyer={buyer}
            lines={lines}
            gstApplicable={gstApplicable}
            gstType={gstType}
            igstRate={igstRate}
            cgstRate={cgstRate}
            deliveryNote={deliveryNote}
            paymentTerms={paymentTerms}
            referenceNo={referenceNo}
            discount={hasDiscount ? discount : null}
          />
        </div>
      </div>
    </div>
  );
}