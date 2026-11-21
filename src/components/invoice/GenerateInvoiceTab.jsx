import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { loadSettings, incrementInvoiceCounter, calcTax, emptyLine, autoGstType } from '@/lib/invoiceUtils';
import { printInvoiceHtml } from '@/lib/printInvoice';
import InvoiceFormPreview from '@/components/invoice/InvoiceFormPreview';

// Build the seller object from settings
function sellerFromSettings(settings) {
  return {
    companyName: settings.companyName,
    companyAddress: settings.companyAddress,
    companyGSTIN: settings.companyGSTIN,
    companyPAN: settings.companyPAN,
    companyStateName: settings.companyStateName,
    companyStateCode: settings.companyStateCode,
    companyEmail: settings.companyEmail,
  };
}

export default function GenerateInvoiceTab({ allClients, prefillEntry, onClearPrefill, onSaved }) {
  const [settings, setSettings] = useState(null);
  const [invoiceNo, setInvoiceNo] = useState(1);
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [buyer, setBuyer] = useState({ clientId: '', name: '', address: '', gstin: '', pan: '', stateName: '', stateCode: '' });
  const [lines, setLines] = useState([emptyLine(1)]);
  const [gstApplicable, setGstApplicable] = useState(true);
  const [gstType, setGstType] = useState('IGST');
  const [igstRate, setIgstRate] = useState(18);
  const [cgstRate, setCgstRate] = useState(9);
  const [deliveryNote, setDeliveryNote] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [discount, setDiscount] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false); // editing existing register entry

  const previewRef = useRef(null);

  useEffect(() => {
    loadSettings(base44).then(s => {
      setSettings(s);
      setInvoiceNo(s.invoiceCounter);
    });
  }, []);

  // Apply prefill: from Invoice Calendar (new invoice) OR from Register (edit existing)
  useEffect(() => {
    if (!prefillEntry || !settings) return;

    // If it's a full ProformaInvoice record (has sellerName stored), load it for editing
    if (prefillEntry._editMode) {
      const inv = prefillEntry;
      setInvoiceNo(inv.invoiceNumber || 1);
      setInvoiceDate(inv.invoiceDate || format(new Date(), 'yyyy-MM-dd'));
      setBuyer({
        clientId: inv.clientId || '',
        name: inv.buyerName || '',
        address: inv.buyerAddress || '',
        gstin: inv.buyerGSTIN || '',
        pan: inv.buyerPAN || '',
        stateName: inv.buyerStateName || '',
        stateCode: inv.buyerStateCode || '',
      });
      setLines(inv.lineItems && inv.lineItems.length > 0 ? inv.lineItems : [emptyLine(1)]);
      setGstApplicable(inv.gstApplicable !== false);
      setGstType(inv.gstType || inv.taxType || 'CGST+SGST');
      setIgstRate(inv.igstRate || 18);
      setCgstRate(inv.cgstRate || 9);
      setDeliveryNote(inv.deliveryNote || '');
      setPaymentTerms(inv.paymentTerms || '');
      setReferenceNo(inv.referenceNo || '');
      setDiscount(inv.discountType ? { type: inv.discountType, value: inv.discountValue || 0 } : null);
      setEditingRecordId(inv.id);
      setIsEditMode(true);
      onClearPrefill && onClearPrefill();
      return;
    }

    // From Invoice Calendar — create new invoice
    const client = allClients.find(c => c.id === prefillEntry.clientId) || {};
    setBuyer({
      clientId: client.id || '',
      name: client.legalName || client.name || '',
      address: client.billingAddress || '',
      gstin: client.gstin || '',
      pan: client.pan || '',
      stateName: client.stateName || '',
      stateCode: client.stateCode || '',
    });
    setGstType(autoGstType(client.stateCode || '', settings?.companyStateCode || ''));
    setInvoiceDate(prefillEntry.dueDate || format(new Date(), 'yyyy-MM-dd'));
    setLines([{ slNo: 1, description: prefillEntry.description || '', hsn: '998313', quantity: '1', rate: prefillEntry.amount || '', per: 'NOS.', amount: prefillEntry.amount || 0, directAmount: false }]);
    setGstApplicable(prefillEntry.gstApplicable !== false);
    setDiscount(null);
    setEditingRecordId(null);
    setIsEditMode(false);
    onClearPrefill && onClearPrefill();
  }, [prefillEntry, settings]);

  const resetForm = () => {
    setBuyer({ clientId: '', name: '', address: '', gstin: '', pan: '', stateName: '', stateCode: '' });
    setLines([emptyLine(1)]);
    setGstApplicable(true);
    setGstType('IGST');
    setIgstRate(18);
    setCgstRate(9);
    setDeliveryNote(''); setPaymentTerms(''); setReferenceNo('');
    setDiscount(null);
    setEditingRecordId(null);
    setIsEditMode(false);
  };

  const buildRecord = (status) => {
    const { subtotal, discountAmount, taxableTotal, effectiveType, totalTax, grandTotal, igstAmount, cgstAmount, sgstAmount, roundOff } = calcTax(lines, gstApplicable, buyer.stateCode, settings.companyStateCode, gstType, igstRate, cgstRate, discount);
    return {
      invoiceNumber: invoiceNo,
      invoiceDate,
      clientId: buyer.clientId,
      scheduleEntryId: prefillEntry?.id || '',
      // Seller snapshot
      sellerName: settings.companyName,
      sellerAddress: settings.companyAddress,
      sellerGSTIN: settings.companyGSTIN,
      sellerPAN: settings.companyPAN,
      sellerStateName: settings.companyStateName,
      sellerStateCode: settings.companyStateCode,
      sellerEmail: settings.companyEmail,
      // Buyer snapshot
      buyerName: buyer.name,
      buyerAddress: buyer.address,
      buyerGSTIN: buyer.gstin,
      buyerPAN: buyer.pan,
      buyerStateName: buyer.stateName,
      buyerStateCode: buyer.stateCode,
      // Line items snapshot
      lineItems: lines,
      // Tax snapshot (all rounded)
      taxableAmount: taxableTotal,
      taxType: effectiveType,
      taxRate: 18,
      taxAmount: totalTax,
      totalAmount: grandTotal,
      igstAmount,
      cgstAmount,
      sgstAmount,
      roundOff,
      // GST config snapshot (needed to re-render correctly)
      gstApplicable,
      gstType,
      igstRate,
      cgstRate,
      // Optional fields
      deliveryNote,
      paymentTerms,
      referenceNo,
      discountType: discount?.type || '',
      discountValue: discount?.value || 0,
      discountAmount: discountAmount || 0,
      status,
    };
  };

  const triggerPrint = () => {
    if (!previewRef.current) return;
    const html = previewRef.current.innerHTML;
    printInvoiceHtml(html);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    const record = buildRecord('Draft');
    if (editingRecordId) {
      await base44.entities.ProformaInvoice.update(editingRecordId, record);
    } else {
      const created = await base44.entities.ProformaInvoice.create(record);
      setEditingRecordId(created.id);
      await incrementInvoiceCounter(base44, invoiceNo);
      setInvoiceNo(invoiceNo + 1);
    }
    setSaving(false);
  };

  const handleGenerate = async () => {
    setSaving(true);
    const record = buildRecord('Generated');
    if (editingRecordId) {
      await base44.entities.ProformaInvoice.update(editingRecordId, record);
    } else {
      const created = await base44.entities.ProformaInvoice.create(record);
      await incrementInvoiceCounter(base44, invoiceNo);
    }
    if (prefillEntry?.id && !prefillEntry._editMode) {
      await base44.entities.InvoiceEntry.update(prefillEntry.id, { status: 'Generated', invoiceNumber: invoiceNo, generatedAt: new Date().toISOString() });
    }
    await autoSaveBuyer();
    setSaving(false);
    triggerPrint();
    onSaved && onSaved();
    resetForm();
  };

  const handleGenerateAndSend = async () => {
    setSaving(true);
    const record = buildRecord('Sent');
    if (editingRecordId) {
      await base44.entities.ProformaInvoice.update(editingRecordId, record);
    } else {
      await base44.entities.ProformaInvoice.create(record);
      await incrementInvoiceCounter(base44, invoiceNo);
    }
    if (prefillEntry?.id && !prefillEntry._editMode) {
      await base44.entities.InvoiceEntry.update(prefillEntry.id, { status: 'Sent', invoiceNumber: invoiceNo, generatedAt: new Date().toISOString() });
    }
    await autoSaveBuyer();
    setSaving(false);
    triggerPrint();
    onSaved && onSaved();
    resetForm();
  };

  const handleSaveToBuyer = async () => {
    if (!buyer.clientId) return;
    await base44.entities.Client.update(buyer.clientId, {
      legalName: buyer.name,
      billingAddress: buyer.address,
      gstin: buyer.gstin,
      pan: buyer.pan,
      stateName: buyer.stateName,
      stateCode: buyer.stateCode,
    });
  };

  // Auto-save buyer billing details back to client profile (silent, no confirmation)
  const autoSaveBuyer = async () => {
    if (!buyer.clientId) return;
    try {
      await base44.entities.Client.update(buyer.clientId, {
        legalName: buyer.name,
        billingAddress: buyer.address,
        gstin: buyer.gstin,
        pan: buyer.pan,
        stateName: buyer.stateName,
        stateCode: buyer.stateCode,
      });
    } catch (e) { /* silent — invoice already saved */ }
  };

  if (!settings) return <div className="text-center py-16 text-muted-foreground">Loading...</div>;

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">
          {isEditMode ? `Editing Invoice #${invoiceNo}` : editingRecordId ? `Editing Draft #${invoiceNo - 1}` : `New Invoice — will be assigned #${invoiceNo}`}
        </span>
        <button onClick={resetForm} className="text-xs text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-lg">New Invoice</button>
      </div>
      <InvoiceFormPreview
        settings={settings}
        invoiceNo={invoiceNo} setInvoiceNo={setInvoiceNo}
        invoiceDate={invoiceDate} setInvoiceDate={setInvoiceDate}
        buyer={buyer} setBuyer={setBuyer}
        lines={lines} setLines={setLines}
        gstApplicable={gstApplicable} setGstApplicable={setGstApplicable}
        gstType={gstType} setGstType={setGstType}
        igstRate={igstRate} setIgstRate={setIgstRate}
        cgstRate={cgstRate} setCgstRate={setCgstRate}
        deliveryNote={deliveryNote} setDeliveryNote={setDeliveryNote}
        paymentTerms={paymentTerms} setPaymentTerms={setPaymentTerms}
        referenceNo={referenceNo} setReferenceNo={setReferenceNo}
        discount={discount} setDiscount={setDiscount}
        allClients={allClients}
        onSaveDraft={handleSaveDraft}
        onGenerate={handleGenerate}
        onGenerateAndSend={handleGenerateAndSend}
        saving={saving}
        onSaveToBuyer={handleSaveToBuyer}
        previewRef={previewRef}
      />
    </>
  );
}