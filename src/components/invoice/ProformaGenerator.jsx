import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Download, Printer } from 'lucide-react';
import { format } from 'date-fns';

// Number to words (INR)
function toWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (num === 0) return 'Zero';
  function helper(n) {
    if (n === 0) return '';
    if (n < 20) return ones[n] + ' ';
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '') + ' ';
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred ' + helper(n % 100);
    if (n < 100000) return helper(Math.floor(n / 1000)) + 'Thousand ' + helper(n % 1000);
    if (n < 10000000) return helper(Math.floor(n / 100000)) + 'Lakh ' + helper(n % 100000);
    return helper(Math.floor(n / 10000000)) + 'Crore ' + helper(n % 10000000);
  }
  const [intPart, decPart] = num.toFixed(2).split('.');
  let result = helper(parseInt(intPart)).trim();
  if (decPart && parseInt(decPart) > 0) result += ' and ' + helper(parseInt(decPart)).trim() + ' Paise';
  return result;
}

const DEFAULT_SETTINGS = {
  companyName: 'SNB Future Drive Private Limited',
  companyAddress: 'Flat No-SP-1, Udyog Vihar Sukher Industrial Area, Sukher-313001, Udaipur, Rajasthan',
  companyGSTIN: '08ABMCS4446A1ZC',
  companyStateName: 'Rajasthan',
  companyStateCode: '08',
  companyEmail: 'mahaveertrading1960@gmail.com',
  companyPAN: 'ABMCS4446A',
  invoiceCounter: 10,
};

