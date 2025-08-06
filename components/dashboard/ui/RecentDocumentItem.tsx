import React from 'react';
import { FileText, MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface RecentDocumentItemProps {
  id: string;
  title: string;
  author: string;
  time: string;
  views: number;
  onMoreClick?: () => void;
}

function RecentDocumentItem({ id, title, author, time, views, onMoreClick }: RecentDocumentItemProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/policy/${id}`);
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMoreClick?.();
  };

  return (
    <div 
      className="d-flex align-items-center p-3 border-bottom cursor-pointer"
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      <FileText size={16} className="text-muted me-3" />
      <div className="flex-grow-1">
        <h6 className="mb-1">{title}</h6>
        <small className="text-muted">
          by {author} • {time}
        </small>
      </div>
      <div className="text-end">
        <small className="text-muted">{views} views</small>
        <button className="btn btn-link p-1 ms-2" onClick={handleMoreClick} aria-label="More options">
          <MoreHorizontal size={16} />
        </button>
      </div>
    </div>
  );
}

export default RecentDocumentItem; 