import { calcTax, toWords } from '@/lib/invoiceUtils';

export default function InvoicePreview({ settings, invoiceNo, invoiceDate, buyer, lines, gstApplicable, gstType, igstRate, cgstRate, deliveryNote, paymentTerms, referenceNo, discount }) {
  const tax = calcTax(lines, gstApplicable, buyer.stateCode, settings.companyStateCode, gstType, igstRate, cgstRate, discount);
  const { subtotal, discountAmount, taxableTotal, exemptAmount, taxableBase, isIGST, isCGST, isMixed, isExempt, igstAmount, cgstAmount, sgstAmount, totalTax, grandTotal, roundOff } = tax;
  const hasExempt = exemptAmount > 0;
  const firstExemptHsn = lines.find(l => l.gstExempt)?.hsn || '';
  const firstTaxableHsn = lines.find(l => !l.gstExempt)?.hsn || lines[0]?.hsn || '998313';

  const fmt = (n) => Math.round(n || 0).toLocaleString('en-IN');

  const hasDiscount = discountAmount > 0;

  return (
    <div className="bg-white text-gray-900 text-[10px] font-sans p-4 rounded border border-gray-300" style={{ fontFamily: 'Arial, sans-serif', minWidth: 600 }}>
      <table className="w-full border-collapse border border-gray-600">
        <tbody>
          <tr>
            <td className="border border-gray-600 p-2 w-1/2 align-top">
              <div className="font-bold text-[11px]">{settings.companyName}</div>
              <div className="mt-0.5">{settings.companyAddress}</div>
              {settings.companyPAN && <div className="mt-0.5">PAN: {settings.companyPAN}</div>}
              <div className="font-bold mt-1">GSTIN/UIN: {settings.companyGSTIN}</div>
              <div>State Name: {settings.companyStateName}, Code: {settings.companyStateCode}</div>
              <div>E-Mail: {settings.companyEmail}</div>
            </td>
            <td className="border border-gray-600 p-2 w-1/2 align-top">
              <div className="text-center font-bold text-[13px] mb-1">Proforma Invoice</div>
              <table className="w-full border-collapse text-[9px]">
                <tbody>
                  {[
                    ['Invoice No.', invoiceNo],
                    ['Dated', invoiceDate],
                    ['Delivery Note', deliveryNote || ''],
                    ['Mode/Terms of Payment', paymentTerms || ''],
                    ['Reference No. & Date.', referenceNo || ''],
                    ['Other References', ''],
                  ].map(([label, val]) => (
                    <tr key={label}>
                      <td className="border border-gray-400 p-1 bg-gray-50 font-semibold whitespace-nowrap">{label}</td>
                      <td className="border border-gray-400 p-1">{val}&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td className="border border-gray-600 p-2 align-top">
              <div className="font-semibold mb-1">Buyer (Bill to)</div>
              <div className="font-bold">{buyer.name || '—'}</div>
              <div className="whitespace-pre-wrap">{buyer.address}</div>
              <div><span className="font-semibold">GSTIN/UIN:</span> {buyer.gstin}</div>
              <div><span className="font-semibold">PAN:</span> {buyer.pan}</div>
              <div><span className="font-semibold">State Name:</span> {buyer.stateName}, Code: {buyer.stateCode}</div>
            </td>
            <td className="border border-gray-600 p-2 align-top">
              <table className="w-full border-collapse text-[9px]">
                <tbody>
                  {['Dispatch Doc No.', 'Delivery Note Date', 'Dispatched through', 'Destination', 'Terms of Delivery', "Buyer's Order No.", 'Dated'].map(label => (
                    <tr key={label}><td className="border border-gray-400 p-1 bg-gray-50 font-semibold">{label}</td><td className="border border-gray-400 p-1">&nbsp;</td></tr>
                  ))}
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td colSpan={2} className="border border-gray-600 p-0">
              <table className="w-full border-collapse text-[9px]">
                <thead>
                  <tr className="bg-gray-50">
                    {['Sl No.', 'Description of Services', 'HSN/SAC', 'Quantity', 'Rate', 'per', 'Amount'].map(h => (
                      <th key={h} className="border border-gray-400 p-1 text-center font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, i) => (
                    <tr key={i}>
                      <td className="border border-gray-400 p-1 text-center">{line.slNo}</td>
                      <td className="border border-gray-400 p-1">
                        {line.description}
                        {line.gstExempt && gstApplicable && <div className="text-[8px] text-gray-500">GST exempt</div>}
                      </td>
                      <td className="border border-gray-400 p-1 text-center">{line.hsn}</td>
                      <td className="border border-gray-400 p-1 text-center">{line.directAmount ? '—' : line.quantity}</td>
                      <td className="border border-gray-400 p-1 text-right">{line.directAmount ? '—' : line.rate}</td>
                      <td className="border border-gray-400 p-1 text-center">{line.directAmount ? '—' : line.per}</td>
                      <td className="border border-gray-400 p-1 text-right">{fmt(line.amount)}</td>
                    </tr>
                  ))}
                  {/* Subtotal / Discount / Taxable Value rows */}
                  {hasDiscount ? (
                    <>
                      <tr>
                        <td colSpan={6} className="border border-gray-400 p-1 text-right font-medium">Sub Total</td>
                        <td className="border border-gray-400 p-1 text-right font-medium">{fmt(subtotal)}</td>
                      </tr>
                      <tr>
                        <td colSpan={6} className="border border-gray-400 p-1 text-right font-medium">Discount{discount?.type === 'percentage' ? ` (${discount.value}%)` : ''}</td>
                        <td className="border border-gray-400 p-1 text-right font-medium text-red-600">- {fmt(discountAmount)}</td>
                      </tr>
                      <tr>
                        <td colSpan={6} className="border border-gray-400 p-1 text-right font-medium">Taxable Value</td>
                        <td className="border border-gray-400 p-1 text-right font-medium">{fmt(taxableTotal)}</td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td colSpan={6} className="border border-gray-400 p-1 text-right font-medium"></td>
                      <td className="border border-gray-400 p-1 text-right font-medium">{fmt(taxableTotal)}</td>
                    </tr>
                  )}
                  {gstApplicable && isIGST && (
                    <tr><td colSpan={6} className="border border-gray-400 p-1 text-right font-semibold">OUT PUT IGST 18%</td><td className="border border-gray-400 p-1 text-right">{fmt(igstAmount)}</td></tr>
                  )}
                  {gstApplicable && isCGST && (<>
                    <tr><td colSpan={6} className="border border-gray-400 p-1 text-right font-semibold">CGST 9%</td><td className="border border-gray-400 p-1 text-right">{fmt(cgstAmount)}</td></tr>
                    <tr><td colSpan={6} className="border border-gray-400 p-1 text-right font-semibold">SGST 9%</td><td className="border border-gray-400 p-1 text-right">{fmt(sgstAmount)}</td></tr>
                  </>)}
                  {gstApplicable && isMixed && (<>
                    <tr><td colSpan={6} className="border border-gray-400 p-1 text-right font-semibold">IGST {igstRate}%</td><td className="border border-gray-400 p-1 text-right">{fmt(igstAmount)}</td></tr>
                    <tr><td colSpan={6} className="border border-gray-400 p-1 text-right font-semibold">CGST {cgstRate}%</td><td className="border border-gray-400 p-1 text-right">{fmt(cgstAmount)}</td></tr>
                  </>)}
                  {roundOff !== 0 && (
                    <tr>
                      <td colSpan={6} className="border border-gray-400 p-1 text-right text-gray-500">Round Off</td>
                      <td className="border border-gray-400 p-1 text-right text-gray-500">{roundOff > 0 ? '+' : ''}{roundOff}</td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={3} className="border border-gray-400 p-1 text-center font-semibold">Total</td>
                    <td className="border border-gray-400 p-1 text-center">{lines.reduce((s, l) => s + (parseFloat(l.quantity) || 0), 0)}</td>
                    <td colSpan={2} className="border border-gray-400 p-1"></td>
                    <td className="border border-gray-400 p-1 text-right font-bold">₹ {fmt(grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td colSpan={2} className="border border-gray-600 p-2">
              <div className="flex justify-between">
                <div><span className="font-semibold">Amount Chargeable (in words)</span><div className="font-bold mt-0.5">INR {toWords(grandTotal)} Only</div></div>
                <div className="text-right text-[9px]">E. &amp; O.E</div>
              </div>
            </td>
          </tr>
          <tr>
            <td colSpan={2} className="border border-gray-600 p-0">
              <table className="w-full border-collapse text-[9px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-400 p-1 font-semibold">HSN/SAC</th>
                    <th className="border border-gray-400 p-1 font-semibold">Taxable Value</th>
                    {isIGST && <><th className="border border-gray-400 p-1 font-semibold">IGST Rate</th><th className="border border-gray-400 p-1 font-semibold">IGST Amount</th></>}
                    {isCGST && <><th className="border border-gray-400 p-1 font-semibold">CGST Rate</th><th className="border border-gray-400 p-1 font-semibold">CGST Amount</th><th className="border border-gray-400 p-1 font-semibold">SGST Rate</th><th className="border border-gray-400 p-1 font-semibold">SGST Amount</th></>}
                    {isMixed && <><th className="border border-gray-400 p-1 font-semibold">IGST Rate</th><th className="border border-gray-400 p-1 font-semibold">IGST Amount</th><th className="border border-gray-400 p-1 font-semibold">CGST Rate</th><th className="border border-gray-400 p-1 font-semibold">CGST Amount</th></>}
                    <th className="border border-gray-400 p-1 font-semibold">Total Tax</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-400 p-1 text-center">{hasExempt ? firstTaxableHsn : (lines[0]?.hsn || '998313')}</td>
                    <td className="border border-gray-400 p-1 text-right">{fmt(hasExempt ? taxableBase : taxableTotal)}</td>
                    {isIGST && <><td className="border border-gray-400 p-1 text-center">18%</td><td className="border border-gray-400 p-1 text-right">{fmt(igstAmount)}</td></>}
                    {isCGST && <><td className="border border-gray-400 p-1 text-center">9%</td><td className="border border-gray-400 p-1 text-right">{fmt(cgstAmount)}</td><td className="border border-gray-400 p-1 text-center">9%</td><td className="border border-gray-400 p-1 text-right">{fmt(sgstAmount)}</td></>}
                    {isMixed && <><td className="border border-gray-400 p-1 text-center">{igstRate}%</td><td className="border border-gray-400 p-1 text-right">{fmt(igstAmount)}</td><td className="border border-gray-400 p-1 text-center">{cgstRate}%</td><td className="border border-gray-400 p-1 text-right">{fmt(cgstAmount)}</td></>}
                    {isExempt && <><td className="border border-gray-400 p-1 text-center">—</td><td className="border border-gray-400 p-1 text-right">0</td></>}
                    <td className="border border-gray-400 p-1 text-right">{fmt(totalTax)}</td>
                  </tr>
                  {hasExempt && (
                    <tr>
                      <td className="border border-gray-400 p-1 text-center">{firstExemptHsn}</td>
                      <td className="border border-gray-400 p-1 text-right">{fmt(exemptAmount)}</td>
                      {isIGST && <><td className="border border-gray-400 p-1 text-center">Nil</td><td className="border border-gray-400 p-1 text-right">0</td></>}
                      {isCGST && <><td className="border border-gray-400 p-1 text-center">Nil</td><td className="border border-gray-400 p-1 text-right">0</td><td className="border border-gray-400 p-1 text-center">Nil</td><td className="border border-gray-400 p-1 text-right">0</td></>}
                      {isMixed && <><td className="border border-gray-400 p-1 text-center">Nil</td><td className="border border-gray-400 p-1 text-right">0</td><td className="border border-gray-400 p-1 text-center">Nil</td><td className="border border-gray-400 p-1 text-right">0</td></>}
                      {isExempt && <><td className="border border-gray-400 p-1 text-center">Nil</td><td className="border border-gray-400 p-1 text-right">0</td></>}
                      <td className="border border-gray-400 p-1 text-right">0</td>
                    </tr>
                  )}
                  <tr className="font-bold bg-gray-50">
                    <td className="border border-gray-400 p-1">Total</td>
                    <td className="border border-gray-400 p-1 text-right">{fmt(taxableTotal)}</td>
                    {isIGST && <><td className="border border-gray-400 p-1"></td><td className="border border-gray-400 p-1 text-right">{fmt(igstAmount)}</td></>}
                    {isCGST && <><td className="border border-gray-400 p-1"></td><td className="border border-gray-400 p-1 text-right">{fmt(cgstAmount)}</td><td className="border border-gray-400 p-1"></td><td className="border border-gray-400 p-1 text-right">{fmt(sgstAmount)}</td></>}
                    {isMixed && <><td className="border border-gray-400 p-1"></td><td className="border border-gray-400 p-1 text-right">{fmt(igstAmount)}</td><td className="border border-gray-400 p-1"></td><td className="border border-gray-400 p-1 text-right">{fmt(cgstAmount)}</td></>}
                    {isExempt && <><td className="border border-gray-400 p-1"></td><td className="border border-gray-400 p-1 text-right">0</td></>}
                    <td className="border border-gray-400 p-1 text-right">{fmt(totalTax)}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td colSpan={2} className="border border-gray-600 p-2">
              <div className="flex justify-between">
                <div className="w-1/2">
                  <div className="font-semibold">Tax Amount (in words): <span className="font-normal">INR {toWords(totalTax)} Only.</span></div>
                  <div className="mt-1">TDS to be deducted at 2% under Section 194J.</div>
                  <div className="mt-2 font-semibold">for {settings.companyName}</div>
                  <div className="mt-4 pt-2 border-t border-gray-300 text-gray-500">Authorised Signatory</div>
                </div>
                <div className="w-1/2 pl-4">
                  <div className="font-semibold mb-1">Declaration</div>
                  <div className="text-gray-600">We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</div>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td colSpan={2} className="border border-gray-600 p-2 text-center text-gray-500 italic">This is a Computer Generated Proforma Invoice</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}