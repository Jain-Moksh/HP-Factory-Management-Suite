import React, { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../../config';
import SearchableSelect from '../UI/SearchableSelect';
import { ClickableChallan } from '../UI/ClickableChallan';

const PAGE_SIZE = 50;

const SOURCE_INFO = {
  BILL: { label: 'Bill', style: 'bg-sky-50 text-sky-700 border-sky-200' },
  JOB_WORK: { label: 'Job Work', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ITEM_MASTER: { label: 'Item Master', style: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  RESTORE: { label: 'Restore', style: 'bg-purple-50 text-purple-700 border-purple-200' },
  DIRECT_DB: { label: 'Direct DB', style: 'bg-amber-100 text-amber-800 border-amber-300' }
};

const ACTION_LABELS = { CREATE: 'Created', UPDATE: 'Edited', DELETE: 'Deleted', RESTORE: 'Restored', INSERT: 'Inserted' };

const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d)) return value;
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
};

const formatQty = (value) => {
  if (value === null || value === undefined) return '—';
  return Number(value).toLocaleString('en-IN', { maximumFractionDigits: 3 });
};

const formatChange = (value) => {
  const n = Number(value);
  if (n > 0) return `+${formatQty(n)}`;
  return formatQty(n);
};

// Same local-day boundaries the rest of the Audit page uses
const setDateRangeParams = (params, fromDate, toDate) => {
  if (fromDate) params.set('from', new Date(`${fromDate}T00:00:00`).toISOString());
  if (toDate) {
    const end = new Date(`${toDate}T00:00:00`);
    end.setDate(end.getDate() + 1);
    params.set('to', end.toISOString());
  }
};

const SourceBadge = ({ source }) => {
  const info = SOURCE_INFO[source] || { label: source, style: 'bg-slate-50 text-slate-600 border-slate-200' };
  return (
    <span className={`inline-block px-2 py-0.5 rounded border text-[9.5px] font-black uppercase tracking-widest whitespace-nowrap ${info.style}`}>
      {info.label}
    </span>
  );
};

const Reference = ({ row }) => {
  if (row.source === 'BILL' && row.reference) return <ClickableChallan challanNo={row.reference} type="billing" />;
  if (row.source === 'JOB_WORK' && row.reference) return <ClickableChallan challanNo={row.reference} type="purchase" />;
  if (row.source === 'DIRECT_DB') return <span className="text-amber-800 font-bold text-[11px]">Changed outside the app</span>;
  return <span className="font-bold text-text-primary">{row.reference || row.note || '—'}</span>;
};

const DeviceCell = ({ row }) => {
  if (row.source === 'DIRECT_DB') {
    const parts = [row.db_user && `DB user ${row.db_user}`, row.db_client_addr, row.application_name].filter(Boolean);
    return (
      <>
        <div className="font-bold text-amber-800 uppercase">Database connection</div>
        {parts.length > 0 && <div className="text-[10.5px] text-text-light">{parts.join(' · ')}</div>}
      </>
    );
  }
  const primary = row.device_name || row.hostname || row.ip_address || 'Unknown device';
  const secondary = [row.hostname, row.ip_address].filter(v => v && v !== primary).join(' · ');
  return (
    <>
      <div className="font-bold text-text-primary uppercase">{primary}</div>
      {secondary && <div className="text-[10.5px] text-text-light">{secondary}</div>}
    </>
  );
};

const SummaryTile = ({ label, value, className = '' }) => (
  <div className="flex flex-col px-4 py-2 bg-white border border-border-soft rounded-xl shadow-sm min-w-[120px]">
    <span className="text-[9.5px] font-bold text-text-light uppercase tracking-widest">{label}</span>
    <span className={`text-[15px] font-black ${className}`}>{value}</span>
  </div>
);

const inputClass = 'h-9 px-3 bg-white border border-border-soft rounded-lg text-[12px] font-bold text-text-primary outline-none focus:border-brand-blue';

/**
 * Every change to an item's stock, recorded by the database itself, whatever made it.
 */
