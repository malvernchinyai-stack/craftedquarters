/* Crafted Quarters – shared helpers, defaults and calculations */
const CQ = (() => {
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const todayISO = () => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  };
  const addDays = (iso, n) => {
    const d = new Date(iso + 'T00:00:00');
    d.setDate(d.getDate() + Number(n || 0));
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  };
  const round2 = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  const num = v => { const n = parseFloat(String(v).replace(/,/g, '')); return isFinite(n) ? n : 0; };

  const TYPES = {
    quote: { label: 'Quotation', plural: 'Quotations', short: 'Quote', title: 'QUOTATION' },
    invoice: { label: 'Invoice', plural: 'Invoices', short: 'Invoice', title: 'INVOICE' },
    boq: { label: 'Bill of Quantities', plural: 'Bills of Quantities', short: 'BOQ', title: 'BILL OF QUANTITIES' }
  };

  const CURRENCIES = {
    USD: { symbol: 'US$', name: 'US Dollar', words: ['US Dollars', 'Cents'] },
    ZWG: { symbol: 'ZWG', name: 'Zimbabwe Gold', words: ['ZiG', 'Cents'] },
    ZAR: { symbol: 'R', name: 'South African Rand', words: ['Rand', 'Cents'] }
  };

  const UNITS = ['Item', 'No.', 'Sum', 'm', 'm²', 'm³', 'kg', 't', 'L', 'Bag', 'Roll', 'Sheet', 'Length', 'Pair', 'Set', 'Hr', 'Day', 'Week', 'Month', 'Trip', 'Lot', '%'];

  const QUOTE_STATUSES = ['Draft', 'Sent', 'Accepted', 'Declined'];
  const BOQ_STATUSES = ['Draft', 'Issued', 'Approved'];

  const DEFAULT_SETTINGS = {
    id: 'settings',
    companyName: 'Crafted Quarters (Private) Limited',
    tradingName: 'Crafted Quarters',
    address: '464 Herbert Chitepo St, Masvingo, Zimbabwe',
    phone: '+263 77 391 1346',
    whatsapp: '+263 77 391 1346',
    email: 'info@craftedquarters.co.zw',
    website: 'www.craftedquarters.co.zw',
    regNo: '',
    tin: '',
    vatNo: '',
    bank: 'Bank: \nAccount Name: Crafted Quarters (Private) Limited\nAccount No.: \nBranch: \nSwift Code: ',
    currency: 'USD',
    vatEnabled: true,
    vatRate: 15,
    quoteValidDays: 30,
    invoiceDueDays: 14,
    preparedBy: '',
    logo: null, // data URL override; null = approved logo
    prefixes: { quote: 'QT', invoice: 'INV', boq: 'BOQ' },
    counters: { quote: 0, invoice: 0, boq: 0 },
    terms: {
      quote: '1. This quotation is valid for the period stated above.\n2. A deposit of 50% is required before work commences; the balance is due on completion.\n3. Any work outside the quoted scope will be charged separately.\n4. Prices are subject to change without notice after the validity period.',
      invoice: '1. Payment is due by the date shown above.\n2. Please use the invoice number as your payment reference.\n3. Goods and workmanship remain the property of Crafted Quarters until paid in full.',
      boq: '1. Quantities are estimates based on the drawings and site information available at the time of measurement.\n2. Final quantities will be re-measured on completion and billed accordingly.\n3. Rates include labour, materials and plant unless otherwise stated.'
    },
    brandColor: '#033A75'
  };

  function lineAmount(it) { return round2(num(it.qty) * num(it.rate)); }
  function sectionTotal(sec) { return round2((sec.items || []).reduce((a, it) => a + lineAmount(it), 0)); }

  function totals(doc) {
    const subtotal = round2((doc.sections || []).reduce((a, s) => a + sectionTotal(s), 0));
    const contingency = doc.type === 'boq' ? round2(subtotal * num(doc.contingency) / 100) : 0;
    const base = round2(subtotal + contingency);
    let discount = 0;
    if (num(doc.discountValue) > 0) {
      discount = doc.discountType === 'percent' ? round2(base * num(doc.discountValue) / 100) : round2(num(doc.discountValue));
    }
    discount = Math.min(discount, base);
    const taxable = round2(base - discount);
    const vat = doc.vatEnabled ? round2(taxable * num(doc.vatRate) / 100) : 0;
    const total = round2(taxable + vat);
    const paid = round2((doc.payments || []).reduce((a, p) => a + num(p.amount), 0));
    const balance = round2(total - paid);
    return { subtotal, contingency, discount, taxable, vat, total, paid, balance };
  }

  function invoiceStatus(doc) {
    const t = totals(doc);
    if (doc.status === 'Cancelled') return 'Cancelled';
    if (t.total > 0 && t.balance <= 0.004) return 'Paid';
    if (t.paid > 0) return isOverdue(doc) ? 'Overdue' : 'Partially Paid';
    return isOverdue(doc) ? 'Overdue' : 'Unpaid';
  }
  function isOverdue(doc) { return doc.dueDate && doc.dueDate < todayISO(); }

  function statusOf(doc) {
    if (doc.type === 'invoice') return invoiceStatus(doc);
    if (doc.type === 'quote' && ['Draft', 'Sent'].includes(doc.status) && doc.validUntil && doc.validUntil < todayISO()) return 'Expired';
    return doc.status || 'Draft';
  }

  function money(n, cur) {
    const c = CURRENCIES[cur] || CURRENCIES.USD;
    const v = Number(n || 0);
    const s = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (v < 0 ? '-' : '') + c.symbol + ' ' + s;
  }
  function plain(n) { return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function qtyFmt(n) { const v = num(n); return Number.isInteger(v) ? v.toLocaleString('en-US') : v.toLocaleString('en-US', { maximumFractionDigits: 3 }); }

  function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // Amount in words
  const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function below1000(n) {
    let s = '';
    if (n >= 100) { s += ONES[Math.floor(n / 100)] + ' Hundred'; n %= 100; if (n) s += ' and '; }
    if (n >= 20) { s += TENS[Math.floor(n / 10)]; if (n % 10) s += '-' + ONES[n % 10]; }
    else if (n > 0) s += ONES[n];
    return s;
  }
  function intWords(n) {
    if (n === 0) return 'Zero';
    const scales = [[1e9, 'Billion'], [1e6, 'Million'], [1e3, 'Thousand']];
    let s = '';
    for (const [v, w] of scales) {
      if (n >= v) { s += below1000(Math.floor(n / v)) + ' ' + w + ' '; n %= v; }
    }
    if (n > 0) s += (s && n < 100 ? 'and ' : '') + below1000(n);
    return s.trim();
  }
  function amountWords(amount, cur) {
    const c = CURRENCIES[cur] || CURRENCIES.USD;
    const v = Math.abs(round2(amount));
    const whole = Math.floor(v);
    const cents = Math.round((v - whole) * 100);
    let s = intWords(whole) + ' ' + c.words[0];
    if (cents) s += ' and ' + intWords(cents) + ' ' + c.words[1];
    return s + ' Only';
  }

  function newItem(o = {}) { return { id: uid(), description: '', unit: 'Item', qty: 1, rate: 0, ...o }; }
  function newSection(title = '') { return { id: uid(), title, items: [newItem()] }; }

  return { uid, todayISO, addDays, round2, num, TYPES, CURRENCIES, UNITS, QUOTE_STATUSES, BOQ_STATUSES, DEFAULT_SETTINGS,
    lineAmount, sectionTotal, totals, statusOf, invoiceStatus, money, plain, qtyFmt, fmtDate, amountWords, newItem, newSection };
})();
