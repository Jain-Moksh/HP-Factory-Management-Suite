import React, { useState, useEffect } from 'react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Input from '../UI/Input';

const AutoBackupSettings = () => {
  const [settings, setSettings] = useState({
    auto_backup_enabled: true,
    auto_backup_path: 'C:/NP-Backups/',
    last_backup_time: null,
    last_backup_file: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || '';
  const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/backup/settings`);
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Failed to fetch backup settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();

    // Auto-refresh when window gains focus
    const handleFocus = () => fetchSettings();
    window.addEventListener('focus', handleFocus);
    
    // Smart polling for self-healing backups
    let pollInterval;
    if (settings?.last_backup_file?.includes('Creating')) {
      pollInterval = setInterval(() => {
        fetchSettings();
      }, 2000);
    }

    return () => {
      window.removeEventListener('focus', handleFocus);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [settings?.last_backup_file]);

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const response = await fetch(`${baseUrl}/api/backup/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (response.ok) {
        setStatus('success');
        setTimeout(() => setStatus(null), 3000);
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleManualRefresh = () => {
    setLoading(true);
    fetchSettings();
  };

  if (loading) {
    return (
      <Card className="p-6 flex items-center justify-center min-h-[300px]">
        <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Automatic Backup Settings</h3>
            <p className="text-sm text-slate-500 uppercase tracking-wider">Configure background data protection</p>
          </div>
        </div>
        <button 
          onClick={handleManualRefresh}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-brand-blue transition-all"
          title="Refresh Status"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="space-y-6">
        {/* Toggle */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <p className="font-semibold text-slate-700">Enable Auto-Backup</p>
            <p className="text-xs text-slate-500 italic">Triggers after every save/edit/delete</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={settings.auto_backup_enabled}
              onChange={(e) => setSettings({...settings, auto_backup_enabled: e.target.checked})}
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Path Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Local Backup Path (Server Machine)
          </label>
          <Input 
            value={settings.auto_backup_path}
            onChange={(e) => setSettings({...settings, auto_backup_path: e.target.value})}
            placeholder="e.g., D:/NP-Backups/"
          />
          <p className="text-[10px] text-slate-400">
            Note: The server will attempt to create this folder if it doesn't exist.
          </p>
        </div>

        {/* Status Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-[10px] text-slate-500 uppercase tracking-tight mb-1">Last Backup</p>
            <p className="text-xs font-mono font-bold text-slate-700">
              {settings.last_backup_time ? new Date(settings.last_backup_time).toLocaleString() : 'NEVER'}
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-[10px] text-slate-500 uppercase tracking-tight mb-1">Current File</p>
            <p className="text-xs font-mono font-bold text-slate-700 break-all" title={settings.last_backup_file}>
              {settings.last_backup_file || 'NONE'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded font-bold transition shadow-lg ${
              saving ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-brand-blue hover:bg-brand-blue-hover text-white'
            }`}
          >
            {saving ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            )}
            Save Configuration
          </button>

          {status === 'success' && (
            <div className="flex items-center gap-2 text-green-600 justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium">Settings saved successfully</span>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center gap-2 text-red-600 justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium">Failed to save settings</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AutoBackupSettings;