const StockMovementTab = () => {
  const [items, setItems] = useState([]);
  const [devices, setDevices] = useState([]);

  const [itemId, setItemId] = useState('');
  const [source, setSource] = useState('');
  const [direction, setDirection] = useState('');
  const [device, setDevice] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totals, setTotals] = useState({ in: 0, out: 0, net: 0, direct: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestSeq = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => { setPage(1); }, [itemId, source, direction, device, search, fromDate, toDate]);

  const fetchMeta = useCallback(async () => {
    try {
      const [itemRes, deviceRes] = await Promise.all([
        fetch(`${API_BASE_URL}/items`).then(r => r.json()),
        fetch(`${API_BASE_URL}/audit-logs/stock-movements/devices`).then(r => r.json())
      ]);
      if (itemRes.success) setItems(itemRes.data.map(i => ({ id: i.id, name: i.name })));
      if (deviceRes.success) setDevices(deviceRes.data);
    } catch (err) {
      console.error('Error loading stock movement filters:', err);
    }
  }, []);

  const fetchRows = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (itemId) params.set('item_id', itemId);
      if (source) params.set('source', source);
      if (direction) params.set('direction', direction);
      if (device) params.set('device', device);
      if (search) params.set('search', search);
      setDateRangeParams(params, fromDate, toDate);
      params.set('page', page);
      params.set('limit', PAGE_SIZE);
      const result = await fetch(`${API_BASE_URL}/audit-logs/stock-movements?${params}`).then(r => r.json());
      if (seq !== requestSeq.current) return;
      if (result.success) {
        setRows(result.rows);
        setTotal(result.total);
        setTotals(result.totals);
      } else {
        setError(result.message || 'Failed to load stock movements');
      }
    } catch {
      if (seq === requestSeq.current) setError('Network error while loading stock movements');
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [itemId, source, direction, device, search, fromDate, toDate, page]);

  useEffect(() => { fetchMeta(); }, [fetchMeta]);
  useEffect(() => { fetchRows(); }, [fetchRows]);

  useEffect(() => {
    const refresh = () => { fetchMeta(); fetchRows(); };
    window.addEventListener('app-refresh', refresh);
    return () => window.removeEventListener('app-refresh', refresh);
  }, [fetchMeta, fetchRows]);

  const clearFilters = () => {
    setItemId('');
    setSource('');
    setDirection('');
    setDevice('');
    setSearchInput('');
    setFromDate('');
    setToDate('');
  };

  const hasFilters = itemId || source || direction || device || searchInput || fromDate || toDate;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const thClass = 'px-4 py-2 text-[10.5px] font-bold border-x border-white/5 uppercase tracking-widest';
  const tdClass = 'px-4 py-1.5 border-x border-border-soft text-[12px]';

  return (
    <>
      {/* Filters */}
      <div className="bg-white border border-border-soft rounded-xl shadow-sm px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="w-64">
          <SearchableSelect options={items} value={itemId} onChange={(id) => setItemId(id || '')} placeholder="All items" />
        </div>
        <select value={source} onChange={(e) => setSource(e.target.value)} className={inputClass}>
          <option value="">All Sources</option>
          {Object.entries(SOURCE_INFO).map(([key, info]) => (
            <option key={key} value={key}>{info.label}</option>
          ))}
        </select>
        <select value={direction} onChange={(e) => setDirection(e.target.value)} className={inputClass}>
          <option value="">In &amp; Out</option>
          <option value="IN">Stock In (+)</option>
          <option value="OUT">Stock Out (−)</option>
        </select>
        <select value={device} onChange={(e) => setDevice(e.target.value)} className={`${inputClass} max-w-[220px]`}>
          <option value="">All Devices</option>
          {devices.map(d => (
            <option key={d.device} value={d.device}>{d.device} ({d.total})</option>
          ))}
        </select>
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search item or challan"
          className={`${inputClass} w-52`}
        />
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-text-light uppercase tracking-widest">From</span>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={inputClass} />
          <span className="text-[10px] font-bold text-text-light uppercase tracking-widest">To</span>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={inputClass} />
        </div>
        {hasFilters && (
          <button onClick={clearFilters} className="text-[11px] font-bold text-red-500 uppercase tracking-wider hover:underline">Clear filters</button>
        )}
      </div>

      {/* Totals for the current filters */}
      <div className="flex flex-wrap items-stretch gap-3">
        <SummaryTile label="Movements" value={total.toLocaleString('en-IN')} className="text-text-primary" />
        <SummaryTile label="Stock In" value={`+${formatQty(totals.in)}`} className="text-emerald-700" />
        <SummaryTile label="Stock Out" value={`−${formatQty(totals.out)}`} className="text-red-600" />
        <SummaryTile label="Net Change" value={formatChange(totals.net)} className={totals.net < 0 ? 'text-red-600' : 'text-emerald-700'} />
        {totals.direct > 0 && (
          <button
            onClick={() => setSource('DIRECT_DB')}
            className="flex items-center px-4 py-2 bg-amber-50 border border-amber-300 rounded-xl text-[11.5px] font-bold text-amber-800 text-left hover:bg-amber-100"
          >
            {totals.direct} change{totals.direct === 1 ? ' was' : 's were'} made directly in the database, outside the app. Click to show.
          </button>
        )}
      </div>

      <div className="bg-sky-50 border border-sky-200 rounded-xl px-4 py-2.5 text-[11.5px] font-bold text-sky-800">
        The database records every change to an item's stock here, however it was made, including changes made outside this app. Editing a bill or job work can show several rows for one item: one for each line that changed.
      </div>

      {/* Results */}
      <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-text-light font-medium italic animate-pulse text-[12px]">Loading stock movements...</div>
        ) : error ? (
          <div className="p-12 text-center text-red-600 font-bold text-[12px]">{error}</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-text-light font-medium italic text-[12px]">No stock movements recorded for these filters yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-table-header text-white">
                  <th className={`${thClass} w-48`}>Date &amp; Time</th>
                  <th className={thClass}>Item</th>
                  <th className={`${thClass} w-32`}>Source</th>
                  <th className={`${thClass} w-44`}>Reference</th>
                  <th className={`${thClass} w-24 text-right`}>Before</th>
                  <th className={`${thClass} w-24 text-right`}>Change</th>
                  <th className={`${thClass} w-24 text-right`}>After</th>
                  <th className={`${thClass} w-52`}>Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {rows.map(row => {
                  const change = Number(row.change);
                  return (
                    <tr
                      key={row.id}
                      className={row.source === 'DIRECT_DB' ? 'bg-amber-50/70' : 'hover:bg-bg-main/50'}
                      title={row.note || undefined}
                    >
                      <td className={`${tdClass} font-bold text-text-secondary whitespace-nowrap`}>{formatDateTime(row.created_at)}</td>
                      <td className={`${tdClass} font-bold text-brand-blue uppercase`}>
                        <button onClick={() => setItemId(row.item_id)} className="hover:underline text-left" title="Show only this item">
                          {row.item_name || `#${row.item_id}`}
                        </button>
                        {row.unit && <span className="ml-1.5 text-[10px] text-text-light">{row.unit}</span>}
                      </td>
                      <td className={tdClass}>
                        <div className="flex flex-col items-start gap-0.5">
                          <SourceBadge source={row.source} />
                          {row.action && <span className="text-[10px] font-bold text-text-light uppercase tracking-wider">{ACTION_LABELS[row.action] || row.action}</span>}
                        </div>
                      </td>
                      <td className={tdClass}><Reference row={row} /></td>
                      <td className={`${tdClass} text-right font-bold text-text-secondary`}>{row.old_stock === null ? 'New' : formatQty(row.old_stock)}</td>
                      <td className={`${tdClass} text-right font-black ${change > 0 ? 'text-emerald-700' : change < 0 ? 'text-red-600' : 'text-text-light'}`}>
                        {formatChange(change)}
                      </td>
                      <td className={`${tdClass} text-right font-bold text-text-primary`}>{row.new_stock === null ? 'Deleted' : formatQty(row.new_stock)}</td>
                      <td className={tdClass}><DeviceCell row={row} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between text-[11px] font-bold text-text-secondary uppercase tracking-wider">
          <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 bg-white border border-border-soft rounded-lg disabled:opacity-40 hover:border-brand-blue/40"
            >
              Previous
            </button>
            <span>Page {page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 bg-white border border-border-soft rounded-lg disabled:opacity-40 hover:border-brand-blue/40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default StockMovementTab;
