import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';

const Utility = () => {
  const navigate = useNavigate();

  const utilities = [
    {
      title: 'Database Backup',
      description: 'Create manual snapshots or configure automatic background backups for data protection.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
      path: '/utility/backup',
      color: 'bg-blue-600'
    },
    {
      title: 'System Restore',
      description: 'Recover your entire system state from a previously saved .sql or .backup file.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      path: '/utility/restore',
      color: 'bg-red-600'
    },
    {
      title: 'Password Manager',
      description: 'Change system passwords and manage security access levels for different modules.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      path: '/utility', // Placeholder
      color: 'bg-emerald-600',
      comingSoon: true
    },
    {
      title: 'System Audit',
      description: 'View detailed logs of all user activities and data modifications across the system.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      path: '/utility', // Placeholder
      color: 'bg-purple-600',
      comingSoon: true
    }
  ];

  return (
    <Layout>
      <div className="flex flex-col min-h-screen relative pb-16 bg-slate-50/50">
        <PageHeader 
          title="Utility Dashboard" 
          subtitle="SYSTEM TOOLS, CONFIGURATIONS AND MAINTENANCE" 
        />
        
        <div className="px-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {utilities.map((util) => (
              <div 
                key={util.title}
                onClick={() => !util.comingSoon && navigate(util.path)}
                className={`group relative bg-white border border-border-soft rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden ${util.comingSoon ? 'opacity-80' : ''}`}
              >
                {/* Background Accent */}
                <div className={`absolute top-0 right-0 w-24 h-24 ${util.color} opacity-[0.03] -mr-8 -mt-8 rounded-full group-hover:scale-150 transition-transform duration-500`}></div>
                
                <div className={`w-14 h-14 ${util.color} rounded-xl flex items-center justify-center text-white mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {util.icon}
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-[15px] font-bold text-text-primary group-hover:text-brand-blue transition-colors">
                    {util.title}
                  </h3>
                  {util.comingSoon && (
                    <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">
                      Coming Soon
                    </span>
                  )}
                </div>
                
                <p className="text-[12px] text-text-light leading-relaxed opacity-70">
                  {util.description}
                </p>
                
                {!util.comingSoon && (
                  <div className="mt-6 flex items-center text-brand-blue font-bold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Access Tool</span>
                    <svg className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Utility;