export default function ProformaGenerator({ entry, allClients, onClose, onGenerated }) {
  const client = allClients.find(c => c.id === entry.clientId) || {};
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [invoiceNo, setInvoiceNo] = useState(DEFAULT_SETTINGS.invoiceCounter);
  const [invoiceDate, setInvoiceDate] = useState(entry.dueDate || format(new Date(), 'yyyy-MM-dd'));
  const [lines, setLines] = useState([{ slNo: 1, description: entry.description || '', hsn: '998313', quantity: '', rate: entry.amount || '', per: 'NOS.', amount: entry.amount || 0 }]);
  const [buyerName, setBuyerName] = useState(client.legalName || client.name || '');
  const [buyerAddress, setBuyerAddress] = useState(client.billingAddress || '');
  const [buyerGSTIN, setBuyerGSTIN] = useState(client.gstin || '');
  const [buyerPAN, setBuyerPAN] = useState(client.pan || '');
  const [buyerStateName, setBuyerStateName] = useState(client.stateName || '');
  const [buyerStateCode, setBuyerStateCode] = useState(client.stateCode || '');
  const [generating, setGenerating] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    base44.entities.InvoiceSettings.list().then(recs => {
      const map = {};
      recs.forEach(r => { map[r.key] = r.value; });
      const merged = { ...DEFAULT_SETTINGS };
      Object.keys(DEFAULT_SETTINGS).forEach(k => { if (map[k] !== undefined) merged[k] = k === 'invoiceCounter' ? parseInt(map[k]) : map[k]; });
      setSettings(merged);
      setInvoiceNo(merged.invoiceCounter);
      setLoadingSettings(false);
    });
  }, []);

  const taxableTotal = lines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
  const isIGST = buyerStateCode !== settings.companyStateCode;
  const gstApplicable = entry.gstApplicable !== false;
  const igstAmount = gstApplicable && isIGST ? taxableTotal * 0.18 : 0;
  const cgstAmount = gstApplicable && !isIGST ? taxableTotal * 0.09 : 0;
  const sgstAmount = gstApplicable && !isIGST ? taxableTotal * 0.09 : 0;
  const totalTax = igstAmount + cgstAmount + sgstAmount;
  const grandTotal = taxableTotal + totalTax;

  const updateLine = (i, k, v) => {
    setLines(prev => prev.map((l, idx) => {
      if (idx !== i) return l;
      const updated = { ...l, [k]: v };
      if (k === 'quantity' || k === 'rate') {
        const q = parseFloat(k === 'quantity' ? v : l.quantity) || 0;
        const r = parseFloat(k === 'rate' ? v : l.rate) || 0;
        updated.amount = q * r;
      }
      return updated;
    }));
  };

  const handlePrint = () => window.print();

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Increment counter in settings
      const newCounter = invoiceNo + 1;
      const existing = await base44.entities.InvoiceSettings.filter({ key: 'invoiceCounter' });
      if (existing.length > 0) {
        await base44.entities.InvoiceSettings.update(existing[0].id, { value: String(newCounter) });
      } else {
        await base44.entities.InvoiceSettings.create({ key: 'invoiceCounter', value: String(newCounter) });
      }
      // Mark entry as Generated
      await base44.entities.InvoiceEntry.update(entry.id, { status: 'Generated', invoiceNumber: invoiceNo, generatedAt: new Date().toISOString() });
      onGenerated && onGenerated();
      handlePrint();
    } catch (e) {
      console.error(e);
    }
    setGenerating(false);
  };

  if (loadingSettings) return null;

  return (
    <>
      <style>{`
        @media print {
          body > *:not(#proforma-print-root) { display: none !important; }
          #proforma-print-root { display: block !important; position: static !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          @page { margin: 10mm; size: A4; }
        }
        .print-only { display: none; }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-auto">
        <div className="absolute inset-0 bg-black/80" onClick={onClose} />
        <div className="relative bg-white text-gray-900 w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden animate-fade-in" id="proforma-print-root" ref={printRef}>
          {/* Toolbar */}
          <div className="no-print flex items-center justify-between px-6 py-3 bg-gray-100 border-b border-gray-200">
            <h2 className="font-bold text-gray-800">Generate Proforma Invoice</h2>
            <div className="flex items-center gap-2">
              <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
                <Download className="w-4 h-4" /> {generating ? 'Saving...' : 'Generate & Print'}
              </button>
              <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Invoice Body */}
          <div className="p-6 text-[11px] font-sans" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px' }}>
            <table className="w-full border-collapse border border-gray-600">
              {/* Header Row */}
              <tbody>
                <tr>
                  <td className="border border-gray-600 p-3 w-1/2 align-top">
                    <div className="font-bold text-sm">{settings.companyName}</div>
                    <div className="mt-0.5">{settings.companyAddress}</div>
                    {settings.companyPAN && <div className="mt-0.5">{settings.companyPAN}</div>}
                    <div className="font-bold mt-1">GSTIN/UIN: {settings.companyGSTIN}</div>
                    <div>State Name : {settings.companyStateName}, Code : {settings.companyStateCode}</div>
                    <div>E-Mail : {settings.companyEmail}</div>
                  </td>
                  <td className="border border-gray-600 p-3 w-1/2 align-top">
                    <div className="text-center font-bold text-base mb-2">Proforma Invoice</div>
                    <table className="w-full text-[10px] border-collapse">
                      <tbody>
                        <tr>
                          <td className="border border-gray-400 p-1 font-semibold bg-gray-50">Invoice No.</td>
                          <td className="border border-gray-400 p-1">
                            <input value={invoiceNo} onChange={e => setInvoiceNo(parseInt(e.target.value) || 1)} className="w-full bg-transparent outline-none no-print-border" />
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 p-1 font-semibold bg-gray-50">Dated</td>
                          <td className="border border-gray-400 p-1">
                            <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full bg-transparent outline-none no-print-border" />
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 p-1 font-semibold bg-gray-50">Delivery Note</td>
                          <td className="border border-gray-400 p-1">&nbsp;</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 p-1 font-semibold bg-gray-50">Mode/Terms of Payment</td>
                          <td className="border border-gray-400 p-1">&nbsp;</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 p-1 font-semibold bg-gray-50">Reference No. &amp; Date.</td>
                          <td className="border border-gray-400 p-1">&nbsp;</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 p-1 font-semibold bg-gray-50">Other References</td>
                          <td className="border border-gray-400 p-1">&nbsp;</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
                {/* Buyer Row */}
                <tr>
                  <td className="border border-gray-600 p-3 align-top">
                    <div className="text-[10px] font-semibold mb-1">Buyer (Bill to)</div>
                    <input value={buyerName} onChange={e => setBuyerName(e.target.value)} className="w-full font-bold bg-transparent outline-none border-b border-gray-300 mb-1 no-print" placeholder="Buyer legal name" />
                    <textarea value={buyerAddress} onChange={e => setBuyerAddress(e.target.value)} rows={2} className="w-full bg-transparent outline-none border-b border-gray-300 mb-1 resize-none no-print text-[10px]" placeholder="Address" />
                    <div className="flex gap-1 flex-wrap">
                      <span className="font-semibold">GSTIN/UIN:</span>
                      <input value={buyerGSTIN} onChange={e => setBuyerGSTIN(e.target.value)} className="bg-transparent outline-none border-b border-gray-300 w-32 no-print" placeholder="GSTIN" />
                    </div>
                    <div className="flex gap-1">
                      <span className="font-semibold">PAN:</span>
                      <input value={buyerPAN} onChange={e => setBuyerPAN(e.target.value)} className="bg-transparent outline-none border-b border-gray-300 w-28 no-print" placeholder="PAN" />
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      <span className="font-semibold">State Name :</span>
                      <input value={buyerStateName} onChange={e => setBuyerStateName(e.target.value)} className="bg-transparent outline-none border-b border-gray-300 w-28 no-print" placeholder="State" />
                      <span className="font-semibold">, Code :</span>
                      <input value={buyerStateCode} onChange={e => setBuyerStateCode(e.target.value)} className="bg-transparent outline-none border-b border-gray-300 w-10 no-print" placeholder="00" />
                    </div>
                  </td>
                  <td className="border border-gray-600 p-3 align-top">
                    <table className="w-full text-[10px] border-collapse">
                      <tbody>
                        {['Dispatch Doc No.', 'Delivery Note Date', 'Dispatched through', 'Destination', 'Terms of Delivery', "Buyer's Order No.", 'Dated'].map(label => (
                          <tr key={label}>
                            <td className="border border-gray-400 p-1 font-semibold bg-gray-50">{label}</td>
                            <td className="border border-gray-400 p-1">&nbsp;</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>

                {/* Line Items */}
                <tr>
                  <td colSpan={2} className="border border-gray-600 p-0">
                    <table className="w-full text-[10px] border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          {['Sl No.', 'Description of Services', 'HSN/SAC', 'Quantity', 'Rate', 'per', 'Amount'].map(h => (
                            <th key={h} className="border border-gray-400 p-1.5 text-center font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {lines.map((line, i) => (
                          <tr key={i}>
                            <td className="border border-gray-400 p-1 text-center">{line.slNo}</td>
                            <td className="border border-gray-400 p-1">
                              <textarea value={line.description} onChange={e => updateLine(i, 'description', e.target.value)} rows={2} className="w-full bg-transparent outline-none resize-none no-print min-w-[140px]" />
                            </td>
                            <td className="border border-gray-400 p-1 text-center">
                              <input value={line.hsn} onChange={e => updateLine(i, 'hsn', e.target.value)} className="w-full bg-transparent outline-none text-center no-print w-14" />
                            </td>
                            <td className="border border-gray-400 p-1 text-center">
                              <input value={line.quantity} onChange={e => updateLine(i, 'quantity', e.target.value)} className="w-full bg-transparent outline-none text-center no-print w-14" placeholder="0" />
                            </td>
                            <td className="border border-gray-400 p-1 text-right">
                              <input value={line.rate} onChange={e => updateLine(i, 'rate', e.target.value)} className="w-full bg-transparent outline-none text-right no-print w-16" placeholder="0" />
                            </td>
                            <td className="border border-gray-400 p-1 text-center">
                              <input value={line.per} onChange={e => updateLine(i, 'per', e.target.value)} className="w-12 bg-transparent outline-none text-center no-print" />
                            </td>
                            <td className="border border-gray-400 p-1 text-right font-medium">{(parseFloat(line.amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                        {/* Subtotal */}
                        <tr>
                          <td colSpan={6} className="border border-gray-400 p-1 text-right font-medium"></td>
                          <td className="border border-gray-400 p-1 text-right font-medium">{taxableTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                        {gstApplicable && isIGST && (
                          <tr>
                            <td colSpan={6} className="border border-gray-400 p-1 text-right font-semibold">OUT PUT IGST 18%</td>
                            <td className="border border-gray-400 p-1 text-right">{igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        )}
                        {gstApplicable && !isIGST && (
                          <>
                            <tr>
                              <td colSpan={6} className="border border-gray-400 p-1 text-right font-semibold">CGST 9%</td>
                              <td className="border border-gray-400 p-1 text-right">{cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                              <td colSpan={6} className="border border-gray-400 p-1 text-right font-semibold">SGST 9%</td>
                              <td className="border border-gray-400 p-1 text-right">{sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          </>
                        )}
                        {/* Total Row */}
                        <tr>
                          <td colSpan={3} className="border border-gray-400 p-1 text-center font-semibold">Total</td>
                          <td className="border border-gray-400 p-1 text-center">{lines.reduce((s, l) => s + (parseFloat(l.quantity) || 0), 0).toLocaleString('en-IN')}</td>
                          <td colSpan={2} className="border border-gray-400 p-1"></td>
                          <td className="border border-gray-400 p-1 text-right font-bold">₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>

                {/* Amount in Words */}
                <tr>
                  <td colSpan={2} className="border border-gray-600 p-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold">Amount Chargeable (in words)</span>
                        <div className="font-bold mt-0.5">INR {toWords(grandTotal)} Only</div>
                      </div>
                      <div className="text-right text-[10px]">E. &amp; O.E</div>
                    </div>
                  </td>
                </tr>

                {/* Tax Summary */}
                <tr>
                  <td colSpan={2} className="border border-gray-600 p-0">
                    <table className="w-full text-[10px] border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-400 p-1.5 font-semibold">HSN/SAC</th>
                          <th className="border border-gray-400 p-1.5 font-semibold">Taxable Value</th>
                          {isIGST ? (
                            <>
                              <th className="border border-gray-400 p-1.5 font-semibold">Integrated Tax Rate</th>
                              <th className="border border-gray-400 p-1.5 font-semibold">Integrated Tax Amount</th>
                              <th className="border border-gray-400 p-1.5 font-semibold">Central Tax Rate</th>
                              <th className="border border-gray-400 p-1.5 font-semibold">Central Tax Amount</th>
                            </>
                          ) : (
                            <>
                              <th className="border border-gray-400 p-1.5 font-semibold">CGST Rate</th>
                              <th className="border border-gray-400 p-1.5 font-semibold">CGST Amount</th>
                              <th className="border border-gray-400 p-1.5 font-semibold">SGST Rate</th>
                              <th className="border border-gray-400 p-1.5 font-semibold">SGST Amount</th>
                            </>
                          )}
                          <th className="border border-gray-400 p-1.5 font-semibold">Total Tax Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-400 p-1 text-center">{lines[0]?.hsn || '998313'}</td>
                          <td className="border border-gray-400 p-1 text-right">{taxableTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          {isIGST ? (
                            <>
                              <td className="border border-gray-400 p-1 text-center">18%</td>
                              <td className="border border-gray-400 p-1 text-right">{igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="border border-gray-400 p-1 text-center"></td>
                              <td className="border border-gray-400 p-1 text-right">0.00</td>
                            </>
                          ) : (
                            <>
                              <td className="border border-gray-400 p-1 text-center">9%</td>
                              <td className="border border-gray-400 p-1 text-right">{cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="border border-gray-400 p-1 text-center">9%</td>
                              <td className="border border-gray-400 p-1 text-right">{sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </>
                          )}
                          <td className="border border-gray-400 p-1 text-right">{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr className="font-bold bg-gray-50">
                          <td className="border border-gray-400 p-1">Total</td>
                          <td className="border border-gray-400 p-1 text-right">{taxableTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          {isIGST ? (
                            <>
                              <td className="border border-gray-400 p-1"></td>
                              <td className="border border-gray-400 p-1 text-right">{igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="border border-gray-400 p-1"></td>
                              <td className="border border-gray-400 p-1 text-right">0.00</td>
                            </>
                          ) : (
                            <>
                              <td className="border border-gray-400 p-1"></td>
                              <td className="border border-gray-400 p-1 text-right">{cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="border border-gray-400 p-1"></td>
                              <td className="border border-gray-400 p-1 text-right">{sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </>
                          )}
                          <td className="border border-gray-400 p-1 text-right">{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td colSpan={2} className="border border-gray-600 p-2">
                    <div className="flex justify-between">
                      <div className="w-1/2">
                        <div className="font-semibold mb-1">Tax Amount (in words) : <span className="font-normal">INR {toWords(totalTax)} Only.</span></div>
                        <div className="text-[10px] mt-1">TDS to be deducted at 2% under Section 194J.</div>
                        <div className="mt-2 font-semibold text-[10px]">for {settings.companyName}</div>
                        <div className="mt-3 pt-3 border-t border-gray-300 text-[10px] text-gray-500">Authorised Signatory</div>
                      </div>
                      <div className="w-1/2 pl-4">
                        <div className="font-semibold mb-1">Declaration</div>
                        <div className="text-[10px] text-gray-600">We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</div>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colSpan={2} className="border border-gray-600 p-2 text-center text-[10px] text-gray-500 italic">
                    This is a Computer Generated Proforma Invoice
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}