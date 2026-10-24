import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import { API_BASE_URL } from '../../config';
import { getDeviceName, setDeviceName } from '../../utils/deviceIdentity';

const PAGE_SIZE = 50;

const TABS = [
  { key: 'ALL', label: 'All Activity' },
  { key: 'BILLING', label: 'Billing' },
  { key: 'JOB_WORK', label: 'Job Work' },
  { key: 'PAYMENT', label: 'Payments' },
  { key: 'ITEM', label: 'Items' },
  { key: 'PARTY', label: 'Parties' },
  { key: 'JOBBER', label: 'Jobbers' },
  { key: 'TRANSPORTER', label: 'Transporters' },
  { key: 'GROUP', label: 'Groups' },
  { key: 'PRICE_LIST', label: 'Price List' },
  { key: 'SYSTEM', label: 'System' },
  { key: 'ARCHIVED', label: 'Archived Entries' }
];

const MODULE_LABELS = TABS.reduce((acc, t) => ({ ...acc, [t.key]: t.label }), {});

const ACTION_STYLES = {
  CREATE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  UPDATE: 'bg-amber-50 text-amber-700 border-amber-200',
  DELETE: 'bg-red-50 text-red-700 border-red-200',
  RESTORE: 'bg-purple-50 text-purple-700 border-purple-200'
};

const ACTION_LABELS = { CREATE: 'Created', UPDATE: 'Updated', DELETE: 'Deleted', RESTORE: 'Restored' };

// Line item columns, in display order; only the ones present in a snapshot are shown
const ITEM_COLUMNS = [
  { key: 'item_name', label: 'Item' },
  { key: 'quantity', label: 'Qty' },
  { key: 'unit', label: 'Unit' },
  { key: 'bundle', label: 'Bundle' },
  { key: 'rate', label: 'Rate' },
  { key: 'discount_percent', label: 'Disc %' },
  { key: 'total_amount', label: 'Amount' }
];

const HIDDEN_FIELDS = ['id', 'items', 'order_index', 'request_id'];

const fieldLabel = (key) => key.replace(/_/g, ' ').toUpperCase();

const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d)) return value;
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'YES' : 'NO';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-');
    return `${d}/${m}/${y}`;
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) return formatDateTime(value);
  return String(value);
};

// Sends exact local-day boundaries (from inclusive, to exclusive) so the filter matches
// this PC's calendar day whatever timezone the database server uses
const setDateRangeParams = (params, fromDate, toDate) => {
  if (fromDate) params.set('from', new Date(`${fromDate}T00:00:00`).toISOString());
  if (toDate) {
    const end = new Date(`${toDate}T00:00:00`);
    end.setDate(end.getDate() + 1);
    params.set('to', end.toISOString());
  }
};

const primaryDevice = (row) => row.device_name || row.hostname || row.ip_address || 'Unknown device';

const secondaryDevice = (row) => {
  const parts = [];
  if (row.hostname && row.hostname !== primaryDevice(row)) parts.push(row.hostname);
  if (row.ip_address && row.ip_address !== primaryDevice(row)) parts.push(row.ip_address);
  return parts.join(' · ');
};

// Hides foreign keys when the readable *_name field is also present
const visibleFields = (snapshot) => Object.keys(snapshot || {}).filter(key => {
  if (HIDDEN_FIELDS.includes(key)) return false;
  if (key.endsWith('_id') && `${key.replace(/_id$/, '_name')}` in snapshot) return false;
  return typeof snapshot[key] !== 'object' || snapshot[key] === null;
});

