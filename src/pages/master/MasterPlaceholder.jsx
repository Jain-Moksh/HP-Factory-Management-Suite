import React from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/UI/Card';

const MasterPlaceholder = ({ type }) => {
  return (
    <Layout>
      <div className="flex flex-col min-h-screen pb-10">
        <PageHeader 
          title={`${type} List`} 
          subtitle={`MANAGE ${type.toUpperCase()} MASTER DATA`} 
        />

        <div className="px-6">
          <Card className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-16 h-16 bg-bg-main rounded-full flex items-center justify-center text-brand-blue">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 01-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-text-primary tracking-tight">{type} Master Module</h2>
              <p className="text-sm text-text-light max-w-xs mx-auto">
                This module is currently under development. You will soon be able to manage your {type.toLowerCase()} master data here.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default MasterPlaceholder;
