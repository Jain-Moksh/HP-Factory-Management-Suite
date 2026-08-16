import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';

const ReportsDashboard = () => {
  const navigate = useNavigate();

  const reports = [
    {
      title: 'Stock Summary',
      description: 'Comprehensive overview of current inventory levels, quantities, and stock availability.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m14 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m14 0H4" />
        </svg>
      ),
      path: '/stock-summary',
      color: 'bg-emerald-500'
    },
    {
      title: 'Party Wise Stock',
      description: 'View stock distribution and inventory levels across all jobbers and parties.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      path: '/reports/party-stock',
      color: 'bg-blue-500'
    },
    {
      title: 'Party Wise Sales',
      description: 'Analyze total sales, quantities, and performance metrics for individual clients.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      path: '/reports/party-sales',
      color: 'bg-green-500'
    },
    {
      title: 'Group Sales Report',
      description: 'Unified sales aggregation for member groups, showcasing collective performance.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      path: '/reports/group-sales',
      color: 'bg-indigo-500'
    },
    {
      title: 'Job Work Report',
      description: 'Track purchase history and production output from jobbers and manufacturing units.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      path: '/reports/job-work',
      color: 'bg-orange-500'
    },
    {
      title: 'Detail Job Report',
      description: 'Detailed inward stock movement report from Job Work entries.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      path: '/reports/detail-job-report',
      color: 'bg-rose-500'
    },
    {
      title: 'Job Summary Report',
      description: 'Aggregated view of production quantities grouped by jobber and item for any period.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      path: '/reports/job-summary',
      color: 'bg-amber-600'
    },
    {
      title: 'Item Sold Summary',
      description: 'Aggregated sales quantities of items for any specific period, pulled from order summary.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      path: '/reports/item-sold-summary',
      color: 'bg-violet-600'
    },
    {
      title: 'Pending Payment',
      description: 'View clients with outstanding payment balances and print filtered lists.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      path: '/reports/pending-payment',
      color: 'bg-teal-500'
    }
  ];

  return (
    <Layout>
      <div className="flex flex-col min-h-screen relative pb-16">
        <PageHeader 
          title="Reports Dashboard" 
          subtitle="ANALYZE BUSINESS PERFORMANCE AND INVENTORY METRICS" 
        />
        
        <div className="px-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reports.map((report) => (
              <div 
                key={report.title}
                onClick={() => navigate(report.path)}
                className="group relative bg-white border border-border-soft rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                {/* Background Accent */}
                <div className={`absolute top-0 right-0 w-24 h-24 ${report.color} opacity-[0.03] -mr-8 -mt-8 rounded-full group-hover:scale-150 transition-transform duration-500`}></div>
                
                <div className={`w-14 h-14 ${report.color} rounded-xl flex items-center justify-center text-white mb-5 shadow-lg shadow-${report.color.split('-')[1]}-200 group-hover:scale-110 transition-transform duration-300`}>
                  {report.icon}
                </div>
                
                <h3 className="text-[15px] font-bold text-text-primary mb-2 group-hover:text-brand-blue transition-colors">
                  {report.title}
                </h3>
                
                <p className="text-[12px] text-text-light leading-relaxed opacity-70">
                  {report.description}
                </p>
                
                <div className="mt-6 flex items-center text-brand-blue font-bold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>View Report</span>
                  <svg className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReportsDashboard;
