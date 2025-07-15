import React from 'react';

export interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
  color: string;
}

function StatCard({ title, value, change, icon: Icon, color }: StatCardProps) {
  return (
    <div className="card h-100 border-0 shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <p className="text-muted mb-1 small">{title}</p>
            <h3 className="mb-0">{value}</h3>
          </div>
          <Icon size={24} className={color} />
        </div>
        <div className="d-flex align-items-center">
          <span className="me-1">
            {/* TrendingUp icon is used in Dashboard, but not passed as prop. Leave as placeholder or accept as prop if needed. */}
            <svg width="12" height="12" fill="currentColor" className="text-success" viewBox="0 0 16 16"><path d="M0 13l4-4 4 4 8-8" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
          </span>
          <small className="text-success">{change}</small>
        </div>
      </div>
    </div>
  );
}

export default StatCard; 