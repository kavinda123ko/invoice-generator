/* ==============================================
   invoice.js — Invoice state and calculation logic
   ============================================== */

const InvoiceState = {
  items: [
    { desc: 'Web Design Service',  qty: 1, price: 500 },
    { desc: 'Monthly Maintenance', qty: 3, price: 150 },
  ],

  getCurrency() {
    return document.getElementById('currency').value;
  },

  calcTotals() {
    const sym    = this.getCurrency();
    const disc   = parseFloat(document.getElementById('discount').value) || 0;
    const tax    = parseFloat(document.getElementById('taxRate').value)  || 0;
    const ship   = parseFloat(document.getElementById('shipping').value) || 0;
    const sub    = this.items.reduce((sum, item) => sum + (item.qty || 0) * (item.price || 0), 0);
    const discAmt = sub * disc / 100;
    const taxAmt  = (sub - discAmt) * tax / 100;
    const grand   = sub - discAmt + taxAmt + ship;
    return { sym, sub, discAmt, taxAmt, ship, grand };
  },

  addItem() {
    this.items.push({ desc: '', qty: 1, price: 0 });
  },

  removeItem(index) {
    if (this.items.length > 1) {
      this.items.splice(index, 1);
    }
  },

  updateItem(index, field, value) {
    if (index >= 0 && index < this.items.length) {
      this.items[index][field] = value;
    }
  },

  reset() {
    this.items = [{ desc: '', qty: 1, price: 0 }];
  },
};

/* ── Helpers ── */

function formatCurrency(sym, num) {
  return sym + parseFloat(num || 0).toFixed(2);
}

function formatDate(dateStr) {
  if (!dateStr) return '\u2014';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    year:  'numeric',
    month: 'short',
    day:   'numeric',
  });
}
