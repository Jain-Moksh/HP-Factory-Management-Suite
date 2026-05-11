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

        {/* Analytics Hero Section */}
        <div className="mt-12 px-6">
           <div className="bg-brand-navy rounded-3xl p-10 relative overflow-hidden text-white shadow-2xl">
              <div className="relative z-10 max-w-2xl">
                <h2 className="text-2xl font-black mb-4 tracking-tight">Enterprise Analytics Suite</h2>
                <p className="text-white/60 text-sm leading-relaxed mb-8">
                  Gain deep insights into your inventory cycle, sales velocities, and partner performance. 
                  Our multi-dimensional reporting system helps you make data-driven decisions for your growing business.
                </p>
                <div className="flex gap-4">
                  <div className="px-4 py-2 bg-white/10 rounded-lg backdrop-blur-md">
                    <span className="text-[10px] uppercase font-bold opacity-50 block mb-1">Total Data Items</span>
                    <span className="text-xl font-bold tracking-tighter tracking-widest leading-none">REAL-TIME</span>
                  </div>
                  <div className="px-4 py-2 bg-white/10 rounded-lg backdrop-blur-md">
                    <span className="text-[10px] uppercase font-bold opacity-50 block mb-1">Accuracy Level</span>
                    <span className="text-xl font-bold tracking-tighter leading-none">100% AUDITABLE</span>
                  </div>
                </div>
              </div>
              
              {/* Decorative SVG background */}
              <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4">
                <svg className="w-96 h-96 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
           </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReportsDashboard;
