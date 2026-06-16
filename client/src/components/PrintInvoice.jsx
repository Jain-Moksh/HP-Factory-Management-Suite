import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (v) => {
  const n = parseFloat(v || 0);
  if (Number.isInteger(n)) {
    return n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const day = date.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// ─── Component ───────────────────────────────────────────────────────────────
const PrintInvoice = ({ data, items, printCopies = 1 }) => {
  // Balanced limits to ensure Page 1 and Page 2 are utilized well
  const ROWS_FIRST_PAGE = 28; 
  const ROWS_MIDDLE_PAGE = 38;
  const ROWS_LAST_PAGE = 22;
  const ROWS_SINGLE_PAGE = 20;

  const hasDiscount = items.some(item => parseFloat(item.dAmount) > 0);

  const paginate = (rawItems) => {
    const pages = [];
    const totalItems = rawItems.length;
    
    if (totalItems <= ROWS_SINGLE_PAGE) {
      pages.push(rawItems);
    } else {
      pages.push(rawItems.slice(0, ROWS_FIRST_PAGE));
      let currentIdx = ROWS_FIRST_PAGE;
      while (currentIdx < totalItems - ROWS_LAST_PAGE) {
        pages.push(rawItems.slice(currentIdx, currentIdx + ROWS_MIDDLE_PAGE));
        currentIdx += ROWS_MIDDLE_PAGE;
      }
      if (currentIdx < totalItems) {
        pages.push(rawItems.slice(currentIdx));
      }
    }
    return pages;
  };

  const itemPages = useMemo(() => paginate(items), [items]);
  const totalPages = itemPages.length;

  const duplicatedPages = useMemo(() => {
    const pages = [];
    for (let i = 0; i < printCopies; i++) {
      pages.push(...itemPages);
    }
    return pages;
  }, [itemPages, printCopies]);

  const CSS = `
    @media print {
      @page { size: 148mm 210mm; margin: 0; }
      #root { display: none !important; }
      .print-container { display: block !important; position: absolute !important; left: 0 !important; top: 0 !important; width: 148mm !important; z-index: 99999 !important; background: white !important; visibility: visible !important; margin: 0 !important; padding: 0 !important; }
      .print-container * { visibility: visible !important; }
      .bill-page { height: 210mm !important; width: 148mm !important; page-break-after: always !important; margin: 0 !important; box-shadow: none !important; }
      .bill-page:last-child { page-break-after: avoid !important; }
    }

    @media screen {
      .print-container { background: #dee2e6; padding: 40px 0; min-height: 100vh; display: flex; flex-direction: column; align-items: center; width: 100%; }
      .bill-page { box-shadow: 0 15px 45px rgba(0,0,0,0.2); margin-bottom: 40px; background: white; }
    }

    .print-container { font-family: 'Inter', -apple-system, sans-serif; color: #000; }
    .bill-page { width: 148mm; height: 210mm; display: flex; flex-direction: column; padding: 4mm 5mm 5mm 5mm; position: relative; box-sizing: border-box; flex-shrink: 0; }
    .bill-page * { box-sizing: border-box; }

    .watermark { text-align: center; font-size: 11px; font-weight: 900; letter-spacing: 4px; text-transform: uppercase; padding-bottom: 1mm; border-bottom: 2px solid #000; margin-bottom: 2mm; }

    .section-top { border: 1px solid #000; margin: 0 auto 1mm auto; display: flex; flex-shrink: 0; width: 100%; }
    .top-left { flex: 1.5; padding: 2mm; border-right: 1px solid #000; }
    .top-right { flex: 1; padding: 2mm; }

    .party-title { font-size: 13px; font-weight: 800; text-transform: uppercase; margin-bottom: 1mm; }
    .info-row { display: flex; font-size: 10px; margin-bottom: 0.5mm; }
    .info-label { font-weight: 700; width: 18mm; flex-shrink: 0; }
    .info-val { font-weight: 500; word-break: break-all; }

    .section-middle { 
      border: 1px solid #000; 
      display: flex; 
      flex-direction: column; 
      width: 100%; 
      margin: 0 auto; 
      flex-grow: 1; 
      overflow: visible;
      background: white;
    }

    .bill-table { width: 100%; border-collapse: collapse; table-layout: fixed; height: 100%; }
    .bill-table thead { display: table-header-group; }
    .bill-table th { border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 1.5mm 1mm; font-size: 9px; font-weight: 800; text-transform: uppercase; background: #fdfdfd; text-align: center; }
    .bill-table th:last-child { border-right: none; }

    .bill-table td { 
      border-right: 1px solid #000; 
      padding: 0.8mm 1.5mm; 
      font-size: 10px; 
      height: 5.5mm; 
      vertical-align: top; 
      word-wrap: break-word; 
    }
    .bill-table td:last-child { border-right: none; }
    
    /* Ensure empty rows fill the remaining space without gaps */
    .bill-table tr.empty-row td { height: auto; }
    .bill-table tr.empty-row:not(:last-child) td { height: 5.5mm; }

    .c-bund  { width: 8%; text-align: center; }
    .c-desc  { width: ${hasDiscount ? '44%' : '53%'}; text-align: left; }
    .c-qty   { width: 17%; text-align: center; }
    .c-rate  { width: 11%; text-align: right; }
    .c-disc  { width: 9%; text-align: right; }
    .c-total { width: 11%; text-align: right; font-weight: 700; }

    .section-bottom { padding-top: 1.5mm; flex-shrink: 0; }
    .bottom-wrapper { display: flex; justify-content: space-between; align-items: stretch; gap: 5px; width: 100%; }
    .remark-box { width: 60%; border: 1px solid black; padding: 4px; display: flex; flex-direction: column; }
    .remark-title { font-size: 10px; font-weight: 700; margin-bottom: 2px; }
    .remark-content { font-size: 10px; font-style: italic; white-space: pre-wrap; }
    .totals-box { width: 38%; border: 1px solid #000; padding: 1.5mm; }
    .t-row { display: flex; justify-content: space-between; font-size: 11px; padding: 0.1mm 0; }
    .t-label { font-weight: 500; color: #333; }
    .t-val { font-weight: 700; }
    .t-grand { border-top: 1px solid #000; margin-top: 1mm; padding-top: 1mm; font-size: 14px; font-weight: 900; }
  `;

  const portalContent = (
    <div className="print-container">
      <style>{CSS}</style>
      
      {duplicatedPages.map((chunk, index) => {
        const pageIndex = index % totalPages;
        const isFirst = pageIndex === 0;
        const isLast = pageIndex === totalPages - 1;
        
        let maxRows = ROWS_MIDDLE_PAGE;
        if (totalPages === 1) maxRows = ROWS_SINGLE_PAGE;
        else if (isFirst) maxRows = ROWS_FIRST_PAGE;
        else if (isLast) maxRows = ROWS_LAST_PAGE;

        const emptyRowsCount = Math.max(0, maxRows - chunk.length);
        const emptyRows = Array.from({ length: emptyRowsCount });

        return (
          <div key={index} className="bill-page" style={isLast ? { paddingBottom: '20mm' } : {}}>
            <div className="watermark">ORDER SUMMARY</div>
            
            {isFirst && (
              <div className="section-top">
                <div className="top-left">
                  <div className="party-title">{data.clientRawName || data.clientName}</div>
                  <div className="info-row">
                    <div className="info-val">
                      {[data.address1, data.address2].filter(Boolean).join(', ')}
                    </div>
                  </div>
                </div>
                <div className="top-right">
                  <div className="info-row" style={{ fontSize: '13px' }}>
                    <div className="info-label">No :</div>
                    <div className="info-val" style={{ fontWeight: 800 }}>#{data.challanNo ? String(data.challanNo).split('/')[0] : ''}</div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">Date:</div>
                    <div className="info-val">{formatDate(data.date)}</div>
                  </div>
                  {data.transporterName && (
                    <div className="info-row">
                      <div className="info-label">Transport:</div>
                      <div className="info-val">{data.transporterName}</div>
                    </div>
                  )}
                  {data.short_remark && (
                    <div className="info-row">
                      <div className="info-label">Parcel:</div>
                      <div className="info-val">{data.short_remark}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="section-middle">
              <table className="bill-table">
                <thead>
                  <tr>
                    <th className="c-bund">Bundle</th>
                    <th className="c-desc">Description of Goods</th>
                    <th className="c-qty">Quantity</th>
                    <th className="c-rate">Rate</th>
                    {hasDiscount && <th className="c-disc">Disc</th>}
                    <th className="c-total">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {chunk.map((item, idx) => {
                    const bundleRaw = item.qty && item.conversion ? (parseFloat(item.qty) / parseFloat(item.conversion)) : 0;
                    const bundle = bundleRaw === 0 ? '—' : (Number.isInteger(bundleRaw) ? bundleRaw.toString() : bundleRaw.toFixed(2));
                    return (
                      <tr key={idx}>
                        <td className="c-bund">{bundle}</td>
                        <td className="c-desc" style={{ fontWeight: 600 }}>{item.item}</td>
                        <td className="c-qty">{item.qty} {item.unit}</td>
                        <td className="c-rate">{fmt(item.rate)}</td>
                        {hasDiscount && <td className="c-disc">{fmt(item.dAmount)}</td>}
                        <td className="c-total">{fmt(item.total)}</td>
                      </tr>
                    );
                  })}
                  {emptyRows.map((_, idx) => (
                    <tr key={`empty-${idx}`} className="empty-row">
                      <td className="c-bund"></td>
                      <td className="c-desc"></td>
                      <td className="c-qty"></td>
                      <td className="c-rate"></td>
                      {hasDiscount && <td className="c-disc"></td>}
                      <td className="c-total"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="section-bottom">
              {isLast && (
                <>
                  <div className="bottom-wrapper">
                    <div className="remark-box">
                      <div className="remark-title">Invoice Remark:</div>
                      <div className="remark-content">{data.long_remark?.trim() || ''}</div>
                    </div>

                    <div className="totals-box">
                      <div className="t-row">
                        <span className="t-label">Subtotal</span>
                        <span className="t-val">₹{fmt(data.itemsSubtotal)}</span>
                      </div>
                      {parseFloat(data.transport) > 0 && (
                        <div className="t-row">
                          <span className="t-label">Transport</span>
                          <span className="t-val">₹{fmt(data.transport)}</span>
                        </div>
                      )}
                      {parseFloat(data.packing) > 0 && (
                        <div className="t-row">
                          <span className="t-label">Packing</span>
                          <span className="t-val">₹{fmt(data.packing)}</span>
                        </div>
                      )}
                      {parseFloat(data.extraDiscountAmount) > 0 && (
                        <div className="t-row">
                          <span className="t-label">Discount</span>
                          <span className="t-val">(-) ₹{fmt(data.extraDiscountAmount)}</span>
                        </div>
                      )}
                      {data.roundOffDisplay !== '0.00' && (
                        <div className="t-row">
                          <span className="t-label">Round Off</span>
                          <span className="t-val">{data.roundOffDisplay}</span>
                        </div>
                      )}
                      <div className="t-row t-grand">
                        <span>GRAND TOTAL</span>
                        <span>₹{fmt(data.grandTotal)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        );
      })}
    </div>
  );

  return createPortal(portalContent, document.body);
};

export default PrintInvoice;
