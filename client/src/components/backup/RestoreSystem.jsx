import React, { useState, useRef, useEffect } from 'react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import WarningModal from '../UI/WarningModal';

const RestoreSystem = () => {
  const [file, setFile] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState(null); // { success, message }
  const fileInputRef = useRef();

  useEffect(() => {
    let interval;
    if (restoring) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 98) return prev; 
          return prev + Math.random() * 5;
        });
      }, 500);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [restoring]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.sql') || selectedFile.name.endsWith('.backup')) {
        setFile(selectedFile);
        setResult(null);
      } else {
        alert('Invalid file type. Please select a .sql or .backup file.');
        e.target.value = null;
      }
    }
  };

  const handleRestore = async () => {
    setShowConfirm(false);
    setRestoring(true);
    setResult(null);

    const apiUrl = import.meta.env.VITE_API_URL || '';
    const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;

    const formData = new FormData();
    formData.append('backup', file);

    try {
      const response = await fetch(`${baseUrl}/api/backup/restore`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setProgress(100);
        setTimeout(() => {
          setResult({ success: true, message: 'System restored successfully!' });
          setFile(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
          setRestoring(false);
        }, 500);
      } else {
        setResult({ success: false, message: data.message || 'Restoration failed.' });
        setRestoring(false);
      }
    } catch (error) {
      setResult({ success: false, message: 'Network error during restoration.' });
      setRestoring(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-red-100 text-red-600 rounded-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800">Restore System</h3>
          <p className="text-sm text-slate-500 uppercase tracking-wider">Overwrite existing data from backup</p>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
        <svg className="w-6 h-6 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-red-700 text-xs font-medium leading-relaxed">
          <strong>WARNING:</strong> Restoring data will <strong>PERMANENTLY OVERWRITE</strong> all current 
          system records. This action cannot be undone. Ensure you have a current backup before proceeding.
        </p>
      </div>

      <div className="space-y-4">
        <div 
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-colors ${
            file ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept=".sql,.backup" 
            onChange={handleFileChange}
          />
          {file ? (
            <>
              <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="text-center">
                <p className="font-semibold text-slate-700">{file.name}</p>
                <p className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            </>
          ) : (
            <>
              <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <p className="text-sm font-medium text-slate-500">Click to select backup file</p>
              <p className="text-[10px] text-slate-400">Supported formats: .sql, .backup</p>
            </>
          )}
        </div>

        {restoring && (
          <div className="space-y-2 px-1">
            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <span>Applying Database Changes</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-red-500 h-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        <button 
          disabled={!file || restoring}
          onClick={() => setShowConfirm(true)}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded font-bold transition shadow-lg ${
            !file || restoring ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
          }`}
        >
          {!restoring && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          {restoring ? 'Restoring System...' : 'Start Restoration'}
        </button>

        {result && (
          <div className={`p-4 rounded-lg flex items-center gap-3 border ${
            result.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {result.success ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <p className="text-sm font-bold">{result.message}</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <WarningModal 
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleRestore}
        title="CRITICAL: Confirm System Restore"
        message="Are you absolutely sure you want to restore the system? This will replace the entire database with the selected backup file. CURRENT DATA WILL BE LOST FOREVER."
        confirmText="Yes, Restore Now"
        cancelText="Cancel"
      />
    </Card>
  );
};

export default RestoreSystem;