const ActionBadge = ({ action }) => (
  <span className={`inline-block px-2 py-0.5 rounded border text-[9.5px] font-black uppercase tracking-widest ${ACTION_STYLES[action] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
    {ACTION_LABELS[action] || action}
  </span>
);

const SectionTitle = ({ children }) => (
  <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 mt-5 first:mt-0">{children}</h4>
);

const SnapshotFields = ({ snapshot }) => {
  const fields = visibleFields(snapshot);
  if (!fields.length) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 bg-slate-50 border border-border-soft rounded-lg p-4">
      {fields.map(key => (
        <div key={key} className="flex flex-col min-w-0">
          <span className="text-[9.5px] font-bold text-text-light uppercase tracking-widest">{fieldLabel(key)}</span>
          <span className="text-[12.5px] font-bold text-text-primary break-words">{formatValue(snapshot[key])}</span>
        </div>
      ))}
    </div>
  );
};

const ItemsTable = ({ items, highlight }) => {
  if (!items || !items.length) return <p className="text-[12px] text-text-light italic">No items</p>;
  const columns = ITEM_COLUMNS.filter(c => items.some(i => c.key in i));
  return (
    <div className="border border-border-soft rounded-lg overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-table-header text-white">
            {columns.map(c => (
              <th key={c.key} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-soft">
          {items.map((item, idx) => (
            <tr key={item.id ?? idx} className={highlight || ''}>
              {columns.map(c => (
                <td key={c.key} className="px-3 py-1.5 text-[12px] font-bold text-text-primary">{formatValue(item[c.key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ChangesTable = ({ changes }) => (
  <div className="border border-border-soft rounded-lg overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-table-header text-white">
          <th className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest w-48">Field</th>
          <th className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest">Before</th>
          <th className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest">After</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border-soft">
        {changes.map((c, idx) => (
          <tr key={`${c.field}-${idx}`}>
            <td className="px-3 py-1.5 text-[11px] font-black text-text-secondary uppercase tracking-wide">{fieldLabel(c.field)}</td>
            <td className="px-3 py-1.5 text-[12px] font-bold text-red-600 bg-red-50/40 break-words">{formatValue(c.from)}</td>
            <td className="px-3 py-1.5 text-[12px] font-bold text-emerald-700 bg-emerald-50/40 break-words">{formatValue(c.to)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ItemDiff = ({ itemDiff }) => {
  const { added = [], removed = [], modified = [] } = itemDiff || {};
  if (!added.length && !removed.length && !modified.length) return null;
  return (
    <>
      {added.length > 0 && (
        <>
          <SectionTitle>Items Added</SectionTitle>
          <ItemsTable items={added} highlight="bg-emerald-50/60" />
        </>
      )}
      {removed.length > 0 && (
        <>
          <SectionTitle>Items Removed (stock reversed)</SectionTitle>
          <ItemsTable items={removed} highlight="bg-red-50/60" />
        </>
      )}
      {modified.length > 0 && (
        <>
          <SectionTitle>Items Changed</SectionTitle>
          <div className="flex flex-col gap-2">
            {modified.map((m, idx) => (
              <div key={m.after.id ?? idx}>
                <p className="text-[11.5px] font-black text-brand-blue uppercase mb-1">{m.after.item_name || m.before.item_name}</p>
                <ChangesTable changes={m.changes} />
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
};

const DetailDialog = ({ title, subtitle, meta, children, onClose }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/50 gap-4">
          <div className="min-w-0">
            <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-tight">{title}</h3>
            {subtitle && <p className="text-[12px] text-text-secondary mt-1">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {meta && (
          <div className="px-6 py-3 border-b border-slate-100 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2">
            {meta.map(m => (
              <div key={m.label} className="flex flex-col min-w-0">
                <span className="text-[9.5px] font-bold text-text-light uppercase tracking-widest">{m.label}</span>
                <span className="text-[12px] font-bold text-text-primary break-words">{m.value || '—'}</span>
              </div>
            ))}
          </div>
        )}
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
};

const LogDetail = ({ logId, onClose }) => {
  const [log, setLog] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/audit-logs/${logId}`)
      .then(r => r.json())
      .then(result => result.success ? setLog(result.data) : setError(result.message || 'Failed to load entry'))
      .catch(() => setError('Network error while loading entry'));
  }, [logId]);

  const details = log?.details || {};
  const snapshot = details.after || details.before;

  return (
    <DetailDialog
      title={log ? `${MODULE_LABELS[log.module] || log.module} · ${ACTION_LABELS[log.action] || log.action} · ${log.reference || ''}` : 'Loading...'}
      subtitle={log?.summary}
      onClose={onClose}
      meta={log ? [
        { label: 'Date & Time', value: formatDateTime(log.created_at) },
        { label: 'Device Name', value: log.device_name || 'Not set on that PC' },
        { label: 'Computer (Network) Name', value: log.hostname },
        { label: 'IP Address', value: log.ip_address },
        { label: 'Operating System', value: log.os },
        { label: 'Browser', value: log.browser }
      ] : null}
    >
      {error && <p className="text-[12px] text-red-600 font-bold">{error}</p>}
      {!log && !error && <p className="text-[12px] text-text-light italic animate-pulse">Loading details...</p>}
      {log && (
        <>
          {log.action === 'UPDATE' && (
            <>
              <SectionTitle>Changed Fields</SectionTitle>
              {details.changes && details.changes.length
                ? <ChangesTable changes={details.changes} />
                : <p className="text-[12px] text-text-light italic">No header fields changed</p>}
              <ItemDiff itemDiff={details.itemDiff} />
              {details.after && Array.isArray(details.after.items) && (
                <>
                  <SectionTitle>Items After Update</SectionTitle>
                  <ItemsTable items={details.after.items} />
                </>
              )}
            </>
          )}
          {log.action !== 'UPDATE' && snapshot && (
            <>
              <SectionTitle>{log.action === 'DELETE' ? 'Record As It Was When Deleted' : 'Record Details'}</SectionTitle>
              <SnapshotFields snapshot={snapshot} />
              {Array.isArray(snapshot.items) && (
                <>
                  <SectionTitle>Items</SectionTitle>
                  <ItemsTable items={snapshot.items} />
                </>
              )}
              {log.action === 'DELETE' && details.archive_id && (
                <p className="mt-4 text-[11px] font-bold text-text-secondary uppercase tracking-wide">
                  Kept in Archived Entries (archive #{details.archive_id}). It is not counted in stock, ledgers or reports.
                </p>
              )}
            </>
          )}
        </>
      )}
    </DetailDialog>
  );
};

