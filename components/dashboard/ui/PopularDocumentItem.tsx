import React from 'react';

export interface PopularDocumentItemProps {
  rank: number;
  title: string;
  views: number;
  change: string;
}

function PopularDocumentItem({ rank, title, views, change }: PopularDocumentItemProps) {
  return (
    <div className="d-flex align-items-center p-3 border-bottom">
      <div
        className="rounded-circle d-flex align-items-center justify-content-center me-3 fw-bold text-white"
        style={{
          width: '24px',
          height: '24px',
          backgroundColor: '#ca1f27',
          fontSize: '12px',
        }}
      >
        #{rank}
      </div>
      <div className="flex-grow-1">
        <h6 className="mb-1">{title}</h6>
        <small className="text-muted">{views} views</small>
      </div>
      <span className="badge bg-success">{change}</span>
    </div>
  );
}

export default PopularDocumentItem; 