import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';

const Utility = () => {
  const navigate = useNavigate();

  const utilities = [];

  return (
    <Layout>
      <div className="flex flex-col min-h-screen relative pb-16">
        <PageHeader 
          title="Utility Dashboard" 
          subtitle="SYSTEM TOOLS, CONFIGURATIONS AND MAINTENANCE" 
        />
        
        <div className="px-6 mt-4">
          {/* Utilities will be added here */}
        </div>
      </div>
    </Layout>
  );
};

export default Utility;