const ArchivedDetail = ({ archiveId, onClose }) => {
  const [record, setRecord] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/audit-logs/archived/${archiveId}`)
      .then(r => r.json())
      .then(result => result.success ? setRecord(result.data) : setError(result.message || 'Failed to load record'))
      .catch(() => setError('Network error while loading record'));
  }, [archiveId]);

  const data = record?.data;

  return (
    <DetailDialog
      title={record ? `Archived ${MODULE_LABELS[record.entity_type] || record.entity_type} · ${record.reference || ''}` : 'Loading...'}
      subtitle="This entry was deleted. It is kept here for reference only and is not counted in stock, ledgers or reports."
      onClose={onClose}
      meta={record ? [
        { label: 'Archived On', value: formatDateTime(record.archived_at) },
        { label: 'Deleted From Device', value: record.device_name || record.hostname || record.ip_address },
        { label: 'IP Address', value: record.ip_address }
      ] : null}
    >
      {error && <p className="text-[12px] text-red-600 font-bold">{error}</p>}
      {!record && !error && <p className="text-[12px] text-text-light italic animate-pulse">Loading details...</p>}
      {data && (
        <>
          <SectionTitle>Record Details</SectionTitle>
          <SnapshotFields snapshot={data} />
          {Array.isArray(data.items) && (
            <>
              <SectionTitle>Items</SectionTitle>
              <ItemsTable items={data.items} />
            </>
          )}
        </>
      )}
    </DetailDialog>
  );
};

const DeviceCard = () => {
  const [savedName, setSavedName] = useState(getDeviceName());
  const [draft, setDraft] = useState(getDeviceName());
  const [isEditing, setIsEditing] = useState(false);
  const [network, setNetwork] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/audit-logs/whoami`)
      .then(r => r.json())
      .then(result => result.success && setNetwork(result.data))
      .catch(() => {});
  }, []);

  const handleSave = () => {
    const name = setDeviceName(draft);
    setSavedName(name);
    setDraft(name);
    setIsEditing(false);
  };

  return (
    <div className="bg-white border border-border-soft rounded-xl shadow-sm px-5 py-3 flex flex-wrap items-center gap-x-6 gap-y-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-[9.5px] font-bold text-text-light uppercase tracking-widest">This device is recorded as</span>
          {isEditing ? (
            <div className="flex items-center gap-2 mt-0.5">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setIsEditing(false); }}
                placeholder="e.g. BILLING COUNTER HP PC"
                maxLength={100}
                autoFocus
                className="h-8 px-3 border border-border-soft rounded-lg text-[12.5px] font-bold uppercase outline-none focus:border-brand-blue w-64"
              />
              <button onClick={handleSave} className="h-8 px-3 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-lg text-[11px] font-bold uppercase tracking-wider">Save</button>
              <button onClick={() => { setDraft(savedName); setIsEditing(false); }} className="h-8 px-3 border border-border-soft rounded-lg text-[11px] font-bold uppercase tracking-wider text-text-secondary hover:bg-slate-50">Cancel</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-black text-text-primary uppercase">
                {savedName || network?.hostname || 'Unnamed device'}
              </span>
              <button onClick={() => setIsEditing(true)} className="text-[10.5px] font-bold text-brand-blue uppercase tracking-wider hover:underline">
                {savedName ? 'Rename' : 'Set name'}
              </button>
            </div>
          )}
        </div>
      </div>
      {network && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11px] font-bold text-text-secondary uppercase tracking-wide">
          <span>Computer: <span className="text-text-primary">{network.hostname || 'Not resolvable'}</span></span>
          <span>IP: <span className="text-text-primary">{network.ip || '—'}</span></span>
          <span>{network.os} · {network.browser}</span>
        </div>
      )}
      {!savedName && !isEditing && (
        <span className="text-[10.5px] text-amber-700 font-bold uppercase tracking-wide">
          Set a name on each PC so its entries are easy to recognise
        </span>
      )}
    </div>
  );
};

