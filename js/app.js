/* Crafted Quarters Docs – main application */
(() => {
  const APP_VERSION = '1.1.0';
  // Developer credit – shown inside the app only, never on printed / PDF documents
  const DEVELOPER = {
    name: 'Pilotage Business Consultants (Pvt) Ltd',
    web: 'https://www.pilotage.co.zw', webLabel: 'www.pilotage.co.zw',
    email: 'info@pilotage.co.zw', phone: '+263 716 572 205'
  };
  const devCredit = () => `<div class="dev-credit">This application was developed by<br><b>${DEVELOPER.name}</b></div>`;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const view = $('#view');

  const ICON = {
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
    pdf: '<svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',
    share: '<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>',
    wa: '<svg viewBox="0 0 24 24"><path d="M3 21l1.7-5A8.5 8.5 0 1 1 8 19.3z"/><path d="M9 9.5c.3 2 2.5 4.3 4.7 4.8l1.1-1.1 1.9.9c-.2 1-1 1.9-2 1.9-3.4 0-6.9-3.5-6.9-6.9 0-1 .9-1.8 1.9-2l.9 1.9z"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
    more: '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/></svg>',
    convert: '<svg viewBox="0 0 24 24"><path d="M4 7h13l-3-3M20 17H7l3 3"/></svg>',
    cash: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>',
    doc: '<svg viewBox="0 0 24 24"><path d="M7 3h7l5 5v13H7zM14 3v5h5"/></svg>',
    user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    box: '<svg viewBox="0 0 24 24"><path d="M4 7l8-4 8 4-8 4zM4 7v10l8 4 8-4V7M12 11v10"/></svg>',
    list: '<svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>'
  };
  const TYPE_BADGE = { quote: 'QT', invoice: 'INV', boq: 'BOQ' };

  let S = null;              // settings
  let editor = null;         // { draft, dirty, isNew }
  let lastHash = location.hash;
  let installPrompt = null;

  /* ---------------- utilities ---------------- */
  function toast(msg, ms = 2400) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), ms);
  }
  function statusPill(st) { return `<span class="pill s-${esc(st.replace(/\s/g, ''))}">${esc(st)}</span>`; }

  // Bottom sheets register a history entry so the Android back button closes them
  let sheetPushed = false, popWaiter = null, sheetDismiss = null;
  function openSheet(html, onMount, onDismiss = null) {
    const sh = $('#sheet'), bd = $('#sheetBackdrop');
    if (sh.hidden) { history.pushState({ cqSheet: 1 }, ''); sheetPushed = true; }
    sheetDismiss = onDismiss;
    sh.innerHTML = html; sh.hidden = false; bd.hidden = false; sh.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    if (onMount) onMount(sh);
    const first = sh.querySelector('input:not([type=hidden]),textarea');
    if (first && !first.dataset.noautofocus && window.matchMedia('(min-width: 760px)').matches) first.focus();
    return sh;
  }
  function hideSheet() {
    $('#sheet').hidden = true; $('#sheetBackdrop').hidden = true; $('#sheet').innerHTML = '';
    document.body.style.overflow = '';
    sheetDismiss = null;
  }
  function closeSheet() {
    hideSheet();
    if (!sheetPushed) return Promise.resolve();
    sheetPushed = false;
    return new Promise(resolve => {
      popWaiter = resolve;
      history.back();
      setTimeout(() => { if (popWaiter === resolve) { popWaiter = null; resolve(); } }, 600);
    });
  }
  window.addEventListener('popstate', () => {
    if (popWaiter) { const r = popWaiter; popWaiter = null; r(); return; }
    if (!$('#sheet').hidden) { const d = sheetDismiss; sheetPushed = false; hideSheet(); if (d) d(); }
  });
  $('#sheetBackdrop').addEventListener('click', () => { const d = sheetDismiss; closeSheet(); if (d) d(); });

  function confirmSheet(title, message, okLabel = 'Confirm', danger = false) {
    return new Promise(resolve => {
      openSheet(`<h3>${esc(title)}</h3><p class="muted">${esc(message)}</p>
        <div class="btn-row"><button class="btn btn-line" data-a="no">Cancel</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-a="yes">${esc(okLabel)}</button></div>`, sh => {
        sh.addEventListener('click', async e => {
          const a = e.target.closest('[data-a]'); if (!a) return;
          await closeSheet(); resolve(a.dataset.a === 'yes');
        });
      }, () => resolve(false));
    });
  }

  function formData(form) {
    const o = {};
    $$('[name]', form).forEach(el => { o[el.name] = el.type === 'checkbox' ? el.checked : el.value.trim(); });
    return o;
  }

  function setChrome({ title = null, back = false, fab = true, tab = null }) {
    $('#appLogo').hidden = !!title;
    $('#pageTitle').hidden = !title;
    $('#pageTitle').textContent = title || '';
    $('#backBtn').hidden = !back;
    $('#fab').hidden = !fab;
    $$('.bottomnav a').forEach(a => a.classList.toggle('active', a.dataset.tab === tab));
  }

  async function loadSettings() {
    const s = await DB.get('meta', 'settings');
    S = { ...CQ.DEFAULT_SETTINGS, ...(s || {}) };
    S.prefixes = { ...CQ.DEFAULT_SETTINGS.prefixes, ...(S.prefixes || {}) };
    S.counters = { ...CQ.DEFAULT_SETTINGS.counters, ...(S.counters || {}) };
    S.terms = { ...CQ.DEFAULT_SETTINGS.terms, ...(S.terms || {}) };
    // Numbering restarts every calendar year (QT-2027-0001 …)
    const yr = new Date().getFullYear();
    if (S.counterYear !== yr) {
      if (S.counterYear) S.counters = { quote: 0, invoice: 0, boq: 0 };
      S.counterYear = yr;
      await DB.put('meta', S);
    } else if (!s) await DB.put('meta', S);
  }
  const saveSettings = () => DB.put('meta', S);

  function formatNumber(type, n) {
    return `${S.prefixes[type] || type.toUpperCase()}-${new Date().getFullYear()}-${String(n).padStart(4, '0')}`;
  }
  async function nextNumber(type, commit) {
    const docs = (await DB.all('docs')).filter(d => d.type === type);
    let n = (S.counters[type] || 0) + 1;
    const taken = new Set(docs.map(d => d.number));
    while (taken.has(formatNumber(type, n))) n++;
    if (commit) { S.counters[type] = n; await saveSettings(); }
    return formatNumber(type, n);
  }

  function logoSrc() { return S.logo || 'assets/logo-pdf.jpg'; }

  /* ---------------- router ---------------- */
  const routes = [
    [/^#\/?$|^#\/home$/, renderHome],
    [/^#\/docs(?:\?t=(\w+))?$/, m => renderDocs(m[1])],
    [/^#\/doc\/([\w-]+)$/, m => renderDoc(m[1])],
    [/^#\/edit\/([\w-]+)$/, m => renderEditor({ id: m[1] })],
    [/^#\/new\/(quote|invoice|boq)(?:\?client=([\w-]+))?$/, m => renderEditor({ type: m[1], clientId: m[2] })],
    [/^#\/clients$/, renderClients],
    [/^#\/client\/([\w-]+)$/, m => renderClient(m[1])],
    [/^#\/items$/, renderItems],
    [/^#\/settings$/, renderSettings]
  ];

  async function route() {
    const h = location.hash || '#/home';
    if (editor && editor.dirty && !h.startsWith('#/edit/') && !h.startsWith('#/new/')) {
      const target = h;
      history.replaceState(null, '', lastHash);
      const ok = await confirmSheet('Discard changes?', 'You have unsaved changes on this document.', 'Discard', true);
      if (!ok) return;
      editor = null;
      location.hash = target;
      return;
    }
    if (!h.startsWith('#/edit/') && !h.startsWith('#/new/')) editor = null;
    lastHash = h;
    if (!$('#sheet').hidden) { sheetPushed = false; hideSheet(); }
    for (const [re, fn] of routes) {
      const m = h.match(re);
      if (m) { await fn(m); window.scrollTo(0, 0); return; }
    }
    location.hash = '#/home';
  }
  window.addEventListener('hashchange', route);
  $('#backBtn').addEventListener('click', () => {
    if (history.length > 1) history.back(); else location.hash = '#/home';
  });

  $('#fab').addEventListener('click', () => {
    const h = location.hash;
    if (h.startsWith('#/clients')) return clientSheet();
    if (h.startsWith('#/items')) return itemSheet();
    newDocSheet();
  });

  function newDocSheet(clientId) {
    const q = clientId ? `?client=${clientId}` : '';
    openSheet(`<h3>Create new</h3>
      <div class="list pick-list">
        ${['quote', 'invoice', 'boq'].map(t => `<a class="row" href="#/new/${t}${q}"><div class="badge-ic ic-${t}">${TYPE_BADGE[t]}</div>
          <div class="main"><div class="t1">${CQ.TYPES[t].label}</div><div class="t2">${t === 'quote' ? 'Price a job for a client' : t === 'invoice' ? 'Bill a client and track payments' : 'Measured quantities, bills and summary'}</div></div></a>`).join('')}
      </div>`);
  }

  /* ---------------- home ---------------- */
  async function renderHome() {
    setChrome({ tab: 'home' });
    const docs = await DB.all('docs');
    const month = CQ.todayISO().slice(0, 7);
    const invoices = docs.filter(d => d.type === 'invoice' && CQ.statusOf(d) !== 'Cancelled');
    const outstanding = invoices.reduce((a, d) => a + Math.max(0, CQ.totals(d).balance), 0);
    const overdue = invoices.filter(d => CQ.statusOf(d) === 'Overdue');
    const receivedMonth = invoices.reduce((a, d) => a + (d.payments || []).filter(p => (p.date || '').startsWith(month)).reduce((x, p) => x + CQ.num(p.amount), 0), 0);
    const openQuotes = docs.filter(d => d.type === 'quote' && ['Draft', 'Sent'].includes(CQ.statusOf(d)));
    const openQuoteValue = openQuotes.reduce((a, d) => a + CQ.totals(d).total, 0);
    const recent = [...docs].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')).slice(0, 6);
    const cur = S.currency;

    view.innerHTML = `
      <div class="hero">
        <small>Outstanding on invoices</small>
        <div class="big">${CQ.money(outstanding, cur)}</div>
        <div class="hero-row">
          <div><b>${CQ.money(receivedMonth, cur)}</b>Received this month</div>
          <div><b>${overdue.length}</b>Overdue invoice${overdue.length === 1 ? '' : 's'}</div>
        </div>
      </div>
      <div class="quick">
        <button data-new="quote"><span class="ic">${ICON.doc}</span>New Quote</button>
        <button data-new="invoice"><span class="ic">${ICON.cash}</span>New Invoice</button>
        <button data-new="boq"><span class="ic">${ICON.list}</span>New BOQ</button>
      </div>
      <div class="section-title">This business</div>
      <div class="stats">
        <div class="stat"><b>${openQuotes.length}</b><span>Open quotes</span><small>${CQ.money(openQuoteValue, cur)}</small></div>
        <div class="stat"><b>${invoices.length}</b><span>Invoices</span><small>${CQ.money(invoices.reduce((a, d) => a + CQ.totals(d).total, 0), cur)}</small></div>
        <div class="stat"><b>${docs.filter(d => d.type === 'boq').length}</b><span>BOQs</span><small>${CQ.money(docs.filter(d => d.type === 'boq').reduce((a, d) => a + CQ.totals(d).total, 0), cur)}</small></div>
      </div>
      ${overdue.length ? `<div class="section-title">Overdue</div><div class="list">${overdue.map(docRow).join('')}</div>` : ''}
      <div class="section-title">Recent documents <a href="#/docs">See all</a></div>
      ${recent.length ? `<div class="list">${recent.map(docRow).join('')}</div>` :
        `<div class="card empty">${ICON.doc}<div><b>No documents yet</b></div><div>Tap a button above to create your first quotation, invoice or BOQ.</div></div>`}
      ${backupDue(docs) ? `<div class="card notice" style="margin-top:14px"><div><b>Back up your records</b><div class="muted" style="font-size:13px">${S.lastBackupAt ? `Last backup ${CQ.fmtDate(S.lastBackupAt.slice(0, 10))}.` : 'No backup made yet.'} Records are stored only on this phone.</div></div><a class="btn btn-blue btn-sm" href="#/settings">Back up</a></div>` : ''}
      ${installPrompt ? `<div class="card" style="margin-top:14px"><h2>Install on this device</h2><p class="muted mt0">Add Crafted Quarters Docs to your home screen so it opens like an app and works offline.</p><button class="btn btn-blue btn-block" id="installBtn">Install app</button></div>` : ''}
      ${devCredit()}
    `;
    $$('[data-new]', view).forEach(b => b.onclick = () => location.hash = `#/new/${b.dataset.new}`);
    const ib = $('#installBtn'); if (ib) ib.onclick = doInstall;
  }

  function backupDue(docs) {
    if (!docs.length) return false;
    if (!S.lastBackupAt) return docs.length >= 3;
    return (Date.now() - new Date(S.lastBackupAt).getTime()) > 14 * 864e5;
  }

  function docRow(d) {
    const t = CQ.totals(d), st = CQ.statusOf(d);
    const amt = d.type === 'invoice' && t.paid > 0 && t.balance > 0 ? `<div class="t2">Bal ${CQ.money(t.balance, d.currency)}</div>` : '';
    return `<a class="row" href="#/doc/${d.id}">
      <div class="badge-ic ic-${d.type}">${TYPE_BADGE[d.type]}</div>
      <div class="main"><div class="t1">${esc(d.client?.name || 'No client')}</div>
        <div class="t2">${esc(d.number)} · ${CQ.fmtDate(d.date)}${d.project ? ' · ' + esc(d.project) : ''}</div></div>
      <div class="end"><div class="amt">${CQ.money(t.total, d.currency)}</div>${amt}<div>${statusPill(st)}</div></div></a>`;
  }

  /* ---------------- documents list ---------------- */
  let docsFilter = { type: 'all', q: '', status: 'all' };
  async function renderDocs(t) {
    if (t) docsFilter.type = t;
    setChrome({ title: 'Documents', tab: 'docs' });
    const docs = await DB.all('docs');
    view.innerHTML = `
      <div class="toolbar"><div class="search">${ICON.search}<input type="search" id="q" placeholder="Search client, number, project…" value="${esc(docsFilter.q)}"></div></div>
      <div class="chips" id="typeChips">
        ${[['all', 'All'], ['quote', 'Quotations'], ['invoice', 'Invoices'], ['boq', 'BOQs']].map(([k, l]) => `<button class="chip ${docsFilter.type === k ? 'on' : ''}" data-t="${k}">${l}</button>`).join('')}
      </div>
      <div class="chips" id="statusChips"></div>
      <div id="docList"></div>`;
    const draw = () => {
      const q = docsFilter.q.toLowerCase();
      const pool = docs.filter(d => docsFilter.type === 'all' || d.type === docsFilter.type);
      const statuses = ['all', ...new Set(pool.map(CQ.statusOf))];
      if (!statuses.includes(docsFilter.status)) docsFilter.status = 'all';
      $('#statusChips').innerHTML = statuses.length > 2 ? statuses.map(s => `<button class="chip ${docsFilter.status === s ? 'on' : ''}" data-s="${esc(s)}">${s === 'all' ? 'Any status' : esc(s)}</button>`).join('') : '';
      const list = pool.filter(d => (docsFilter.status === 'all' || CQ.statusOf(d) === docsFilter.status) &&
        (!q || [d.number, d.client?.name, d.project, d.reference, d.site].join(' ').toLowerCase().includes(q)))
        .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.number || '').localeCompare(a.number || ''));
      const total = list.reduce((a, d) => a + CQ.totals(d).total, 0);
      $('#docList').innerHTML = list.length
        ? `<div class="muted" style="font-size:13px;margin:0 2px 8px">${list.length} document${list.length === 1 ? '' : 's'} · ${CQ.money(total, S.currency)}</div><div class="list">${list.map(docRow).join('')}</div>`
        : `<div class="card empty">${ICON.doc}<div>No documents match.</div></div>`;
    };
    draw();
    $('#q').addEventListener('input', e => { docsFilter.q = e.target.value; draw(); });
    $('#typeChips').addEventListener('click', e => {
      const b = e.target.closest('[data-t]'); if (!b) return;
      docsFilter.type = b.dataset.t; $$('#typeChips .chip').forEach(c => c.classList.toggle('on', c === b)); draw();
    });
    $('#statusChips').addEventListener('click', e => {
      const b = e.target.closest('[data-s]'); if (!b) return;
      docsFilter.status = b.dataset.s; draw();
    });
  }

  /* ---------------- document view ---------------- */
  function paperHTML(d) {
    const cur = d.currency || S.currency, T = CQ.totals(d), type = CQ.TYPES[d.type];
    const multi = d.sections.length > 1 || d.type === 'boq';
    let rows = '';
    d.sections.forEach((s, si) => {
      if (multi || s.title) rows += `<tr class="sech"><td colspan="6">${d.type === 'boq' ? `BILL No. ${si + 1}: ` : ''}${esc((s.title || (d.type === 'boq' ? 'Untitled bill' : 'Section ' + (si + 1))).toUpperCase())}</td></tr>`;
      s.items.forEach((it, ii) => {
        rows += `<tr><td class="c">${multi ? `${si + 1}.${ii + 1}` : ii + 1}</td><td>${esc(it.description).replace(/\n/g, '<br>')}</td><td class="c">${esc(it.unit)}</td>
          <td class="r">${CQ.qtyFmt(it.qty)}</td><td class="r">${CQ.plain(CQ.num(it.rate))}</td><td class="r">${CQ.plain(CQ.lineAmount(it))}</td></tr>`;
      });
      if (multi) rows += `<tr class="secf"><td colspan="5" class="r">Total ${d.type === 'boq' ? 'Bill No. ' + (si + 1) : esc(s.title || 'Section ' + (si + 1))}</td><td class="r">${CQ.plain(CQ.sectionTotal(s))}</td></tr>`;
    });
    const c = d.client || {};
    return `<div class="paper">
      <div class="p-head"><img src="${esc(logoSrc())}" alt="Crafted Quarters">
        <div class="p-co"><b>${esc(S.companyName)}</b><br>${esc(S.address)}<br>Tel/WhatsApp: ${esc(S.phone)}<br>${esc(S.email)}</div></div>
      <div class="p-band"><span>${type.title}</span><span>No. ${esc(d.number)}</span></div>
      <div class="p-meta">
        <div><div class="lbl">${d.type === 'invoice' ? 'BILL TO' : d.type === 'boq' ? 'PREPARED FOR' : 'QUOTATION TO'}</div>
          <b>${esc(c.name || '—')}</b>${c.contact ? `<br>Attn: ${esc(c.contact)}` : ''}${c.address ? `<br>${esc(c.address)}` : ''}${c.phone ? `<br>${esc(c.phone)}` : ''}${c.email ? `<br>${esc(c.email)}` : ''}</div>
        <div><div class="lbl">DETAILS</div>Date: <b>${CQ.fmtDate(d.date)}</b>
          ${d.type === 'quote' && d.validUntil ? `<br>Valid until: <b>${CQ.fmtDate(d.validUntil)}</b>` : ''}
          ${d.type === 'invoice' && d.dueDate ? `<br>Due: <b>${CQ.fmtDate(d.dueDate)}</b>` : ''}
          ${d.project ? `<br>Project: <b>${esc(d.project)}</b>` : ''}${d.site ? `<br>Site: <b>${esc(d.site)}</b>` : ''}
          ${d.reference ? `<br>Ref: <b>${esc(d.reference)}</b>` : ''}</div>
      </div>
      ${d.intro ? `<p>${esc(d.intro).replace(/\n/g, '<br>')}</p>` : ''}
      <div class="table-wrap"><table><thead><tr><th class="c">${d.type === 'boq' ? 'Item' : '#'}</th><th>Description</th><th class="c">Unit</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="p-tot totals">${totalsRows(d, T, cur)}</div>
      <div class="words">${esc(CQ.amountWords(d.type === 'invoice' && T.paid > 0 && T.balance > 0 ? T.balance : T.total, cur))}</div>
      ${d.type === 'invoice' && ['Paid', 'Cancelled'].includes(CQ.statusOf(d)) ? `<div style="margin-top:10px"><span class="stamp ${CQ.statusOf(d) === 'Paid' ? 'paid' : 'cancelled'}">${CQ.statusOf(d) === 'Paid' ? 'PAID IN FULL' : 'CANCELLED'}</span></div>` : ''}
      ${d.type !== 'boq' || d.showBank ? `<div class="p-box"><b>Banking details</b>\n${esc(S.bank)}</div>` : ''}
      ${d.notes ? `<div class="p-box line-box"><b>Notes</b>\n${esc(d.notes)}</div>` : ''}
      ${d.terms ? `<div class="p-box line-box"><b>Terms &amp; conditions</b>\n${esc(d.terms)}</div>` : ''}
    </div>`;
  }

  function totalsRows(d, T, cur) {
    let h = `<div class="tr"><span>Subtotal</span><b>${CQ.money(T.subtotal, cur)}</b></div>`;
    if (d.type === 'boq' && CQ.num(d.contingency) > 0) h += `<div class="tr"><span>Contingency (${CQ.num(d.contingency)}%)</span><b>${CQ.money(T.contingency, cur)}</b></div>`;
    if (T.discount > 0) h += `<div class="tr"><span>Discount${d.discountType === 'percent' ? ` (${CQ.num(d.discountValue)}%)` : ''}</span><b>- ${CQ.money(T.discount, cur)}</b></div>`;
    if (d.vatEnabled) h += `<div class="tr"><span>VAT (${CQ.num(d.vatRate)}%)</span><b>${CQ.money(T.vat, cur)}</b></div>`;
    h += `<div class="tr grand"><span>${d.type === 'boq' ? 'Grand total' : 'Total'}</span><span>${CQ.money(T.total, cur)}</span></div>`;
    if (d.type === 'invoice') {
      h += `<div class="tr"><span>Paid</span><b>${CQ.money(T.paid, cur)}</b></div>`;
      h += `<div class="tr bal"><span>Balance due</span><span>${CQ.money(T.balance, cur)}</span></div>`;
    }
    return h;
  }

  async function renderDoc(id) {
    const d = await DB.get('docs', id);
    if (!d) { toast('Document not found'); location.hash = '#/docs'; return; }
    setChrome({ title: `${CQ.TYPES[d.type].short} ${d.number}`, back: true, fab: false, tab: 'docs' });
    const st = CQ.statusOf(d), T = CQ.totals(d), cur = d.currency || S.currency;
    const statusSel = d.type === 'invoice' ? '' :
      `<select id="statusSel" aria-label="Status">${(d.type === 'quote' ? CQ.QUOTE_STATUSES : CQ.BOQ_STATUSES).map(s => `<option ${s === d.status ? 'selected' : ''}>${s}</option>`).join('')}</select>`;
    const source = d.sourceId ? await DB.get('docs', d.sourceId) : null;
    const derived = (await DB.all('docs')).filter(x => x.sourceId === d.id);
    const canShare = !!(navigator.canShare && window.File && navigator.canShare({ files: [new File([''], 'a.pdf', { type: 'application/pdf' })] }));

    view.innerHTML = `
      <div class="meta-strip"><div>${statusPill(st)} <span class="muted" style="font-size:13px">&nbsp;${CQ.TYPES[d.type].label}</span></div>${statusSel}</div>
      <div class="actions-grid">
        <button class="btn btn-primary" id="aPdf">${ICON.pdf}Download PDF</button>
        ${canShare ? `<button class="btn btn-blue" id="aShare">${ICON.share}Share PDF</button>` : `<button class="btn btn-blue" id="aView">${ICON.eye}Open PDF</button>`}
        <button class="btn btn-wa" id="aWa">${ICON.wa}WhatsApp</button>
        <a class="btn btn-ghost" href="#/edit/${d.id}">${ICON.edit}Edit</a>
      </div>
      ${d.type === 'invoice' ? `<div class="card"><h2>Payments</h2>
        <div class="totals">
          <div class="tr"><span>Invoice total</span><b>${CQ.money(T.total, cur)}</b></div>
          ${(d.payments || []).map(p => `<div class="tr"><span>${CQ.fmtDate(p.date)} · ${esc(p.method || 'Payment')}${p.ref ? ' · ' + esc(p.ref) : ''}</span>
            <b>${CQ.money(p.amount, cur)} <button class="mini danger" data-delpay="${p.id}" aria-label="Remove payment">${ICON.trash}</button></b></div>`).join('')}
          <div class="tr bal"><span>Balance due</span><span>${CQ.money(T.balance, cur)}</span></div>
        </div>
        <div class="btn-row" style="margin-top:12px">${T.balance > 0 ? `<button class="btn btn-blue" id="aPay">${ICON.cash}Record payment</button>` : ''}
        <button class="btn btn-line" id="aCancel">${d.status === 'Cancelled' ? 'Restore invoice' : 'Mark cancelled'}</button></div></div>` : ''}
      ${paperHTML(d)}
      <div class="section-title">More actions</div>
      <div class="btn-row">
        ${d.type === 'quote' ? `<button class="btn btn-ghost" data-convert="invoice">${ICON.convert}Convert to invoice</button>` : ''}
        ${d.type === 'boq' ? `<button class="btn btn-ghost" data-convert="quote">${ICON.convert}Create quotation</button><button class="btn btn-ghost" data-convert="invoice">${ICON.convert}Create invoice</button>` : ''}
        <button class="btn btn-line" id="aDup">${ICON.copy}Duplicate</button>
        <button class="btn btn-danger" id="aDel">${ICON.trash}Delete</button>
      </div>
      ${source || derived.length ? `<div class="section-title">Linked documents</div><div class="list">${[source, ...derived].filter(Boolean).map(docRow).join('')}</div>` : ''}
      <p class="center muted" style="font-size:12px;margin-top:20px">Last updated ${new Date(d.updatedAt).toLocaleString('en-GB')}</p>`;

    const busy = async (btn, fn) => {
      const html = btn.innerHTML; btn.disabled = true; btn.textContent = 'Preparing…';
      try { await fn(); } catch (e) { if (e && e.name !== 'AbortError') { console.error(e); toast('Could not create PDF: ' + (e.message || e)); } }
      finally { btn.disabled = false; btn.innerHTML = html; }
    };
    $('#aPdf').onclick = e => busy(e.currentTarget, async () => { await PDF.download(d, S); toast('PDF saved to Downloads'); });
    const sh = $('#aShare'); if (sh) sh.onclick = e => busy(e.currentTarget, async () => { if (!(await PDF.share(d, S))) { await PDF.download(d, S); toast('Sharing not supported – PDF downloaded instead'); } });
    const vw = $('#aView'); if (vw) vw.onclick = e => busy(e.currentTarget, async () => { const u = await PDF.previewUrl(d, S); window.open(u, '_blank'); });
    $('#aWa').onclick = () => whatsappDoc(d);
    const ss = $('#statusSel'); if (ss) ss.onchange = async () => { d.status = ss.value; d.updatedAt = new Date().toISOString(); await DB.put('docs', d); toast('Status updated'); renderDoc(d.id); };
    const pay = $('#aPay'); if (pay) pay.onclick = () => paymentSheet(d);
    const cn = $('#aCancel'); if (cn) cn.onclick = async () => { d.status = d.status === 'Cancelled' ? 'Issued' : 'Cancelled'; d.updatedAt = new Date().toISOString(); await DB.put('docs', d); renderDoc(d.id); };
    $$('[data-delpay]', view).forEach(b => b.onclick = async () => {
      if (!(await confirmSheet('Remove payment?', 'This payment will be removed from the invoice.', 'Remove', true))) return;
      d.payments = d.payments.filter(p => p.id !== b.dataset.delpay); d.updatedAt = new Date().toISOString();
      await DB.put('docs', d); renderDoc(d.id);
    });
    $$('[data-convert]', view).forEach(b => b.onclick = () => convertDoc(d, b.dataset.convert));
    $('#aDup').onclick = () => convertDoc(d, d.type, true);
    $('#aDel').onclick = async () => {
      if (!(await confirmSheet('Delete document?', `${CQ.TYPES[d.type].label} ${d.number} will be permanently deleted from this device.`, 'Delete', true))) return;
      await DB.del('docs', d.id); toast('Deleted'); location.hash = '#/docs';
    };
  }

  function waNumber(phone) {
    let p = String(phone || '').replace(/[^\d+]/g, '');
    if (p.startsWith('+')) p = p.slice(1);
    else if (p.startsWith('00')) p = p.slice(2);
    else if (p.startsWith('0')) p = '263' + p.slice(1);
    return p;
  }
  function whatsappDoc(d) {
    const T = CQ.totals(d), cur = d.currency || S.currency;
    const lines = [
      `Good day${d.client?.contact ? ' ' + d.client.contact : d.client?.name ? ' ' + d.client.name : ''},`,
      '',
      `Please find ${CQ.TYPES[d.type].label} *${d.number}*${d.project ? ` for ${d.project}` : ''} from ${S.tradingName}.`,
      `${d.type === 'boq' ? 'Grand total' : 'Total'}: *${CQ.money(T.total, cur)}*`
    ];
    if (d.type === 'invoice') lines.push(`Balance due: *${CQ.money(T.balance, cur)}*${d.dueDate ? ` by ${CQ.fmtDate(d.dueDate)}` : ''}`);
    if (d.type === 'quote' && d.validUntil) lines.push(`Valid until ${CQ.fmtDate(d.validUntil)}.`);
    lines.push('', 'The PDF copy is attached.', '', `${S.tradingName}`, `${S.phone} | ${S.email}`);
    const url = `https://wa.me/${waNumber(d.client?.phone)}?text=${encodeURIComponent(lines.join('\n'))}`;
    openSheet(`<h3>Send on WhatsApp</h3>
      <p class="muted mt0">WhatsApp links can only carry text. Download or share the PDF first, then attach it in the chat.</p>
      <div class="btn-row"><button class="btn btn-primary" id="waPdf">${ICON.pdf}1. Get PDF</button>
      <a class="btn btn-wa" href="${url}" target="_blank" rel="noopener">${ICON.wa}2. Open chat</a></div>
      ${d.client?.phone ? '' : '<p class="hint" style="margin-top:12px">No phone number on this client – WhatsApp will ask you to pick a contact.</p>'}`, sh => {
      $('#waPdf', sh).onclick = async () => { try { if (!(await PDF.share(d, S))) { await PDF.download(d, S); toast('PDF downloaded'); } } catch (e) { if (e.name !== 'AbortError') toast('Could not create PDF'); } };
    });
  }

  function paymentSheet(d) {
    const T = CQ.totals(d);
    openSheet(`<h3>Record payment</h3><form id="payForm">
      <div class="grid2"><div class="field"><label>Date</label><input type="date" name="date" value="${CQ.todayISO()}" required></div>
      <div class="field"><label>Amount (${esc(d.currency)})</label><input type="number" name="amount" step="0.01" min="0.01" inputmode="decimal" value="${T.balance.toFixed(2)}" required></div></div>
      <div class="grid2"><div class="field"><label>Method</label><select name="method">${['Bank transfer', 'Cash', 'EcoCash', 'InnBucks', 'Swipe / POS', 'Cheque', 'Other'].map(m => `<option>${m}</option>`).join('')}</select></div>
      <div class="field"><label>Reference</label><input name="ref" placeholder="Optional"></div></div>
      <button class="btn btn-primary btn-block">Save payment</button></form>`, sh => {
      $('#payForm', sh).onsubmit = async e => {
        e.preventDefault();
        const f = formData(e.target);
        if (CQ.num(f.amount) <= 0) return toast('Enter an amount');
        d.payments = d.payments || [];
        d.payments.push({ id: CQ.uid(), date: f.date, amount: CQ.round2(CQ.num(f.amount)), method: f.method, ref: f.ref });
        d.updatedAt = new Date().toISOString();
        await DB.put('docs', d); closeSheet(); toast('Payment recorded'); renderDoc(d.id);
      };
    });
  }

  async function convertDoc(src, toType, duplicate = false) {
    const now = new Date().toISOString();
    const clone = JSON.parse(JSON.stringify(src));
    const d = {
      ...clone,
      id: CQ.uid(), type: toType, number: await nextNumber(toType, true), date: CQ.todayISO(),
      status: toType === 'invoice' ? 'Issued' : 'Draft', payments: [], createdAt: now, updatedAt: now,
      sourceId: duplicate ? null : src.id
    };
    d.sections.forEach(s => { s.id = CQ.uid(); s.items.forEach(i => i.id = CQ.uid()); });
    delete d.validUntil; delete d.dueDate;
    if (toType === 'quote') d.validUntil = CQ.addDays(d.date, S.quoteValidDays);
    if (toType === 'invoice') d.dueDate = CQ.addDays(d.date, S.invoiceDueDays);
    if (src.type === 'boq' && toType !== 'boq') {
      const T = CQ.totals(src);
      if (T.contingency > 0) {
        d.sections[d.sections.length - 1].items.push(CQ.newItem({ description: `Contingency allowance (${CQ.num(src.contingency)}%)`, unit: 'Sum', qty: 1, rate: T.contingency }));
      }
      d.contingency = 0;
      if (toType === 'invoice') d.showBank = true;
    }
    if (toType !== src.type) {
      d.terms = S.terms[toType];
      if (toType === 'invoice' && src.number) d.reference = d.reference || `Ref ${src.number}`;
    }
    await DB.put('docs', d);
    if (!duplicate && src.type === 'quote' && toType === 'invoice' && ['Draft', 'Sent'].includes(src.status)) {
      src.status = 'Accepted'; src.updatedAt = now; await DB.put('docs', src);
    }
    toast(duplicate ? 'Copy created' : `${CQ.TYPES[toType].label} ${d.number} created`);
    location.hash = `#/edit/${d.id}`;
  }

  /* ---------------- editor ---------------- */
  async function renderEditor({ id, type, clientId }) {
    if (!editor || (id && editor.draft.id !== id) || (!id && !editor.isNew) || (type && editor.draft.type !== type)) {
      if (id) {
        const d = await DB.get('docs', id);
        if (!d) { location.hash = '#/docs'; return; }
        editor = { draft: JSON.parse(JSON.stringify(d)), dirty: false, isNew: false };
      } else {
        const today = CQ.todayISO();
        const d = {
          id: CQ.uid(), type, number: await nextNumber(type, false), date: today,
          status: type === 'invoice' ? 'Issued' : 'Draft',
          currency: S.currency, client: null, project: '', site: '', reference: '', intro: '',
          sections: [CQ.newSection(type === 'boq' ? 'Preliminaries & General' : '')],
          discountType: 'amount', discountValue: 0, contingency: 0,
          vatEnabled: S.vatEnabled, vatRate: S.vatRate,
          notes: '', terms: S.terms[type] || '', preparedBy: S.preparedBy, payments: [], showBank: false
        };
        if (type === 'quote') d.validUntil = CQ.addDays(today, S.quoteValidDays);
        if (type === 'invoice') d.dueDate = CQ.addDays(today, S.invoiceDueDays);
        if (clientId) { const c = await DB.get('clients', clientId); if (c) d.client = snapClient(c); }
        editor = { draft: d, dirty: false, isNew: true };
      }
    }
    const d = editor.draft;
    setChrome({ title: `${editor.isNew ? 'New' : 'Edit'} ${CQ.TYPES[d.type].short}`, back: true, fab: false, tab: 'docs' });
    const statusField = d.type === 'invoice' ? '' :
      `<div class="field"><label>Status</label><select data-f="status">${(d.type === 'quote' ? CQ.QUOTE_STATUSES : CQ.BOQ_STATUSES).map(s => `<option ${s === d.status ? 'selected' : ''}>${s}</option>`).join('')}</select></div>`;
    const dateField2 = d.type === 'quote' ? `<div class="field"><label>Valid until</label><input type="date" data-f="validUntil" value="${esc(d.validUntil)}"></div>`
      : d.type === 'invoice' ? `<div class="field"><label>Due date</label><input type="date" data-f="dueDate" value="${esc(d.dueDate)}"></div>` : statusField;

    view.innerHTML = `<div id="ed">
      <div class="card"><h2>${CQ.TYPES[d.type].label} details</h2>
        <div class="grid2"><div class="field"><label>Number</label><input data-f="number" value="${esc(d.number)}"></div>
          <div class="field"><label>Date</label><input type="date" data-f="date" value="${esc(d.date)}"></div></div>
        <div class="grid2"><div class="field"><label>Currency</label><select data-f="currency">${Object.entries(CQ.CURRENCIES).map(([k, v]) => `<option value="${k}" ${k === d.currency ? 'selected' : ''}>${k}</option>`).join('')}</select></div>
          ${dateField2}</div>
        ${d.type === 'quote' ? `<div class="grid2">${statusField}<div></div></div>` : ''}
      </div>

      <div class="card"><h2>Client &amp; project</h2>
        <div id="clientBox"></div>
        <div class="field"><label>Project / job title</label><input data-f="project" value="${esc(d.project)}" placeholder="e.g. Kitchen renovation, 4-room house"></div>
        <div class="grid2 stack"><div class="field"><label>Site / location</label><input data-f="site" value="${esc(d.site)}" placeholder="e.g. Rhodene, Masvingo"></div>
          <div class="field"><label>${d.type === 'invoice' ? 'Order no. / reference' : 'Reference'}</label><input data-f="reference" value="${esc(d.reference)}"></div></div>
        ${d.type !== 'invoice' ? `<div class="field"><label>Introduction / scope (optional)</label><textarea data-f="intro" rows="2" placeholder="Short description of the work covered">${esc(d.intro)}</textarea></div>` : ''}
      </div>

      <div class="section-title">${d.type === 'boq' ? 'Bills & measured items' : 'Line items'}</div>
      <div id="sections"></div>
      <button class="btn btn-line btn-block" id="addSec">${ICON.plus}${d.type === 'boq' ? 'Add bill' : 'Add section'}</button>

      <div class="card" style="margin-top:14px"><h2>Totals &amp; tax</h2>
        ${d.type === 'boq' ? `<div class="field"><label>Contingency (%)</label><input type="number" inputmode="decimal" step="any" min="0" data-f="contingency" value="${esc(d.contingency)}"></div>` : ''}
        <div class="grid2"><div class="field"><label>Discount type</label><select data-f="discountType"><option value="amount" ${d.discountType === 'amount' ? 'selected' : ''}>Amount</option><option value="percent" ${d.discountType === 'percent' ? 'selected' : ''}>Percentage</option></select></div>
          <div class="field"><label>Discount</label><input type="number" inputmode="decimal" step="any" min="0" data-f="discountValue" value="${esc(d.discountValue)}"></div></div>
        <label class="switch"><span><b>Charge VAT</b><br><span class="muted" style="font-size:13px">Adds VAT to the total</span></span><input type="checkbox" data-f="vatEnabled" ${d.vatEnabled ? 'checked' : ''}></label>
        <div class="field" id="vatRateField" ${d.vatEnabled ? '' : 'hidden'}><label>VAT rate (%)</label><input type="number" inputmode="decimal" step="any" min="0" data-f="vatRate" value="${esc(d.vatRate)}"></div>
        <div class="totals" id="totals"></div>
      </div>

      <div class="card"><h2>Notes &amp; terms</h2>
        <div class="field"><label>Notes (shown on document)</label><textarea data-f="notes" rows="3" placeholder="e.g. Materials to be delivered by client">${esc(d.notes)}</textarea></div>
        <div class="field"><label>Terms &amp; conditions</label><textarea data-f="terms" rows="5">${esc(d.terms)}</textarea></div>
        <div class="field"><label>Prepared / issued by</label><input data-f="preparedBy" value="${esc(d.preparedBy)}" placeholder="Name of person issuing"></div>
        ${d.type === 'boq' ? `<label class="switch"><span>Show banking details on BOQ</span><input type="checkbox" data-f="showBank" ${d.showBank ? 'checked' : ''}></label>` : ''}
      </div>

      <div class="sticky-save"><button class="btn btn-line" id="edCancel">Cancel</button><button class="btn btn-primary" id="edSave">Save ${CQ.TYPES[d.type].short}</button></div>
    </div>`;

    drawClientBox(); drawSections(); drawTotals();

    const ed = $('#ed');
    ed.addEventListener('input', onEdInput);
    ed.addEventListener('change', onEdInput);
    ed.addEventListener('click', onEdClick);
    $('#addSec').onclick = () => {
      d.sections.push(CQ.newSection(d.type === 'boq' ? '' : ''));
      editor.dirty = true; drawSections(); drawTotals();
      const inputs = $$('.sec-head input'); inputs[inputs.length - 1]?.focus();
    };
    $('#edCancel').onclick = () => history.back();
    $('#edSave').onclick = saveEditor;
  }

  function snapClient(c) { return { id: c.id, name: c.name, contact: c.contact || '', phone: c.phone || '', email: c.email || '', address: c.address || '', vatNo: c.vatNo || '' }; }

  function drawClientBox() {
    const c = editor.draft.client;
    $('#clientBox').innerHTML = c
      ? `<div class="row" style="border:1px solid var(--line);border-radius:12px;margin-bottom:12px" data-act="pickClient">
          <div class="badge-ic ic-quote">${ICON.user}</div><div class="main"><div class="t1">${esc(c.name)}</div><div class="t2">${esc([c.contact, c.phone, c.address].filter(Boolean).join(' · ') || 'Tap to change')}</div></div>
          <span class="btn btn-ghost btn-sm">Change</span></div>`
      : `<button class="btn btn-ghost btn-block" data-act="pickClient" style="margin-bottom:12px">${ICON.user}Choose or add client</button>`;
  }

  function drawSections() {
    const d = editor.draft, multi = d.sections.length > 1 || d.type === 'boq';
    $('#sections').innerHTML = d.sections.map((s, si) => `
      <div class="sec" data-si="${si}">
        ${multi || s.title ? `<div class="sec-head"><span class="num">${d.type === 'boq' ? 'Bill ' + (si + 1) : si + 1 + '.'}</span>
          <input data-sf="title" data-s="${si}" value="${esc(s.title)}" placeholder="${d.type === 'boq' ? 'Bill title e.g. Substructure' : 'Section title (optional)'}">
          <button class="mini" data-act="secMenu" data-s="${si}" aria-label="Section options">${ICON.more}</button></div>` : ''}
        ${s.items.map((it, ii) => lineHTML(si, ii, it, multi, d.currency)).join('')}
        <div class="sec-foot">
          <div class="btn-row" style="flex:1"><button class="btn btn-ghost btn-sm" data-act="addLine" data-s="${si}">${ICON.plus}Add line</button>
          <button class="btn btn-line btn-sm" data-act="fromList" data-s="${si}">${ICON.box}From price list</button></div>
          ${multi ? `<div class="sub" data-subtotal="${si}">${CQ.money(CQ.sectionTotal(s), d.currency)}</div>` : ''}
        </div>
      </div>`).join('');
    requestAnimationFrame(() => $$('#sections textarea').forEach(autoGrow));
  }

  function lineHTML(si, ii, it, multi, cur) {
    return `<div class="line" data-s="${si}" data-i="${ii}">
      <div class="l-top"><div class="l-no">${multi ? `${si + 1}.${ii + 1}` : ii + 1}</div>
        <textarea rows="2" data-lf="description" data-s="${si}" data-i="${ii}" placeholder="Description of work / material">${esc(it.description)}</textarea>
        <button class="mini" data-act="lineMenu" data-s="${si}" data-i="${ii}" aria-label="Line options">${ICON.more}</button></div>
      <div class="l-nums">
        <div><label>Qty</label><input type="number" inputmode="decimal" step="any" data-lf="qty" data-s="${si}" data-i="${ii}" value="${esc(it.qty)}"></div>
        <div><label>Unit</label><input list="unitList" data-lf="unit" data-s="${si}" data-i="${ii}" value="${esc(it.unit)}"></div>
        <div><label>Rate</label><input type="number" inputmode="decimal" step="any" data-lf="rate" data-s="${si}" data-i="${ii}" value="${esc(it.rate)}"></div>
        <div class="l-amt" data-amt="${si}-${ii}">${CQ.money(CQ.lineAmount(it), cur)}</div>
      </div></div>`;
  }

  function drawTotals() {
    const d = editor.draft;
    $('#totals').innerHTML = totalsRows(d, CQ.totals(d), d.currency);
    d.sections.forEach((s, si) => {
      const el = document.querySelector(`[data-subtotal="${si}"]`); if (el) el.textContent = CQ.money(CQ.sectionTotal(s), d.currency);
      s.items.forEach((it, ii) => { const a = document.querySelector(`[data-amt="${si}-${ii}"]`); if (a) a.textContent = CQ.money(CQ.lineAmount(it), d.currency); });
    });
  }

  function onEdInput(e) {
    const el = e.target, d = editor.draft;
    if (el.dataset.f) {
      const f = el.dataset.f;
      d[f] = el.type === 'checkbox' ? el.checked : el.value;
      if (f === 'vatEnabled') $('#vatRateField').hidden = !el.checked;
      if (f === 'date' && e.type === 'change') {
        if (d.type === 'quote') { d.validUntil = CQ.addDays(d.date, S.quoteValidDays); const v = $('[data-f=validUntil]'); if (v) v.value = d.validUntil; }
        if (d.type === 'invoice') { d.dueDate = CQ.addDays(d.date, S.invoiceDueDays); const v = $('[data-f=dueDate]'); if (v) v.value = d.dueDate; }
      }
    } else if (el.dataset.lf) {
      d.sections[+el.dataset.s].items[+el.dataset.i][el.dataset.lf] = el.value;
      if (el.tagName === 'TEXTAREA') autoGrow(el);
    } else if (el.dataset.sf) {
      d.sections[+el.dataset.s].title = el.value;
    } else return;
    editor.dirty = true;
    drawTotals();
  }
  function autoGrow(t) { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight + 2, 240) + 'px'; }

  function onEdClick(e) {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const d = editor.draft, si = +b.dataset.s, ii = +b.dataset.i;
    switch (b.dataset.act) {
      case 'pickClient': return clientPicker();
      case 'addLine':
        d.sections[si].items.push(CQ.newItem({ unit: d.type === 'boq' ? 'm²' : 'Item' }));
        editor.dirty = true; drawSections(); drawTotals();
        $$(`.line[data-s="${si}"] textarea`).pop()?.focus();
        return;
      case 'fromList': return itemPicker(si);
      case 'lineMenu': return lineMenu(si, ii);
      case 'secMenu': return sectionMenu(si);
    }
  }

  function lineMenu(si, ii) {
    const d = editor.draft, items = d.sections[si].items, it = items[ii];
    openSheet(`<h3>Line ${ii + 1}</h3><div class="list pick-list">
      ${ii > 0 ? `<button class="row" data-m="up">Move up</button>` : ''}
      ${ii < items.length - 1 ? `<button class="row" data-m="down">Move down</button>` : ''}
      ${d.sections.length > 1 ? `<button class="row" data-m="move">Move to another ${d.type === 'boq' ? 'bill' : 'section'}</button>` : ''}
      <button class="row" data-m="dup">Duplicate line</button>
      <button class="row" data-m="save">Save to price list</button>
      <button class="row" data-m="del" style="color:var(--red)">Delete line</button></div>`, sh => {
      sh.onclick = async e => {
        const m = e.target.closest('[data-m]')?.dataset.m; if (!m) return;
        if (m === 'up') [items[ii - 1], items[ii]] = [items[ii], items[ii - 1]];
        if (m === 'down') [items[ii + 1], items[ii]] = [items[ii], items[ii + 1]];
        if (m === 'dup') items.splice(ii + 1, 0, { ...it, id: CQ.uid() });
        if (m === 'del') { items.splice(ii, 1); if (!items.length) items.push(CQ.newItem()); }
        if (m === 'move') {
          return openSheet(`<h3>Move to…</h3><div class="list pick-list">${d.sections.map((s, k) => k === si ? '' : `<button class="row" data-k="${k}">${d.type === 'boq' ? 'Bill ' + (k + 1) : 'Section ' + (k + 1)}${s.title ? ' – ' + esc(s.title) : ''}</button>`).join('')}</div>`, sh2 => {
            sh2.onclick = ev => {
              const k = ev.target.closest('[data-k]'); if (!k) return;
              items.splice(ii, 1); if (!items.length) items.push(CQ.newItem());
              d.sections[+k.dataset.k].items.push(it);
              editor.dirty = true; closeSheet(); drawSections(); drawTotals();
            };
          });
        }
        if (m === 'save') {
          if (!it.description.trim()) { closeSheet(); return toast('Add a description first'); }
          await DB.put('items', { id: CQ.uid(), description: it.description.trim(), unit: it.unit, rate: CQ.num(it.rate), category: d.sections[si].title || '' });
          closeSheet(); return toast('Saved to price list');
        }
        editor.dirty = true; closeSheet(); drawSections(); drawTotals();
      };
    });
  }

  function sectionMenu(si) {
    const d = editor.draft, secs = d.sections, lbl = d.type === 'boq' ? 'bill' : 'section';
    openSheet(`<h3>${d.type === 'boq' ? 'Bill ' + (si + 1) : 'Section ' + (si + 1)}</h3><div class="list pick-list">
      ${!secs[si].title && secs.length === 1 && d.type !== 'boq' ? `<button class="row" data-m="title">Add a section title</button>` : ''}
      ${si > 0 ? `<button class="row" data-m="up">Move ${lbl} up</button>` : ''}
      ${si < secs.length - 1 ? `<button class="row" data-m="down">Move ${lbl} down</button>` : ''}
      <button class="row" data-m="dup">Duplicate ${lbl}</button>
      ${secs.length > 1 ? `<button class="row" data-m="del" style="color:var(--red)">Delete ${lbl} and its lines</button>` : ''}</div>`, sh => {
      sh.onclick = e => {
        const m = e.target.closest('[data-m]')?.dataset.m; if (!m) return;
        if (m === 'title') secs[si].title = 'Section 1';
        if (m === 'up') [secs[si - 1], secs[si]] = [secs[si], secs[si - 1]];
        if (m === 'down') [secs[si + 1], secs[si]] = [secs[si], secs[si + 1]];
        if (m === 'dup') { const c = JSON.parse(JSON.stringify(secs[si])); c.id = CQ.uid(); c.items.forEach(i => i.id = CQ.uid()); c.title = (c.title || '') + ' (copy)'; secs.splice(si + 1, 0, c); }
        if (m === 'del') secs.splice(si, 1);
        editor.dirty = true; closeSheet(); drawSections(); drawTotals();
      };
    });
  }

  async function clientPicker() {
    const clients = (await DB.all('clients')).sort((a, b) => a.name.localeCompare(b.name));
    openSheet(`<h3>Choose client</h3>
      <div class="search" style="margin-bottom:10px">${ICON.search}<input type="search" id="cq" placeholder="Search clients" data-noautofocus="1"></div>
      <button class="btn btn-ghost btn-block" id="newCl" style="margin-bottom:10px">${ICON.plus}New client</button>
      <div class="list pick-list" id="clList"></div>`, sh => {
      const draw = q => {
        const l = clients.filter(c => !q || [c.name, c.contact, c.phone].join(' ').toLowerCase().includes(q.toLowerCase()));
        $('#clList', sh).innerHTML = l.length ? l.map(c => `<button class="row" data-id="${c.id}"><div class="main"><div class="t1">${esc(c.name)}</div><div class="t2">${esc([c.contact, c.phone].filter(Boolean).join(' · '))}</div></div></button>`).join('')
          : `<div class="empty">No clients yet.</div>`;
      };
      draw('');
      $('#cq', sh).oninput = e => draw(e.target.value);
      $('#clList', sh).onclick = e => {
        const r = e.target.closest('[data-id]'); if (!r) return;
        editor.draft.client = snapClient(clients.find(c => c.id === r.dataset.id));
        editor.dirty = true; closeSheet(); drawClientBox();
      };
      $('#newCl', sh).onclick = () => clientSheet(null, c => { editor.draft.client = snapClient(c); editor.dirty = true; drawClientBox(); });
    });
  }

  async function itemPicker(si) {
    const items = (await DB.all('items')).sort((a, b) => (a.category || '').localeCompare(b.category || '') || a.description.localeCompare(b.description));
    const picked = new Set();
    openSheet(`<h3>Add from price list</h3>
      <div class="search" style="margin-bottom:10px">${ICON.search}<input type="search" id="iq" placeholder="Search items" data-noautofocus="1"></div>
      <div class="list pick-list" id="itList" style="max-height:48vh;overflow:auto"></div>
      <button class="btn btn-primary btn-block" id="addPicked" style="margin-top:12px" disabled>Add selected</button>`, sh => {
      const draw = q => {
        const l = items.filter(i => !q || [i.description, i.category].join(' ').toLowerCase().includes(q.toLowerCase()));
        $('#itList', sh).innerHTML = l.length ? l.map(i => `<button class="row" data-id="${i.id}" style="${picked.has(i.id) ? 'background:var(--tint)' : ''}">
          <div class="main"><div class="t1">${picked.has(i.id) ? '✓ ' : ''}${esc(i.description)}</div><div class="t2">${esc(i.category || 'General')} · per ${esc(i.unit)}</div></div>
          <div class="end amt">${CQ.money(i.rate, editor.draft.currency)}</div></button>`).join('')
          : `<div class="empty">${items.length ? 'No match.' : 'Your price list is empty. Add items in the Price List tab, or use “Save to price list” on any line.'}</div>`;
      };
      draw('');
      $('#iq', sh).oninput = e => draw(e.target.value);
      $('#itList', sh).onclick = e => {
        const r = e.target.closest('[data-id]'); if (!r) return;
        picked.has(r.dataset.id) ? picked.delete(r.dataset.id) : picked.add(r.dataset.id);
        $('#addPicked', sh).disabled = !picked.size;
        $('#addPicked', sh).textContent = picked.size ? `Add ${picked.size} item${picked.size > 1 ? 's' : ''}` : 'Add selected';
        draw($('#iq', sh).value);
      };
      $('#addPicked', sh).onclick = () => {
        const sec = editor.draft.sections[si];
        const blank = sec.items.length === 1 && !sec.items[0].description && !CQ.num(sec.items[0].rate);
        if (blank) sec.items = [];
        items.filter(i => picked.has(i.id)).forEach(i => sec.items.push(CQ.newItem({ description: i.description, unit: i.unit, rate: i.rate, qty: 1 })));
        editor.dirty = true; closeSheet(); drawSections(); drawTotals();
      };
    });
  }

  async function saveEditor() {
    const d = editor.draft;
    if (!d.client || !d.client.name) { toast('Please choose a client'); $('#clientBox').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    if (!d.number.trim()) { toast('Document number is required'); return; }
    const dup = (await DB.all('docs')).find(x => x.id !== d.id && x.type === d.type && x.number.trim().toLowerCase() === d.number.trim().toLowerCase());
    if (dup) { toast(`Number ${d.number} is already used`); return; }
    d.sections.forEach(s => {
      s.items = s.items.filter(i => i.description.trim() || CQ.num(i.rate) || CQ.num(i.qty) !== 1);
      s.items.forEach(i => { i.qty = CQ.num(i.qty); i.rate = CQ.num(i.rate); });
    });
    d.sections = d.sections.filter((s, i) => s.items.length || s.title || i === 0);
    d.sections.forEach(s => { if (!s.items.length) s.items.push(CQ.newItem()); });
    ['discountValue', 'contingency', 'vatRate'].forEach(k => d[k] = CQ.num(d[k]));
    d.number = d.number.trim();
    const now = new Date().toISOString();
    if (editor.isNew) {
      d.createdAt = now;
      // commit counter when number follows auto pattern
      const auto = await nextNumber(d.type, false);
      if (d.number === auto) await nextNumber(d.type, true);
    }
    d.updatedAt = now;
    await DB.put('docs', d);
    const id = d.id;
    editor = null;
    toast('Saved');
    location.hash = `#/doc/${id}`;
  }

  /* ---------------- clients ---------------- */
  async function renderClients() {
    setChrome({ title: 'Clients', tab: 'clients' });
    const clients = (await DB.all('clients')).sort((a, b) => a.name.localeCompare(b.name));
    const docs = await DB.all('docs');
    view.innerHTML = `<div class="toolbar"><div class="search">${ICON.search}<input type="search" id="q" placeholder="Search clients"></div></div><div id="clList"></div>`;
    const draw = q => {
      const l = clients.filter(c => !q || [c.name, c.contact, c.phone, c.email].join(' ').toLowerCase().includes(q.toLowerCase()));
      $('#clList').innerHTML = l.length ? `<div class="list">${l.map(c => {
        const mine = docs.filter(d => d.client?.id === c.id);
        const bal = mine.filter(d => d.type === 'invoice' && CQ.statusOf(d) !== 'Cancelled').reduce((a, d) => a + Math.max(0, CQ.totals(d).balance), 0);
        return `<a class="row" href="#/client/${c.id}"><div class="badge-ic ic-quote">${esc(initials(c.name))}</div>
          <div class="main"><div class="t1">${esc(c.name)}</div><div class="t2">${esc([c.contact, c.phone].filter(Boolean).join(' · ') || c.email || '')}</div></div>
          <div class="end"><div class="t2">${mine.length} doc${mine.length === 1 ? '' : 's'}</div>${bal > 0 ? `<div class="amt" style="color:var(--amber)">${CQ.money(bal, S.currency)}</div>` : ''}</div></a>`;
      }).join('')}</div>`
        : `<div class="card empty">${ICON.user}<div><b>${clients.length ? 'No match' : 'No clients yet'}</b></div><div>${clients.length ? '' : 'Tap + to add your first client.'}</div></div>`;
    };
    draw('');
    $('#q').oninput = e => draw(e.target.value);
  }
  const initials = n => n.split(/\s+/).filter(w => /[a-z0-9]/i.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';

  function clientFields(c = {}) {
    return `<div class="field"><label>Client / company name *</label><input name="name" value="${esc(c.name)}" required></div>
      <div class="grid2 stack"><div class="field"><label>Contact person</label><input name="contact" value="${esc(c.contact)}"></div>
        <div class="field"><label>Phone / WhatsApp</label><input name="phone" type="tel" value="${esc(c.phone)}" placeholder="+263 7…"></div></div>
      <div class="grid2 stack"><div class="field"><label>Email</label><input name="email" type="email" value="${esc(c.email)}"></div>
        <div class="field"><label>VAT / TIN number</label><input name="vatNo" value="${esc(c.vatNo)}"></div></div>
      <div class="field"><label>Address</label><textarea name="address" rows="2">${esc(c.address)}</textarea></div>
      <div class="field"><label>Private notes</label><textarea name="notes" rows="2" placeholder="Not shown on documents">${esc(c.notes)}</textarea></div>`;
  }

  function clientSheet(c = null, onSaved) {
    openSheet(`<h3>${c ? 'Edit client' : 'New client'}</h3><form id="clForm">${clientFields(c || {})}<button class="btn btn-primary btn-block">Save client</button></form>`, sh => {
      $('#clForm', sh).onsubmit = async e => {
        e.preventDefault();
        const f = formData(e.target);
        if (!f.name) return toast('Name is required');
        const obj = { ...(c || {}), ...f, id: c?.id || CQ.uid(), updatedAt: new Date().toISOString() };
        await DB.put('clients', obj);
        closeSheet(); toast('Client saved');
        if (onSaved) onSaved(obj); else if (location.hash.startsWith('#/clients')) renderClients();
      };
    });
  }

  async function renderClient(id) {
    const c = await DB.get('clients', id);
    if (!c) { location.hash = '#/clients'; return; }
    setChrome({ title: c.name, back: true, fab: false, tab: 'clients' });
    const docs = (await DB.all('docs')).filter(d => d.client?.id === c.id).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const bal = docs.filter(d => d.type === 'invoice' && CQ.statusOf(d) !== 'Cancelled').reduce((a, d) => a + Math.max(0, CQ.totals(d).balance), 0);
    view.innerHTML = `
      <div class="card"><form id="clForm">${clientFields(c)}
        <label class="switch"><span>Update this client on existing documents</span><input type="checkbox" name="propagate"></label>
        <div class="btn-row"><button class="btn btn-primary">Save changes</button><button type="button" class="btn btn-danger" id="clDel">${ICON.trash}Delete</button></div></form></div>
      <div class="btn-row" style="margin-bottom:6px">
        <a class="btn btn-ghost" href="#/new/quote?client=${c.id}">${ICON.plus}Quote</a>
        <a class="btn btn-ghost" href="#/new/invoice?client=${c.id}">${ICON.plus}Invoice</a>
        <a class="btn btn-ghost" href="#/new/boq?client=${c.id}">${ICON.plus}BOQ</a></div>
      <div class="section-title">Documents (${docs.length})${bal > 0 ? `<span style="color:var(--amber);text-transform:none">Owing ${CQ.money(bal, S.currency)}</span>` : ''}</div>
      ${docs.length ? `<div class="list">${docs.map(docRow).join('')}</div>` : `<div class="card empty">No documents for this client yet.</div>`}`;
    $('#clForm').onsubmit = async e => {
      e.preventDefault();
      const f = formData(e.target); const propagate = f.propagate; delete f.propagate;
      if (!f.name) return toast('Name is required');
      Object.assign(c, f, { updatedAt: new Date().toISOString() });
      await DB.put('clients', c);
      if (propagate) for (const d of docs) { d.client = snapClient(c); await DB.put('docs', d); }
      toast('Client saved'); renderClient(c.id);
    };
    $('#clDel').onclick = async () => {
      if (!(await confirmSheet('Delete client?', 'Existing documents keep a copy of the client details.', 'Delete', true))) return;
      await DB.del('clients', c.id); toast('Client deleted'); location.hash = '#/clients';
    };
  }

  /* ---------------- price list ---------------- */
  async function renderItems() {
    setChrome({ title: 'Price List', tab: 'items' });
    const items = (await DB.all('items')).sort((a, b) => (a.category || '').localeCompare(b.category || '') || a.description.localeCompare(b.description));
    view.innerHTML = `<div class="toolbar"><div class="search">${ICON.search}<input type="search" id="q" placeholder="Search items & services"></div></div>
      <p class="hint" style="margin:0 2px 12px">Save the materials, labour and services you price often. Pick them when building a quote, invoice or BOQ.</p><div id="itList"></div>`;
    const draw = q => {
      const l = items.filter(i => !q || [i.description, i.category, i.unit].join(' ').toLowerCase().includes(q.toLowerCase()));
      if (!l.length) { $('#itList').innerHTML = `<div class="card empty">${ICON.box}<div><b>${items.length ? 'No match' : 'No items yet'}</b></div><div>${items.length ? '' : 'Tap + to add your first item.'}</div></div>`; return; }
      const groups = {};
      l.forEach(i => (groups[i.category || 'General'] = groups[i.category || 'General'] || []).push(i));
      $('#itList').innerHTML = Object.entries(groups).map(([g, arr]) => `<div class="section-title">${esc(g)}</div><div class="list">${arr.map(i => `
        <button class="row" data-id="${i.id}"><div class="main"><div class="t1">${esc(i.description)}</div><div class="t2">per ${esc(i.unit)}</div></div><div class="end amt">${CQ.money(i.rate, S.currency)}</div></button>`).join('')}</div>`).join('');
    };
    draw('');
    $('#q').oninput = e => draw(e.target.value);
    $('#itList').onclick = e => { const r = e.target.closest('[data-id]'); if (r) itemSheet(items.find(i => i.id === r.dataset.id)); };
  }

  async function itemSheet(it = null) {
    const cats = [...new Set((await DB.all('items')).map(i => i.category).filter(Boolean))];
    openSheet(`<h3>${it ? 'Edit item' : 'New price list item'}</h3><form id="itForm">
      <div class="field"><label>Description *</label><textarea name="description" rows="2" required>${esc(it?.description)}</textarea></div>
      <div class="grid2"><div class="field"><label>Unit</label><input name="unit" list="unitList" value="${esc(it?.unit || 'Item')}"></div>
        <div class="field"><label>Rate (${esc(S.currency)})</label><input name="rate" type="number" step="any" inputmode="decimal" value="${esc(it?.rate ?? '')}"></div></div>
      <div class="field"><label>Category</label><input name="category" list="catList" value="${esc(it?.category)}" placeholder="e.g. Materials, Labour, Plumbing"><datalist id="catList">${cats.map(c => `<option value="${esc(c)}">`).join('')}</datalist></div>
      <div class="btn-row"><button class="btn btn-primary">Save item</button>${it ? `<button type="button" class="btn btn-danger" id="itDel">${ICON.trash}Delete</button>` : ''}</div></form>`, sh => {
      $('#itForm', sh).onsubmit = async e => {
        e.preventDefault();
        const f = formData(e.target);
        if (!f.description) return toast('Description is required');
        await DB.put('items', { ...(it || {}), ...f, rate: CQ.num(f.rate), id: it?.id || CQ.uid() });
        closeSheet(); toast('Item saved'); renderItems();
      };
      const del = $('#itDel', sh); if (del) del.onclick = async () => { await DB.del('items', it.id); closeSheet(); toast('Item deleted'); renderItems(); };
    });
  }

  /* ---------------- settings ---------------- */
  async function renderSettings() {
    setChrome({ title: 'Settings', tab: 'settings', fab: false });
    let est = '';
    try { if (navigator.storage?.estimate) { const e = await navigator.storage.estimate(); est = `${(e.usage / 1048576).toFixed(1)} MB used on this device`; } } catch (e) { }
    let persisted = false; try { persisted = await navigator.storage?.persisted?.(); } catch (e) { }
    view.innerHTML = `<form id="setForm">
      <div class="card"><h2>Company details</h2>
        <div class="logo-preview"><img src="${esc(logoSrc())}" alt="Logo" id="logoPrev"></div>
        <div class="btn-row" style="margin-bottom:14px"><label class="btn btn-line btn-sm" style="flex:1">Change logo<input type="file" accept="image/*" id="logoFile" hidden></label>
          ${S.logo ? `<button type="button" class="btn btn-line btn-sm" id="logoReset">Use approved logo</button>` : ''}</div>
        <div class="field"><label>Registered company name</label><input name="companyName" value="${esc(S.companyName)}"></div>
        <div class="field"><label>Trading name</label><input name="tradingName" value="${esc(S.tradingName)}"></div>
        <div class="field"><label>Address</label><input name="address" value="${esc(S.address)}"></div>
        <div class="grid2 stack"><div class="field"><label>Phone / WhatsApp</label><input name="phone" value="${esc(S.phone)}"></div>
          <div class="field"><label>Email</label><input name="email" value="${esc(S.email)}"></div></div>
        <div class="field"><label>Website</label><input name="website" value="${esc(S.website)}"></div>
        <div class="grid3"><div class="field"><label>Reg. No.</label><input name="regNo" value="${esc(S.regNo)}"></div>
          <div class="field"><label>TIN</label><input name="tin" value="${esc(S.tin)}"></div>
          <div class="field"><label>VAT No.</label><input name="vatNo" value="${esc(S.vatNo)}"></div></div>
      </div>
      <div class="card"><h2>Banking details</h2>
        <div class="field"><textarea name="bank" rows="6">${esc(S.bank)}</textarea></div>
        <p class="hint">Printed on quotations and invoices.</p></div>
      <div class="card"><h2>Defaults</h2>
        <div class="grid2"><div class="field"><label>Currency</label><select name="currency">${Object.entries(CQ.CURRENCIES).map(([k, v]) => `<option value="${k}" ${k === S.currency ? 'selected' : ''}>${k} – ${v.name}</option>`).join('')}</select></div>
          <div class="field"><label>VAT rate (%)</label><input name="vatRate" type="number" step="any" value="${esc(S.vatRate)}"></div></div>
        <label class="switch"><span>Charge VAT on new documents</span><input type="checkbox" name="vatEnabled" ${S.vatEnabled ? 'checked' : ''}></label>
        <div class="grid2"><div class="field"><label>Quote valid for (days)</label><input name="quoteValidDays" type="number" value="${esc(S.quoteValidDays)}"></div>
          <div class="field"><label>Invoice due in (days)</label><input name="invoiceDueDays" type="number" value="${esc(S.invoiceDueDays)}"></div></div>
        <div class="field"><label>Default "prepared by" name</label><input name="preparedBy" value="${esc(S.preparedBy)}"></div></div>
      <div class="card"><h2>Numbering</h2>
        ${['quote', 'invoice', 'boq'].map(t => `<div class="grid2"><div class="field"><label>${CQ.TYPES[t].short} prefix</label><input name="prefix_${t}" value="${esc(S.prefixes[t])}"></div>
          <div class="field"><label>Last number used</label><input name="counter_${t}" type="number" min="0" value="${esc(S.counters[t])}"></div></div>`).join('')}
        <p class="hint">Numbers look like ${esc(formatNumber('invoice', (S.counters.invoice || 0) + 1))}.</p></div>
      <div class="card"><h2>Default terms</h2>
        ${['quote', 'invoice', 'boq'].map(t => `<div class="field"><label>${CQ.TYPES[t].label}</label><textarea name="terms_${t}" rows="4">${esc(S.terms[t])}</textarea></div>`).join('')}</div>
      <div class="sticky-save"><button class="btn btn-primary">Save settings</button></div>
    </form>
    <div class="card"><h2>Backup &amp; restore</h2>
      <p class="muted mt0">All data is stored only on this device${est ? ` (${est})` : ''}. Export a backup regularly and keep it on Google Drive, email or a computer.${S.lastBackupAt ? ` <br>Last backup: <b>${new Date(S.lastBackupAt).toLocaleString('en-GB')}</b>` : ''}</p>
      <div class="btn-row"><button class="btn btn-blue" id="bkExport">${ICON.pdf}Export backup</button>
        <label class="btn btn-line">Restore backup<input type="file" accept="application/json,.json" id="bkImport" hidden></label></div>
      <p class="hint" style="margin-top:12px">Storage protection: <b>${persisted ? 'on' : 'standard'}</b>${persisted ? '' : ' – <a href="#" id="persistBtn">request protection</a>'}</p></div>
    <div class="card"><h2>About this app</h2>
      <p class="mt0">Crafted Quarters Docs <span class="muted">· version ${APP_VERSION} · works fully offline</span></p>
      <p class="muted">Quotations, invoices and bills of quantities for ${esc(S.companyName)}, ${esc(S.address)}.</p>
      <div class="dev-box">
        <div class="lbl">Developed by</div>
        <b>${DEVELOPER.name}</b>
        <div class="muted" style="font-size:13px">For support, changes or a system for your own business:</div>
        <div class="btn-row" style="margin-top:10px">
          <a class="btn btn-line btn-sm" href="tel:${DEVELOPER.phone.replace(/\s/g, '')}">${DEVELOPER.phone}</a>
          <a class="btn btn-line btn-sm" href="mailto:${DEVELOPER.email}">${DEVELOPER.email}</a>
          <a class="btn btn-line btn-sm" href="${DEVELOPER.web}" target="_blank" rel="noopener">${DEVELOPER.webLabel}</a>
        </div>
      </div>
      ${installPrompt ? `<button class="btn btn-blue btn-block" id="installBtn" style="margin-top:12px">Install app</button>` : ''}</div>
    ${devCredit()}`;

    $('#setForm').onsubmit = async e => {
      e.preventDefault();
      const f = formData(e.target);
      ['companyName', 'tradingName', 'address', 'phone', 'email', 'website', 'regNo', 'tin', 'vatNo', 'bank', 'currency', 'preparedBy', 'vatEnabled'].forEach(k => S[k] = f[k]);
      S.bank = $('[name=bank]').value; // keep line breaks/spacing
      S.vatRate = CQ.num(f.vatRate); S.quoteValidDays = parseInt(f.quoteValidDays) || 0; S.invoiceDueDays = parseInt(f.invoiceDueDays) || 0;
      ['quote', 'invoice', 'boq'].forEach(t => {
        S.prefixes[t] = f['prefix_' + t] || S.prefixes[t];
        S.counters[t] = Math.max(0, parseInt(f['counter_' + t]) || 0);
        S.terms[t] = $(`[name=terms_${t}]`).value;
      });
      S.whatsapp = S.phone;
      await saveSettings(); toast('Settings saved');
    };
    $('#logoFile').onchange = async e => {
      const file = e.target.files[0]; if (!file) return;
      S.logo = await resizeImage(file, 900); await saveSettings(); toast('Logo updated'); renderSettings();
    };
    const lr = $('#logoReset'); if (lr) lr.onclick = async () => { S.logo = null; await saveSettings(); renderSettings(); };
    $('#bkExport').onclick = async () => {
      S.lastBackupAt = new Date().toISOString(); await saveSettings();
      const data = await DB.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
      const name = `crafted-quarters-backup-${CQ.todayISO()}.json`;
      const file = new File([blob], name, { type: 'application/json' });
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] }) && /Android|iPhone|iPad/i.test(navigator.userAgent)) { await navigator.share({ files: [file], title: name }); return; }
      } catch (e) { if (e.name === 'AbortError') return; }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
      toast('Backup saved to Downloads');
    };
    $('#bkImport').onchange = async e => {
      const file = e.target.files[0]; if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        const n = (data.docs || []).length;
        if (!(await confirmSheet('Restore backup?', `This replaces everything on this device with the backup (${n} documents, ${(data.clients || []).length} clients).`, 'Restore', true))) return;
        await DB.importAll(data); await loadSettings(); toast('Backup restored'); renderSettings();
      } catch (err) { toast(err.message || 'Could not read backup'); }
    };
    const pb = $('#persistBtn'); if (pb) pb.onclick = async e => { e.preventDefault(); const ok = await navigator.storage?.persist?.(); toast(ok ? 'Storage protection on' : 'Browser declined – install the app to enable'); renderSettings(); };
    const ib = $('#installBtn'); if (ib) ib.onclick = doInstall;
  }

  function resizeImage(file, max) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => {
        const img = new Image();
        img.onload = () => {
          const k = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.9));
        };
        img.onerror = reject; img.src = r.result;
      };
      r.onerror = reject; r.readAsDataURL(file);
    });
  }

  /* ---------------- install / offline ---------------- */
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; });
  async function doInstall() {
    if (!installPrompt) return;
    installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; route();
  }
  const netState = () => { $('#offlinePill').hidden = navigator.onLine; };
  window.addEventListener('online', netState); window.addEventListener('offline', netState);

  /* ---------------- boot ---------------- */
  async function boot() {
    const dl = document.createElement('datalist'); dl.id = 'unitList';
    dl.innerHTML = CQ.UNITS.map(u => `<option value="${u}">`).join(''); document.body.appendChild(dl);
    await loadSettings();
    netState();
    try { if (navigator.storage?.persist) navigator.storage.persist(); } catch (e) { }
    await route();
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('sw.js').then(reg => {
        reg.addEventListener('updatefound', () => {
          const w = reg.installing;
          w && w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) toast('App updated – restart to use the latest version', 5000); });
        });
      }).catch(err => console.warn('SW registration failed', err));
    }
  }
  window.addEventListener('beforeunload', e => { if (editor && editor.dirty) { e.preventDefault(); e.returnValue = ''; } });
  boot();
})();
