/* Crafted Quarters – branded PDF generation (jsPDF + AutoTable, fully offline) */
const PDF = (() => {
  const NAVY = [3, 58, 117];
  const BLUE = [10, 108, 214];
  const LIGHT = [234, 241, 251];
  const SECTION = [214, 228, 247];
  const TEXT = [33, 41, 54];
  const MUTED = [98, 110, 128];

  let logoCache = { src: null, data: null, w: 0, h: 0 };

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  async function getLogo(settings) {
    const src = settings.logo || 'assets/logo-pdf.jpg';
    if (logoCache.src === src && logoCache.data) return logoCache;
    const img = await loadImage(src);
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0);
    logoCache = { src, data: c.toDataURL('image/jpeg', 0.92), w: c.width, h: c.height };
    return logoCache;
  }

  // Standard PDF fonts cannot draw superscripts; write m2 / m3 instead.
  const safe = t => String(t ?? '').replace(/²/g, '2').replace(/³/g, '3').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');

  function fileName(doc) {
    const client = (doc.client && doc.client.name ? doc.client.name : '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 30);
    return `${doc.number}${client ? '_' + client : ''}.pdf`;
  }

  async function build(doc, settings) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();
    const M = 14;
    const cur = doc.currency || settings.currency || 'USD';
    const T = CQ.totals(doc);
    const type = CQ.TYPES[doc.type];
    const isBoq = doc.type === 'boq';
    const isInv = doc.type === 'invoice';

    pdf.setProperties({ title: `${type.label} ${doc.number}`, author: settings.companyName, creator: 'Crafted Quarters Docs' });

    // ---------- Header ----------
    pdf.setFillColor(...NAVY); pdf.rect(0, 0, W, 4, 'F');
    pdf.setFillColor(...BLUE); pdf.rect(0, 4, W, 1.2, 'F');

    let logoH = 0;
    try {
      const L = await getLogo(settings);
      const lw = 62, lh = Math.min(26, lw * L.h / L.w);
      const realW = lh * L.w / L.h;
      pdf.addImage(L.data, 'JPEG', M, 10, realW, lh);
      logoH = lh;
    } catch (e) { /* logo optional */ }

    pdf.setTextColor(...TEXT);
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10.5);
    pdf.text(settings.companyName || '', W - M, 13, { align: 'right' });
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(...MUTED);
    const contact = [
      settings.address,
      `Tel / WhatsApp: ${settings.phone}`,
      settings.email + (settings.website ? '  |  ' + settings.website : ''),
      [settings.regNo && `Reg No: ${settings.regNo}`, settings.tin && `TIN: ${settings.tin}`, settings.vatNo && `VAT No: ${settings.vatNo}`].filter(Boolean).join('  |  ')
    ].filter(Boolean);
    let cy = 18;
    contact.forEach(line => { pdf.text(line, W - M, cy, { align: 'right' }); cy += 4.2; });

    let y = Math.max(10 + logoH, cy) + 5;

    // Title band
    pdf.setFillColor(...NAVY); pdf.rect(M, y, W - 2 * M, 11, 'F');
    pdf.setTextColor(255, 255, 255); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(15);
    pdf.text(type.title, M + 4, y + 7.6);
    pdf.setFontSize(10.5);
    pdf.text(`No. ${doc.number}`, W - M - 4, y + 7.3, { align: 'right' });
    y += 17;

    // ---------- Client + meta ----------
    const colW = (W - 2 * M - 8) / 2;
    const leftX = M, rightX = M + colW + 8;
    const client = doc.client || {};
    pdf.setFontSize(8); pdf.setTextColor(...BLUE); pdf.setFont('helvetica', 'bold');
    pdf.text(isInv ? 'BILL TO' : (isBoq ? 'PREPARED FOR' : 'QUOTATION TO'), leftX, y);
    pdf.text('DOCUMENT DETAILS', rightX, y);
    y += 5;
    let ly = y;
    pdf.setTextColor(...TEXT); pdf.setFontSize(10); pdf.setFont('helvetica', 'bold');
    const nameLines = pdf.splitTextToSize(safe(client.name || '—'), colW);
    pdf.text(nameLines, leftX, ly); ly += nameLines.length * 4.6;
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.8);
    [client.contact && `Attn: ${client.contact}`, client.address, client.phone, client.email, client.vatNo && `VAT/TIN: ${client.vatNo}`]
      .filter(Boolean).forEach(l => { const s = pdf.splitTextToSize(safe(l), colW); pdf.text(s, leftX, ly); ly += s.length * 4.2; });

    const meta = [['Date', CQ.fmtDate(doc.date)]];
    if (doc.type === 'quote' && doc.validUntil) meta.push(['Valid until', CQ.fmtDate(doc.validUntil)]);
    if (isInv && doc.dueDate) meta.push(['Due date', CQ.fmtDate(doc.dueDate)]);
    if (doc.reference) meta.push([isInv ? 'Order / Ref' : 'Reference', doc.reference]);
    if (doc.project) meta.push(['Project', doc.project]);
    if (doc.site) meta.push(['Site', doc.site]);
    meta.push(['Currency', cur]);
    let ry = y;
    meta.forEach(([k, v]) => {
      pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...MUTED); pdf.setFontSize(8.8);
      pdf.text(k, rightX, ry);
      pdf.setTextColor(...TEXT); pdf.setFont('helvetica', 'bold');
      const s = pdf.splitTextToSize(safe(v), colW - 28);
      pdf.text(s, rightX + 28, ry);
      ry += Math.max(1, s.length) * 4.4;
    });
    y = Math.max(ly, ry) + 4;

    if (doc.intro) {
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(...TEXT);
      const s = pdf.splitTextToSize(safe(doc.intro), W - 2 * M);
      pdf.text(s, M, y); y += s.length * 4.3 + 2;
    }

    // ---------- Items table ----------
    const body = [];
    const multi = (doc.sections || []).length > 1 || isBoq;
    (doc.sections || []).forEach((sec, si) => {
      if (multi || sec.title) {
        body.push([{ content: (isBoq ? `BILL No. ${si + 1}: ` : '') + safe(sec.title || (isBoq ? 'Untitled bill' : `Section ${si + 1}`)).toUpperCase(), colSpan: 6,
          styles: { fillColor: SECTION, textColor: NAVY, fontStyle: 'bold', fontSize: 9, halign: 'left' } }]);
      }
      (sec.items || []).forEach((it, ii) => {
        if (it.kind === 'note') {
          body.push([{ content: '', styles: {} }, { content: it.description, colSpan: 5, styles: { fontStyle: 'italic', textColor: MUTED } }]);
          return;
        }
        body.push([
          multi ? `${si + 1}.${ii + 1}` : String(ii + 1),
          safe(it.description),
          safe(it.unit),
          CQ.qtyFmt(it.qty),
          CQ.plain(CQ.num(it.rate)),
          CQ.plain(CQ.lineAmount(it))
        ]);
      });
      if (multi) {
        body.push([{ content: `Total carried to summary – ${isBoq ? 'Bill No. ' + (si + 1) : (sec.title || 'Section ' + (si + 1))}`, colSpan: 5, styles: { halign: 'right', fontStyle: 'bold', textColor: NAVY } },
          { content: CQ.plain(CQ.sectionTotal(sec)), styles: { halign: 'right', fontStyle: 'bold', textColor: NAVY } }]);
      }
    });

    const footerH = 16;
    pdf.autoTable({
      startY: y,
      margin: { left: M, right: M, top: 16, bottom: footerH + 6 },
      head: [[isBoq ? 'Item' : '#', 'Description', 'Unit', 'Qty', `Rate (${cur})`, `Amount (${cur})`]],
      body,
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 8.8, cellPadding: 2.1, textColor: TEXT, lineColor: [210, 219, 232], lineWidth: 0.2, valign: 'top' },
      headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold', fontSize: 8.6, halign: 'left' },
      alternateRowStyles: { fillColor: [248, 250, 254] },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 15, halign: 'right' },
        4: { cellWidth: 26, halign: 'right' },
        5: { cellWidth: 29, halign: 'right' }
      },
      didParseCell: d => {
        if (d.section === 'head' && d.column.index >= 3) d.cell.styles.halign = 'right';
        if (d.section === 'head' && (d.column.index === 0 || d.column.index === 2)) d.cell.styles.halign = 'center';
      },
      didDrawPage: d => {
        if (d.pageNumber > 1) {
          pdf.setFillColor(...NAVY); pdf.rect(0, 0, W, 3, 'F');
          pdf.setFontSize(8); pdf.setTextColor(...MUTED); pdf.setFont('helvetica', 'normal');
          pdf.text(`${type.label} ${doc.number} (continued)`, M, 10);
        }
      }
    });
    y = pdf.lastAutoTable.finalY + 6;

    const ensure = need => { if (y + need > H - footerH - 6) { pdf.addPage(); pdf.setFillColor(...NAVY); pdf.rect(0, 0, W, 3, 'F'); y = 16; } };

    // ---------- BOQ summary ----------
    if (isBoq && (doc.sections || []).length > 1) {
      const sumBody = doc.sections.map((s, i) => [`Bill No. ${i + 1}`, safe(s.title || 'Untitled bill'), CQ.plain(CQ.sectionTotal(s))]);
      ensure(30);
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(...NAVY);
      pdf.text('SUMMARY OF BILLS', M, y); y += 2;
      pdf.autoTable({
        startY: y, margin: { left: M, right: M, bottom: footerH + 6 },
        head: [['Bill', 'Description', `Amount (${cur})`]], body: sumBody, theme: 'grid',
        styles: { fontSize: 8.8, cellPadding: 2, textColor: TEXT, lineColor: [210, 219, 232], lineWidth: 0.2 },
        headStyles: { fillColor: BLUE, textColor: 255 },
        columnStyles: { 0: { cellWidth: 26 }, 2: { cellWidth: 40, halign: 'right' } },
        didParseCell: d => { if (d.section === 'head' && d.column.index === 2) d.cell.styles.halign = 'right'; }
      });
      y = pdf.lastAutoTable.finalY + 6;
    }

    // ---------- Totals ----------
    const rows = [['Subtotal', CQ.money(T.subtotal, cur)]];
    if (isBoq && CQ.num(doc.contingency) > 0) rows.push([`Contingency (${CQ.num(doc.contingency)}%)`, CQ.money(T.contingency, cur)]);
    if (T.discount > 0) rows.push([`Discount${doc.discountType === 'percent' ? ` (${CQ.num(doc.discountValue)}%)` : ''}`, '- ' + CQ.money(T.discount, cur)]);
    if (doc.vatEnabled) rows.push([`VAT (${CQ.num(doc.vatRate)}%)`, CQ.money(T.vat, cur)]);
    const grandLabel = isBoq ? 'GRAND TOTAL' : 'TOTAL';
    const tW = 84, tX = W - M - tW;
    ensure(rows.length * 6.2 + 12 + (isInv ? 14 : 0) + 10);
    const blockTop = y;
    pdf.setFontSize(9.2);
    rows.forEach(([k, v]) => {
      pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...MUTED); pdf.text(k, tX + 3, y + 4);
      pdf.setTextColor(...TEXT); pdf.setFont('helvetica', 'bold'); pdf.text(v, W - M - 3, y + 4, { align: 'right' });
      pdf.setDrawColor(225, 231, 240); pdf.line(tX, y + 6.2, W - M, y + 6.2);
      y += 6.2;
    });
    y += 1.5;
    pdf.setFillColor(...NAVY); pdf.rect(tX, y, tW, 9.5, 'F');
    pdf.setTextColor(255, 255, 255); pdf.setFontSize(10.5);
    pdf.text(grandLabel, tX + 3, y + 6.4);
    pdf.text(CQ.money(T.total, cur), W - M - 3, y + 6.4, { align: 'right' });
    y += 9.5;
    if (isInv) {
      pdf.setFontSize(9.2);
      [['Amount paid', CQ.money(T.paid, cur)], ['BALANCE DUE', CQ.money(T.balance, cur)]].forEach(([k, v], i) => {
        if (i === 1) { pdf.setFillColor(...LIGHT); pdf.rect(tX, y, tW, 7, 'F'); }
        pdf.setFont('helvetica', i ? 'bold' : 'normal'); pdf.setTextColor(...(i ? NAVY : MUTED)); pdf.text(k, tX + 3, y + 4.8);
        pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...(i ? NAVY : TEXT)); pdf.text(v, W - M - 3, y + 4.8, { align: 'right' });
        y += 7;
      });
    }

    // Amount in words (left of totals)
    pdf.setFontSize(8); pdf.setTextColor(...BLUE); pdf.setFont('helvetica', 'bold');
    pdf.text(isInv ? 'BALANCE DUE IN WORDS' : 'AMOUNT IN WORDS', M, blockTop + 4);
    pdf.setTextColor(...TEXT); pdf.setFont('helvetica', 'italic'); pdf.setFontSize(8.8);
    const words = pdf.splitTextToSize(CQ.amountWords(isInv ? T.balance : T.total, cur), tX - M - 8);
    pdf.text(words, M, blockTop + 9);
    let leftY = blockTop + 9 + words.length * 4.2 + 3;
    if (isInv && T.paid > 0 && (doc.payments || []).length) {
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(...BLUE);
      pdf.text('PAYMENTS RECEIVED', M, leftY); leftY += 4.5;
      pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...TEXT); pdf.setFontSize(8.4);
      doc.payments.forEach(p => {
        pdf.text(`${CQ.fmtDate(p.date)}  ·  ${p.method || 'Payment'}${p.ref ? ' (' + p.ref + ')' : ''}  ·  ${CQ.money(p.amount, cur)}`, M, leftY);
        leftY += 4.1;
      });
    }
    y = Math.max(y, leftY) + 7;

    // ---------- Bank / Notes / Terms ----------
    const block = (title, text, fill) => {
      if (!text || !text.trim()) return;
      pdf.setFontSize(8.6); pdf.setFont('helvetica', 'normal');
      const lines = pdf.splitTextToSize(safe(text.trim()), W - 2 * M - 8);
      const h = lines.length * 4 + 10;
      ensure(h + 2);
      if (fill) { pdf.setFillColor(...LIGHT); pdf.roundedRect(M, y, W - 2 * M, h, 1.5, 1.5, 'F'); }
      else { pdf.setDrawColor(210, 219, 232); pdf.roundedRect(M, y, W - 2 * M, h, 1.5, 1.5, 'S'); }
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(...NAVY);
      pdf.text(title, M + 4, y + 5.2);
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.6); pdf.setTextColor(...TEXT);
      pdf.text(lines, M + 4, y + 10);
      y += h + 4;
    };
    if (doc.type !== 'boq' || doc.showBank) block('BANKING DETAILS', settings.bank, true);
    block('NOTES', doc.notes, false);
    block('TERMS & CONDITIONS', doc.terms, false);

    // ---------- Signatures ----------
    ensure(26);
    y += 6;
    const sw = (W - 2 * M - 20) / 2;
    const sig = (x, label, name) => {
      pdf.setDrawColor(...MUTED); pdf.line(x, y + 10, x + sw, y + 10);
      pdf.setFontSize(8.2); pdf.setTextColor(...MUTED); pdf.setFont('helvetica', 'normal');
      pdf.text(label, x, y + 14.5);
      if (name) { pdf.setTextColor(...TEXT); pdf.setFont('helvetica', 'bold'); pdf.text(name, x, y + 8); }
    };
    sig(M, `${isBoq ? 'Prepared' : 'Issued'} by – ${settings.tradingName || settings.companyName}`, doc.preparedBy || settings.preparedBy);
    sig(M + sw + 20, isInv ? 'Received by (client) – name, signature & date' : 'Accepted by (client) – name, signature & date', '');
    y += 20;

    // ---------- Footer on every page ----------
    const pages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      pdf.setPage(i);
      pdf.setDrawColor(...BLUE); pdf.setLineWidth(0.5); pdf.line(M, H - footerH, W - M, H - footerH); pdf.setLineWidth(0.2);
      pdf.setFontSize(7.8); pdf.setTextColor(...MUTED); pdf.setFont('helvetica', 'normal');
      pdf.text(`${settings.address}  ·  Tel/WhatsApp ${settings.phone}  ·  ${settings.email}`, W / 2, H - footerH + 5, { align: 'center' });
      pdf.setTextColor(...NAVY); pdf.setFont('helvetica', 'bold');
      pdf.text('Thank you for choosing ' + (settings.tradingName || 'us') + '.', M, H - footerH + 10);
      pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...MUTED);
      pdf.text(`${doc.number}  ·  Page ${i} of ${pages}`, W - M, H - footerH + 10, { align: 'right' });
    }
    return pdf;
  }

  async function blob(doc, settings) { return (await build(doc, settings)).output('blob'); }

  async function download(doc, settings) {
    const b = await blob(doc, settings);
    const url = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = url; a.download = fileName(doc);
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    return b;
  }

  async function share(doc, settings) {
    const b = await blob(doc, settings);
    const file = new File([b], fileName(doc), { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: `${CQ.TYPES[doc.type].label} ${doc.number}`, text: `${CQ.TYPES[doc.type].label} ${doc.number} from ${settings.tradingName}` });
      return true;
    }
    return false;
  }

  async function previewUrl(doc, settings) {
    return URL.createObjectURL(await blob(doc, settings));
  }

  return { build, blob, download, share, previewUrl, fileName };
})();
