import React from 'react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Card from '../components/UI/Card';

const Dashboard = () => {
  const stats = [
    { label: 'Total Revenue', value: '$124,500.00', change: '+12.5%', icon: '💰' },
    { label: 'Total Orders', value: '1,240', change: '+8.2%', icon: '🛒' },
    { label: 'Active Customers', value: '482', change: '+3.1%', icon: '👥' },
    { label: 'Pending Shipments', value: '18', change: '-2.4%', icon: '📦' },
  ];

  return (
    <Layout>
      <div className="flex flex-col min-h-screen">
        <PageHeader title="Dashboard Overview" subtitle="WELCOME BACK, ADMINISTRATOR" />
        
        <div className="px-6 flex flex-col gap-6 w-full pb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center text-lg">{stat.icon}</div>
                <div>
                  <p className="text-[10px] font-bold text-text-primary uppercase tracking-wider">{stat.label}</p>
                  <h2 className="text-xl font-bold text-text-primary tracking-tight">{stat.value}</h2>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