const inputClass = 'h-9 px-3 bg-white border border-border-soft rounded-lg text-[12px] font-bold text-text-primary outline-none focus:border-brand-blue';

const AuditLog = () => {
  const [activeTab, setActiveTab] = useState('ALL');
  const [counts, setCounts] = useState({ modules: {}, archived: 0 });
  const [devices, setDevices] = useState([]);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [device, setDevice] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedLogId, setSelectedLogId] = useState(null);
  const [selectedArchiveId, setSelectedArchiveId] = useState(null);

  const isArchiveTab = activeTab === 'ARCHIVED';
  // Only the latest request may update the table, so a slow earlier response can't overwrite it
  const requestSeq = useRef(0);

  // Debounce typing in the search box
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, search, action, device, fromDate, toDate]);

  const fetchMeta = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      setDateRangeParams(params, fromDate, toDate);
      const [countRes, deviceRes] = await Promise.all([
        fetch(`${API_BASE_URL}/audit-logs/counts?${params}`).then(r => r.json()),
        fetch(`${API_BASE_URL}/audit-logs/devices`).then(r => r.json())
      ]);
      if (countRes.success) setCounts(countRes.data);
      if (deviceRes.success) setDevices(deviceRes.data);
    } catch (err) {
      console.error('Error fetching audit counts:', err);
    }
  }, [fromDate, toDate]);

  const fetchRows = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      let url;
      if (isArchiveTab) {
        url = `${API_BASE_URL}/audit-logs/archived?${params}`;
      } else {
        if (activeTab !== 'ALL') params.set('module', activeTab);
        if (action) params.set('action', action);
        if (device) params.set('device', device);
        setDateRangeParams(params, fromDate, toDate);
        params.set('page', page);
        params.set('limit', PAGE_SIZE);
        url = `${API_BASE_URL}/audit-logs?${params}`;
      }
      const result = await fetch(url).then(r => r.json());
      if (seq !== requestSeq.current) return;
      if (result.success) {
        setRows(isArchiveTab ? result.data : result.rows);
        setTotal(isArchiveTab ? result.count : result.total);
      } else {
        setError(result.message || 'Failed to load audit log');
      }
    } catch {
      if (seq === requestSeq.current) setError('Network error while loading audit log');
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [activeTab, isArchiveTab, search, action, device, fromDate, toDate, page]);

  useEffect(() => { fetchMeta(); }, [fetchMeta]);
  useEffect(() => { fetchRows(); }, [fetchRows]);

  useEffect(() => {
    const refresh = () => { fetchMeta(); fetchRows(); };
    window.addEventListener('app-refresh', refresh);
    return () => window.removeEventListener('app-refresh', refresh);
  }, [fetchMeta, fetchRows]);

  const tabCount = (key) => {
    if (key === 'ARCHIVED') return counts.archived || 0;
    if (key === 'ALL') return Object.values(counts.modules || {}).reduce((a, b) => a + b, 0);
    return (counts.modules || {})[key] || 0;
  };

  const clearFilters = () => {
    setSearchInput('');
    setAction('');
    setDevice('');
    setFromDate('');
    setToDate('');
  };

  const hasFilters = searchInput || action || device || fromDate || toDate;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const thClass = 'px-4 py-2 text-[10.5px] font-bold border-x border-white/5 uppercase tracking-widest';
  const tdClass = 'px-4 py-1.5 border-x border-border-soft text-[12px]';

  return (
    <Layout>
      <div className="flex flex-col min-h-screen relative pb-16 bg-slate-50/50">
        <PageHeader
          title="System Audit Log"
          subtitle="EVERY CHANGE MADE TO YOUR DATA AND THE DEVICE THAT MADE IT"
          actions={[]}
        />

        <div className="px-6 flex flex-col gap-4 w-full">
          <DeviceCard />

          {/* Module tabs */}
          <div className="flex flex-wrap gap-1.5">
            {TABS.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition ${
                    isActive
                      ? (tab.key === 'ARCHIVED' ? 'bg-red-600 border-red-600 text-white shadow' : 'bg-brand-blue border-brand-blue text-white shadow')
                      : 'bg-white border-border-soft text-text-secondary hover:border-brand-blue/40 hover:text-brand-blue'
                  }`}
                >
                  {tab.label}
                  <span className={`text-[10px] px-1.5 rounded ${isActive ? 'bg-white/20' : 'bg-slate-100'}`}>{tabCount(tab.key)}</span>
                </button>
              );
            })}
          </div>

          {/* Filters */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm px-4 py-3 flex flex-wrap items-center gap-3">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={isArchiveTab ? 'Search challan / name' : 'Search challan, name or description'}
              className={`${inputClass} w-72`}
            />
            {!isArchiveTab && (
              <>
                <select value={action} onChange={(e) => setAction(e.target.value)} className={inputClass}>
                  <option value="">All Actions</option>
                  <option value="CREATE">Created</option>
                  <option value="UPDATE">Updated</option>
                  <option value="DELETE">Deleted</option>
                  <option value="RESTORE">Restored</option>
                </select>
                <select value={device} onChange={(e) => setDevice(e.target.value)} className={`${inputClass} max-w-[220px]`}>
                  <option value="">All Devices</option>
                  {devices.map(d => (
                    <option key={d.device} value={d.device}>{d.device} ({d.total})</option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-text-light uppercase tracking-widest">From</span>
                  <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={inputClass} />
                  <span className="text-[10px] font-bold text-text-light uppercase tracking-widest">To</span>
                  <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={inputClass} />
                </div>
              </>
            )}
            {hasFilters && (
              <button onClick={clearFilters} className="text-[11px] font-bold text-red-500 uppercase tracking-wider hover:underline">Clear filters</button>
            )}
          </div>

          {isArchiveTab && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-[11.5px] font-bold text-red-700">
              Deleted entries are kept here for reference. They are not counted anywhere: not in stock, ledgers, outstanding or reports. Their stock was returned when they were deleted.
            </div>
          )}

          {/* Results */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-text-light font-medium italic animate-pulse text-[12px]">Loading audit log...</div>
            ) : error ? (
              <div className="p-12 text-center text-red-600 font-bold text-[12px]">{error}</div>
            ) : rows.length === 0 ? (
              <div className="p-12 text-center text-text-light font-medium italic text-[12px]">
                {isArchiveTab ? 'No archived entries.' : 'No activity recorded for these filters yet.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                {isArchiveTab ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-table-header text-white">
                        <th className={`${thClass} w-48`}>Archived On</th>
                        <th className={`${thClass} w-32`}>Type</th>
                        <th className={`${thClass} w-44`}>Challan / Ref</th>
                        <th className={thClass}>Party / Name</th>
                        <th className={`${thClass} w-28`}>Entry Date</th>
                        <th className={`${thClass} w-32 text-right`}>Amount</th>
                        <th className={`${thClass} w-52`}>Deleted From</th>
                        <th className={`${thClass} w-16 text-center`}>View</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-soft">
                      {rows.map(row => (
                        <tr key={row.id} onClick={() => setSelectedArchiveId(row.id)} className="hover:bg-bg-main/50 cursor-pointer transition-colors duration-75">
                          <td className={`${tdClass} font-bold text-text-secondary`}>{formatDateTime(row.archived_at)}</td>
                          <td className={`${tdClass} font-black text-text-secondary uppercase text-[10.5px] tracking-wider`}>{MODULE_LABELS[row.entity_type] || row.entity_type}</td>
                          <td className={`${tdClass} font-bold text-text-primary`}>{row.reference || '—'}</td>
                          <td className={`${tdClass} font-bold text-brand-blue uppercase`}>{row.party_name || '—'}</td>
                          <td className={`${tdClass} font-bold text-text-primary`}>{formatValue(row.record_date)}</td>
                          <td className={`${tdClass} font-bold text-text-primary text-right`}>
                            {row.amount !== null ? `₹${Number(row.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                          </td>
                          <td className={tdClass}>
                            <div className="font-bold text-text-primary uppercase">{primaryDevice(row)}</div>
                            {secondaryDevice(row) && <div className="text-[10.5px] text-text-light">{secondaryDevice(row)}</div>}
                          </td>
                          <td className={`${tdClass} text-center text-brand-blue font-bold`}>›</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-table-header text-white">
                        <th className={`${thClass} w-48`}>Date &amp; Time</th>
                        <th className={`${thClass} w-28`}>Module</th>
                        <th className={`${thClass} w-24`}>Action</th>
                        <th className={`${thClass} w-40`}>Reference</th>
                        <th className={thClass}>Description</th>
                        <th className={`${thClass} w-52`}>Device</th>
                        <th className={`${thClass} w-16 text-center`}>View</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-soft">
                      {rows.map(row => (
                        <tr key={row.id} onClick={() => setSelectedLogId(row.id)} className="hover:bg-bg-main/50 cursor-pointer transition-colors duration-75">
                          <td className={`${tdClass} font-bold text-text-secondary whitespace-nowrap`}>{formatDateTime(row.created_at)}</td>
                          <td className={`${tdClass} font-black text-text-secondary uppercase text-[10.5px] tracking-wider`}>{MODULE_LABELS[row.module] || row.module}</td>
                          <td className={tdClass}><ActionBadge action={row.action} /></td>
                          <td className={`${tdClass} font-bold text-text-primary`}>{row.reference || '—'}</td>
                          <td className={`${tdClass} text-text-primary`}>{row.summary}</td>
                          <td className={tdClass}>
                            <div className="font-bold text-text-primary uppercase">{primaryDevice(row)}</div>
                            {secondaryDevice(row) && <div className="text-[10.5px] text-text-light">{secondaryDevice(row)}</div>}
                          </td>
                          <td className={`${tdClass} text-center text-brand-blue font-bold`}>›</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {!isArchiveTab && total > 0 && (
            <div className="flex items-center justify-between text-[11px] font-bold text-text-secondary uppercase tracking-wider">
              <span>
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
              </span>
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
          {isArchiveTab && total > 0 && (
            <div className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">{total} archived entr{total === 1 ? 'y' : 'ies'}</div>
          )}
        </div>
      </div>

      {selectedLogId && <LogDetail logId={selectedLogId} onClose={() => setSelectedLogId(null)} />}
      {selectedArchiveId && <ArchivedDetail archiveId={selectedArchiveId} onClose={() => setSelectedArchiveId(null)} />}
    </Layout>
  );
};

export default AuditLog;
