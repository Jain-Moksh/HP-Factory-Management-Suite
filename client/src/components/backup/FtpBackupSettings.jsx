import React, { useState, useEffect } from 'react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Input from '../UI/Input';

const FtpBackupSettings = () => {
  const [settings, setSettings] = useState({
    ftp_backup_enabled: false,
    ftp_host: '',
    ftp_port: 21,
    ftp_username: '',
    ftp_password: '',
    ftp_path: '/'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || '';
  const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/backup/ftp-settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Failed to fetch FTP backup settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const payload = {
        ...settings,
        ftp_port: parseInt(settings.ftp_port) || 21
      };
      const response = await fetch(`${baseUrl}/api/backup/ftp-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
    <Card className="p-6 lg:col-span-2">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">FTP Server Settings</h3>
            <p className="text-sm text-slate-500 uppercase tracking-wider">Configure remote backup destination</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Toggle */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <p className="font-semibold text-slate-700">Enable FTP Remote Backup</p>
            <p className="text-xs text-slate-500 italic">Automatically uploads backup files to FTP</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={settings.ftp_backup_enabled}
              onChange={(e) => setSettings({...settings, ftp_backup_enabled: e.target.checked})}
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">FTP Host / IP Address</label>
            <Input 
              value={settings.ftp_host}
              onChange={(e) => setSettings({...settings, ftp_host: e.target.value})}
              placeholder="ftp.example.com or 192.168.1.100"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Port</label>
            <Input 
              type="number"
              value={settings.ftp_port}
              onChange={(e) => setSettings({...settings, ftp_port: e.target.value})}
              placeholder="21"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Username</label>
            <Input 
              value={settings.ftp_username}
              onChange={(e) => setSettings({...settings, ftp_username: e.target.value})}
              placeholder="ftp_user"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Password</label>
            <Input 
              type="password"
              value={settings.ftp_password}
              onChange={(e) => setSettings({...settings, ftp_password: e.target.value})}
              placeholder="********"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-600">Remote Directory Path</label>
            <Input 
              value={settings.ftp_path}
              onChange={(e) => setSettings({...settings, ftp_path: e.target.value})}
              placeholder="/backups/database/"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Note: Ensure the FTP user has write permissions to this directory.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded font-bold transition shadow-lg ${
              saving ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
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
            Save FTP Configuration
          </button>

          {status === 'success' && (
            <div className="flex items-center gap-2 text-green-600 justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium">FTP Settings saved successfully</span>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center gap-2 text-red-600 justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium">Failed to save FTP settings</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default FtpBackupSettings;
