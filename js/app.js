/* ==============================================
   app.js — DOM interactions and event listeners
   ============================================== */

document.addEventListener('DOMContentLoaded', () => {
  initDates();
  bindFormEvents();
  bindItemsEvents();
  renderItems();
  updatePreview();
});

/* ── Initialisation ── */

function initDates() {
  const today = new Date().toISOString().split('T')[0];
  const due   = new Date(Date.now() + 30 * 86_400_000).toISOString().split('T')[0];
  document.getElementById('invDate').value = today;
  document.getElementById('dueDate').value = due;
}

/* ── Event binding ── */

function bindFormEvents() {
  const fields = [
    'invNumber', 'invDate', 'dueDate', 'currency',
    'fromName',  'fromEmail', 'fromPhone', 'fromAddress',
    'toName',    'toEmail',   'toPhone',   'toAddress',
    'discount',  'taxRate',   'shipping',
    'notes',     'terms',
  ];

  fields.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input',  updatePreview);
    el.addEventListener('change', updatePreview);
  });

  document.getElementById('addItemBtn').addEventListener('click', () => {
    InvoiceState.addItem();
    renderItems();
    updatePreview();
  });

  document.getElementById('resetBtn').addEventListener('click', resetForm);
  document.getElementById('downloadBtn').addEventListener('click', downloadPDF);
}

function bindItemsEvents() {
  const body = document.getElementById('itemsBody');

  /* Update state when the user types into any item input */
  body.addEventListener('input', e => {
    const el    = e.target;
    const index = parseInt(el.dataset.index, 10);
    const field = el.dataset.field;
    if (!field || isNaN(index)) return;

    const value = field === 'desc' ? el.value : parseFloat(el.value) || 0;
    InvoiceState.updateItem(index, field, value);

    /* Only refresh what changed — avoids stealing focus from active input */
    updateLineTotals();
    updatePreviewItems();
    updatePreviewTotals();
  });

  /* Remove a row when × is clicked */
  body.addEventListener('click', e => {
    const btn = e.target.closest('.remove-btn');
    if (!btn) return;
    InvoiceState.removeItem(parseInt(btn.dataset.index, 10));
    renderItems();
    updatePreview();
  });
}

/* ── Render items table ── */

function renderItems() {
  const sym  = InvoiceState.getCurrency();
  const body = document.getElementById('itemsBody');
  body.innerHTML = '';

  InvoiceState.items.forEach((item, i) => {
    const tr = document.createElement('tr');

    /* Description */
    const descTd    = document.createElement('td');
    const descInput = document.createElement('input');
    descInput.type             = 'text';
    descInput.value            = item.desc;
    descInput.placeholder      = 'Item description';
    descInput.dataset.index    = i;
    descInput.dataset.field    = 'desc';
    descTd.appendChild(descInput);
    tr.appendChild(descTd);

    /* Quantity */
    const qtyTd    = document.createElement('td');
    const qtyInput = document.createElement('input');
    qtyInput.type          = 'number';
    qtyInput.value         = item.qty;
    qtyInput.min           = '0';
    qtyInput.step          = '1';
    qtyInput.dataset.index = i;
    qtyInput.dataset.field = 'qty';
    qtyTd.appendChild(qtyInput);
    tr.appendChild(qtyTd);

    /* Unit price */
    const priceTd    = document.createElement('td');
    const priceInput = document.createElement('input');
    priceInput.type          = 'number';
    priceInput.value         = item.price;
    priceInput.min           = '0';
    priceInput.step          = '0.01';
    priceInput.dataset.index = i;
    priceInput.dataset.field = 'price';
    priceTd.appendChild(priceInput);
    tr.appendChild(priceTd);

    /* Line total */
    const totalTd = document.createElement('td');
    totalTd.className  = 'line-total';
    totalTd.id         = `lineTotal-${i}`;
    totalTd.textContent = formatCurrency(sym, (item.qty || 0) * (item.price || 0));
    tr.appendChild(totalTd);

    /* Remove button */
    const actionTd  = document.createElement('td');
    const removeBtn = document.createElement('button');
    removeBtn.type          = 'button';
    removeBtn.className     = 'remove-btn';
    removeBtn.dataset.index = i;
    removeBtn.title         = 'Remove item';
    removeBtn.textContent   = '\u00d7';
    actionTd.appendChild(removeBtn);
    tr.appendChild(actionTd);

    body.appendChild(tr);
  });
}

