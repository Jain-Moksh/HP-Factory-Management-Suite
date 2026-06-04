import React from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import ManualBackup from '../../components/backup/ManualBackup';
import AutoBackupSettings from '../../components/backup/AutoBackupSettings';
import FtpBackupSettings from '../../components/backup/FtpBackupSettings';

const BackupManager = () => {
  return (
    <Layout>
      <div className="flex flex-col min-h-screen relative pb-16 bg-slate-50/50">
        <PageHeader 
          title="Backup Management" 
          subtitle="MANUAL AND AUTOMATIC DATABASE PROTECTION" 
        />
        
        <div className="px-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ManualBackup />
            <AutoBackupSettings />
            <FtpBackupSettings />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BackupManager;
