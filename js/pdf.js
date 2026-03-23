/* ==============================================
   pdf.js — PDF generation and export logic
   ============================================== */

function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const sym = InvoiceState.getCurrency();
  const { sub, discAmt, taxAmt, ship, grand } = InvoiceState.calcTotals();
  const df = n => formatCurrency(sym, n);

  const W  = 210;
  const H  = 297;
  const lm = 18;        /* left margin  */
  const rm = W - 18;   /* right margin */

  /* ── Dark header band ── */
  doc.setFillColor(13, 13, 13);
  doc.rect(0, 0, W, 52, 'F');

  /* ── Decorative accent circle ── */
  doc.setFillColor(200, 75, 47);
  doc.circle(W - 20, -10, 30, 'F');

  /* ── "INVOICE" label ── */
  doc.setTextColor(138, 132, 120);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('INVOICE', lm, 14);

  /* ── Invoice number ── */
  doc.setTextColor(247, 244, 239);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(document.getElementById('invNumber').value || 'INV-0001', lm, 26);

  /* ── From ── */
  doc.setFontSize(6.5);
  doc.setTextColor(138, 132, 120);
  doc.setFont('helvetica', 'normal');
  doc.text('FROM', lm, 38);
  doc.setTextColor(247, 244, 239);
  doc.setFontSize(8.5);
  doc.text(document.getElementById('fromName').value || 'Your Company', lm, 44);

  /* ── Bill To ── */
  doc.setFontSize(6.5);
  doc.setTextColor(138, 132, 120);
  doc.text('BILL TO', 105, 38);
  doc.setTextColor(247, 244, 239);
  doc.setFontSize(8.5);
  doc.text(document.getElementById('toName').value || 'Client Name', 105, 44);

  /* ── Meta row (Date / Due / Email) ── */
  let y = 64;
  doc.setFontSize(6.5);
  doc.setTextColor(138, 132, 120);
  doc.setFont('helvetica', 'normal');
  doc.text('DATE',       lm,  y);
  doc.text('DUE DATE',   70,  y);
  doc.text('FROM EMAIL', 120, y);

  y += 5;
  doc.setTextColor(13, 13, 13);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(formatDate(document.getElementById('invDate').value), lm, y);
  doc.text(formatDate(document.getElementById('dueDate').value), 70, y);
  doc.setFont('helvetica', 'normal');
  doc.text(document.getElementById('fromEmail').value || '\u2014', 120, y);

  /* ── Separator ── */
  y += 10;
  doc.setDrawColor(220, 215, 205);
  doc.setLineWidth(0.3);
  doc.line(lm, y, rm, y);

  /* ── Table header ── */
  y += 6;
  doc.setFillColor(237, 233, 225);
  doc.rect(lm, y - 3, rm - lm, 7, 'F');
  doc.setFontSize(6.5);
  doc.setTextColor(138, 132, 120);
  doc.setFont('helvetica', 'normal');
  doc.text('DESCRIPTION', lm + 2,  y + 2);
  doc.text('QTY',         130,     y + 2);
  doc.text('UNIT PRICE',  148,     y + 2);
  doc.text('TOTAL',       rm - 2,  y + 2, { align: 'right' });

  /* ── Line items ── */
  y += 9;
  InvoiceState.items.forEach(item => {
    const lineTotal = (item.qty || 0) * (item.price || 0);

    doc.setFontSize(8.5);
    doc.setTextColor(13, 13, 13);
    doc.text(item.desc || '\u2014', lm + 2, y);

    doc.setTextColor(100, 100, 100);
    doc.text(String(item.qty  || 0), 133,    y, { align: 'right' });
    doc.text(df(item.price    || 0), 167,    y, { align: 'right' });

    doc.setTextColor(13, 13, 13);
    doc.text(df(lineTotal),          rm - 2, y, { align: 'right' });

    y += 7;
    doc.setDrawColor(237, 233, 225);
    doc.line(lm, y - 1, rm, y - 1);
  });

  /* ── Totals box ── */
  y += 4;
  doc.setFillColor(237, 233, 225);
  doc.roundedRect(rm - 72, y, 72, 38, 2, 2, 'F');

  let ty = y + 7;
  const totRows = [
    ['Subtotal', df(sub)],
    ['Discount', '-' + df(discAmt)],
    ['Tax',      df(taxAmt)],
    ['Shipping', df(ship)],
  ];

  doc.setFontSize(7.5);
  totRows.forEach(([label, val]) => {
    doc.setTextColor(138, 132, 120);
    doc.setFont('helvetica', 'normal');
    doc.text(label, rm - 70, ty);
    doc.setTextColor(13, 13, 13);
    doc.text(val, rm - 2, ty, { align: 'right' });
    ty += 6;
  });

  doc.setDrawColor(180, 175, 165);
  doc.line(rm - 70, ty - 1, rm - 2, ty - 1);
  ty += 3;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(13, 13, 13);
  doc.text('TOTAL DUE', rm - 70, ty);

  doc.setTextColor(200, 75, 47);
  doc.setFontSize(11);
  doc.text(df(grand), rm - 2, ty, { align: 'right' });

  /* ── Notes ── */
  const notes = document.getElementById('notes').value.trim();
  if (notes) {
    y += 46;
    doc.setFontSize(6.5);
    doc.setTextColor(138, 132, 120);
    doc.setFont('helvetica', 'normal');
    doc.text('NOTES', lm, y);
    y += 5;
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(doc.splitTextToSize(notes, 100), lm, y);
  }

  /* ── Footer accent bar ── */
  doc.setFillColor(200, 75, 47);
  doc.rect(0, H - 6, W, 6, 'F');

  /* ── Save ── */
  const invNum = document.getElementById('invNumber').value || 'export';
  doc.save(`invoice-${invNum}.pdf`);
}
