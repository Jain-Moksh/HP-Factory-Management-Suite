import React, { useState, useEffect } from 'react';
import Card from '../UI/Card';
import Button from '../UI/Button';

const ManualBackup = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(null); // 'success', 'error'

  useEffect(() => {
    let interval;
    if (loading) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) return prev; // Stay at 95% until finished
          return prev + Math.random() * 15;
        });
      }, 300);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleBackup = async () => {
    setLoading(true);
    setStatus(null);
    try {
      // Get base URL
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
      
      // Trigger download
      window.location.href = `${baseUrl}/api/backup/manual`;
      
      // Simulation finishes after a delay
      setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setStatus('success');
          setLoading(false);
        }, 500);
      }, 3000);
    } catch (error) {
      console.error('Backup failed:', error);
      setStatus('error');
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
            <span className="text-sm font-medium">Backup failed. Please contact administrator.</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ManualBackup;
