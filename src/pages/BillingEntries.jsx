import React from 'react';
import Layout from '../components/Layout';
import BillingHeader from '../components/BillingHeader';
import FilterBar from '../components/FilterBar';
import BillingTable from '../components/BillingTable';

const BillingEntries = () => {
  return (
    <Layout>
      <div className="flex flex-col gap-2">
        <BillingHeader />
        
        {/* Main Content Sections */}
        <div className="flex flex-col gap-6">
          <FilterBar />
          <BillingTable />
        </div>
      </div>
    </Layout>
  );
};

export default BillingEntries;
