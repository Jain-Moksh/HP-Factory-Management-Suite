import React from 'react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import './Dashboard.css';

const Dashboard = () => {
  const stats = [
    { label: 'Total Revenue', value: '$124,500.00', change: '+12.5%', icon: '💰' },
    { label: 'Total Orders', value: '1,240', change: '+8.2%', icon: '🛒' },
    { label: 'Active Customers', value: '482', change: '+3.1%', icon: '👥' },
    { label: 'Pending Shipments', value: '18', change: '-2.4%', icon: '📦' },
  ];

  const recentTransactions = [
    { id: 'TX-1001', customer: 'Global Motors', date: '2026-03-29', amount: '$4,200.00', status: 'Completed' },
    { id: 'TX-1002', customer: 'Nexus Industrial', date: '2026-03-28', amount: '$1,850.50', status: 'Pending' },
    { id: 'TX-1003', customer: 'Smith & Co', date: '2026-03-28', amount: '$2,400.00', status: 'Completed' },
    { id: 'TX-1004', customer: 'TechFlow Solutions', date: '2026-03-27', amount: '$850.00', status: 'Cancelled' },
    { id: 'TX-1005', customer: 'Apex Logistics', date: '2026-03-26', amount: '$12,400.00', status: 'Completed' },
  ];

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <div className="page-actions">
          <Button variant="secondary">Export Report</Button>
          <Button variant="primary">+ New Transaction</Button>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <Card key={stat.label} className="stat-card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-info">
              <span className="stat-label">{stat.label}</span>
              <h2 className="stat-value">{stat.value}</h2>
              <span className={`stat-change ${stat.change.startsWith('+') ? 'positive' : 'negative'}`}>
                {stat.change} <span>vs last month</span>
              </span>
            </div>
          </Card>
        ))}
      </div>

      <div className="dashboard-grid">
        <Card title="Recent Transactions" subtitle="List of the last 5 transactions made by customers." noPadding>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td><span className="text-bold">{tx.id}</span></td>
                    <td>{tx.customer}</td>
                    <td>{tx.date}</td>
                    <td>{tx.amount}</td>
                    <td>
                      <span className={`status-badge ${tx.status.toLowerCase()}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td>
                      <Button variant="secondary" size="sm">View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