/* ── Granular preview updaters ── */

function updateLineTotals() {
  const sym = InvoiceState.getCurrency();
  InvoiceState.items.forEach((item, i) => {
    const el = document.getElementById(`lineTotal-${i}`);
    if (el) el.textContent = formatCurrency(sym, (item.qty || 0) * (item.price || 0));
  });
}

function updatePreviewTotals() {
  const sym = InvoiceState.getCurrency();
  const { sub, discAmt, taxAmt, ship, grand } = InvoiceState.calcTotals();
  const df = n => formatCurrency(sym, n);

  /* Form totals sidebar */
  document.getElementById('subtotalDisplay').textContent = df(sub);
  document.getElementById('discountDisplay').textContent = '-' + df(discAmt);
  document.getElementById('taxDisplay').textContent      = df(taxAmt);
  document.getElementById('shippingDisplay').textContent = df(ship);
  document.getElementById('grandDisplay').textContent    = df(grand);

  /* Preview panel totals */
  document.getElementById('pSub').textContent   = df(sub);
  document.getElementById('pDisc').textContent  = '-' + df(discAmt);
  document.getElementById('pTax').textContent   = df(taxAmt);
  document.getElementById('pShip').textContent  = df(ship);
  document.getElementById('pGrand').textContent = df(grand);
}

function updatePreviewItems() {
  const sym  = InvoiceState.getCurrency();
  const df   = n => formatCurrency(sym, n);
  const body = document.getElementById('pItems');
  body.innerHTML = '';

  InvoiceState.items.forEach(item => {
    const tr = document.createElement('tr');

    const td1 = document.createElement('td');
    td1.textContent = item.desc || '\u2014';

    const td2 = document.createElement('td');
    td2.className   = 'text-right text-muted';
    td2.textContent = item.qty;

    const td3 = document.createElement('td');
    td3.className   = 'text-right text-muted';
    td3.textContent = df(item.price);

    const td4 = document.createElement('td');
    td4.className   = 'text-right';
    td4.textContent = df((item.qty || 0) * (item.price || 0));

    tr.append(td1, td2, td3, td4);
    body.appendChild(tr);
  });
}

function updatePreviewHeader() {
  document.getElementById('pNumber').textContent =
    document.getElementById('invNumber').value || 'INV-0001';

  document.getElementById('pFromName').textContent =
    document.getElementById('fromName').value || 'Your Company';

  const fromDetails = [
    document.getElementById('fromEmail').value,
    document.getElementById('fromAddress').value,
  ].filter(Boolean);
  document.getElementById('pFromDetail').textContent =
    fromDetails.join(' \u00b7 ') || '\u2014';

  document.getElementById('pToName').textContent =
    document.getElementById('toName').value || 'Client Name';

  const toDetails = [
    document.getElementById('toEmail').value,
    document.getElementById('toAddress').value,
  ].filter(Boolean);
  document.getElementById('pToDetail').textContent =
    toDetails.join(' \u00b7 ') || '\u2014';

  document.getElementById('pDate').textContent =
    formatDate(document.getElementById('invDate').value);
  document.getElementById('pDue').textContent =
    formatDate(document.getElementById('dueDate').value);
}

function updatePreviewNote() {
  document.getElementById('pNote').textContent =
    document.getElementById('notes').value || '';
}

/* ── Full preview refresh ── */

function updatePreview() {
  updatePreviewHeader();
  updatePreviewItems();
  updateLineTotals();
  updatePreviewTotals();
  updatePreviewNote();
}

/* ── Reset ── */

function resetForm() {
  const today = new Date().toISOString().split('T')[0];
  const due   = new Date(Date.now() + 30 * 86_400_000).toISOString().split('T')[0];

  document.getElementById('invNumber').value = 'INV-0001';
  document.getElementById('invDate').value   = today;
  document.getElementById('dueDate').value   = due;
  document.getElementById('currency').value  = '$';

  [
    'fromName', 'fromEmail', 'fromPhone', 'fromAddress',
    'toName',   'toEmail',   'toPhone',   'toAddress',
    'notes',    'terms',
  ].forEach(id => { document.getElementById(id).value = ''; });

  document.getElementById('discount').value = '0';
  document.getElementById('taxRate').value  = '0';
  document.getElementById('shipping').value = '0';

  InvoiceState.reset();
  renderItems();
  updatePreview();
}
