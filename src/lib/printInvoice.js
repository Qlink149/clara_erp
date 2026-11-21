/**
 * Opens a clean white popup window with only the invoice HTML and triggers print/save-as-PDF.
 * This completely isolates the invoice from the dark ERP theme.
 */
export function printInvoiceHtml(invoiceHtml) {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Proforma Invoice</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: white !important; color: black !important; font-family: Arial, sans-serif; font-size: 10px; padding: 10mm; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #555; padding: 4px; }
    .bg-gray-50 { background: #f9fafb; }
    .font-bold { font-weight: bold; }
    .font-semibold { font-weight: 600; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .whitespace-pre-wrap { white-space: pre-wrap; }
    .text-gray-500 { color: #666; }
    .text-gray-600 { color: #444; }
    .italic { font-style: italic; }
    @page { margin: 10mm; size: A4; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  ${invoiceHtml}
  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
    };
  </script>
</body>
</html>`);
  win.document.close();
}