// Shared invoice utility: number to Indian words
export function toWords(num) {
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
  const rounded = Math.round(num);
  return helper(rounded).trim();
}

export const DEFAULT_SETTINGS = {
  companyName: 'SNB Future Drive Private Limited',
  companyAddress: 'Flat No-SP-1, Udyog Vihar Sukher Industrial Area, Sukher-313001, Udaipur, Rajasthan',
  companyGSTIN: '08ABMCS4446A1ZC',
  companyStateName: 'Rajasthan',
  companyStateCode: '08',
  companyEmail: 'mahaveertrading1960@gmail.com',
  companyPAN: 'ABMCS4446A',
  invoiceCounter: 10,
};

export async function loadSettings(base44) {
  const recs = await base44.entities.InvoiceSettings.list();
  const map = {};
  recs.forEach(r => { map[r.key] = r.value; });
  const merged = { ...DEFAULT_SETTINGS };
  Object.keys(DEFAULT_SETTINGS).forEach(k => {
    if (map[k] !== undefined) merged[k] = k === 'invoiceCounter' ? parseInt(map[k]) : map[k];
  });
  return merged;
}

export async function saveSettings(base44, updates) {
  for (const [key, value] of Object.entries(updates)) {
    const existing = await base44.entities.InvoiceSettings.filter({ key });
    if (existing.length > 0) {
      await base44.entities.InvoiceSettings.update(existing[0].id, { value: String(value) });
    } else {
      await base44.entities.InvoiceSettings.create({ key, value: String(value) });
    }
  }
}

export async function getNextInvoiceNumber(base44) {
  const settings = await loadSettings(base44);
  return settings.invoiceCounter;
}

export async function incrementInvoiceCounter(base44, currentNo) {
  await saveSettings(base44, { invoiceCounter: currentNo + 1 });
}

// discount: { type: 'percentage' | 'fixed', value: number } | null
// gstType: 'IGST' | 'CGST+SGST' | 'IGST+CGST' | 'EXEMPT'
// igstRate / cgstRate: used only for IGST+CGST mode
export function calcTax(lines, gstApplicable, buyerStateCode, companyStateCode, gstType, igstRate = 18, cgstRate = 9, discount = null) {
  const rawSubtotal = lines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
  const subtotal = Math.round(rawSubtotal);

  // Lines flagged gstExempt (e.g. reimbursements) sit outside the GST tax base
  const rawExempt = lines.reduce((s, l) => s + (l.gstExempt ? (parseFloat(l.amount) || 0) : 0), 0);

  // Compute discount on subtotal (before tax)
  let discountAmount = 0;
  if (discount && discount.type && discount.value > 0) {
    if (discount.type === 'percentage') {
      discountAmount = Math.round(subtotal * (discount.value / 100));
    } else {
      discountAmount = Math.round(discount.value);
    }
    // Don't let discount exceed subtotal
    if (discountAmount > subtotal) discountAmount = subtotal;
  }

  const taxableTotal = subtotal - discountAmount;
  const rawTaxable = rawSubtotal - discountAmount;

  // Split the value into the GST-taxable part and the exempt part
  const exemptAmount = Math.min(Math.round(rawExempt), taxableTotal);
  const taxableBase = taxableTotal - exemptAmount;
  const rawBase = Math.max(0, rawTaxable - rawExempt);

  // Determine effective gstType
  const autoIGST = String(buyerStateCode).trim() !== String(companyStateCode).trim();
  const effectiveType = gstType || (autoIGST ? 'IGST' : 'CGST+SGST');

  let igstAmount = 0, cgstAmount = 0, sgstAmount = 0;
  const isIGST = effectiveType === 'IGST';
  const isCGST = effectiveType === 'CGST+SGST';
  const isMixed = effectiveType === 'IGST+CGST';
  const isExempt = effectiveType === 'EXEMPT';

  if (gstApplicable && !isExempt) {
    if (isIGST) {
      igstAmount = Math.round(taxableBase * 0.18);
    } else if (isCGST) {
      cgstAmount = Math.round(taxableBase * 0.09);
      sgstAmount = Math.round(taxableBase * 0.09);
    } else if (isMixed) {
      igstAmount = Math.round(taxableBase * (igstRate / 100));
      cgstAmount = Math.round(taxableBase * (cgstRate / 100));
    }
  }

  const totalTax = igstAmount + cgstAmount + sgstAmount;
  const grandTotal = taxableTotal + totalTax;

  // Round off = difference between rounded grand total and raw (unrounded) grand total
  const rawTaxAmount = gstApplicable && !isExempt ? (
    isIGST ? rawBase * 0.18 :
    isCGST ? rawBase * 0.18 :
    isMixed ? rawBase * ((igstRate + cgstRate) / 100) : 0
  ) : 0;
  const rawGrandTotal = rawTaxable + rawTaxAmount;
  const roundOff = grandTotal - Math.round(rawGrandTotal);

  return { subtotal, discountAmount, taxableTotal, exemptAmount, taxableBase, isIGST, isCGST, isMixed, isExempt, effectiveType, igstAmount, cgstAmount, sgstAmount, totalTax, grandTotal, roundOff, igstRate, cgstRate };
}

// Derive default gstType from state codes
export function autoGstType(buyerStateCode, companyStateCode) {
  return String(buyerStateCode).trim() !== String(companyStateCode).trim() ? 'IGST' : 'CGST+SGST';
}

export function emptyLine(slNo = 1) {
  return { slNo, description: '', hsn: '998313', quantity: '', rate: '', per: 'NOS.', amount: 0, directAmount: false, gstExempt: false };
}