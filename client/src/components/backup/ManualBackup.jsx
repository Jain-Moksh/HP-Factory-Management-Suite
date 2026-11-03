import React, { useState, useEffect, useRef } from 'react';
import Card from '../UI/Card';

const ManualBackup = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(null); // 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const progressTimer = useRef(null);

  // Stop the progress animation if the screen is closed mid-backup
  useEffect(() => () => clearInterval(progressTimer.current), []);

  const startProgress = () => {
    setProgress(0);
    clearInterval(progressTimer.current);
    progressTimer.current = setInterval(() => {
      // Creeps towards 95% and waits there until the server has really finished
      setProgress(prev => (prev >= 95 ? prev : prev + Math.random() * 15));
    }, 300);
  };

  const stopProgress = () => {
    clearInterval(progressTimer.current);
    progressTimer.current = null;
  };

  const handleBackup = async () => {
    setLoading(true);
    setStatus(null);
    setErrorMessage('');
    startProgress();
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;

      // The server answers only once the whole backup exists, or with an error message if it failed
      const response = await fetch(`${baseUrl}/api/backup/manual`);
      if (!response.ok) {
        let message = 'Backup failed. Please try again.';
        try {
          const data = await response.json();
          if (data.message) message = data.message;
        } catch {
          // Not JSON: keep the generic message
        }
        throw new Error(message);
      }

      const disposition = response.headers.get('Content-Disposition') || '';
      const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
      const filename = match ? decodeURIComponent(match[1]) : 'Backup.sql';
      const blob = await response.blob();

      // Hand the finished file to the browser as a download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      setStatus('success');
    } catch (error) {
      console.error('Backup failed:', error);
      setErrorMessage(error.message);
      setStatus('error');
    } finally {
      stopProgress();
      setProgress(0);
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800">Manual Backup</h3>
          <p className="text-sm text-slate-500 uppercase tracking-wider">Download a complete copy of your database</p>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
        <p className="text-slate-600 text-sm leading-relaxed">
          Creating a manual backup will generate a <strong>.sql</strong> file containing all tables, 
          sequences, and data. This file is saved directly to your computer and can be used to 
          restore the system in case of emergency.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {loading && (
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <span>Generating SQL Dump</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-brand-blue h-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        <button 
          onClick={handleBackup} 
          disabled={loading}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded font-bold transition shadow-lg ${
            loading ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-brand-blue hover:bg-brand-blue-hover text-white shadow-brand-blue/20'
          }`}
        >
          {!loading && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          )}
          {loading ? 'Processing Backup...' : 'Create & Download Backup'}
        </button>

        {status === 'success' && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg border border-green-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Backup generated successfully. Check your downloads.</span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">{errorMessage || 'Backup failed. Please contact administrator.'}</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ManualBackup;
