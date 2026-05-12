import React from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import RestoreSystem from '../../components/backup/RestoreSystem';

const RestoreManager = () => {
  return (
    <Layout>
      <div className="flex flex-col min-h-screen relative pb-16 bg-slate-50/50">
        <PageHeader 
          title="System Restore" 
          subtitle="RECOVER DATABASE FROM BACKUP FILES" 
        />
        
        <div className="px-6 mt-6 max-w-2xl mx-auto w-full">
          <RestoreSystem />
        </div>
      </div>
    </Layout>
  );
};

export default RestoreManager;
