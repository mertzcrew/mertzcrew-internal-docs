import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Clock, User, Building2 } from 'lucide-react';

interface Policy {
  _id: string;
  title: string;
  description: string;
  category: string;
  organization: string;
  status: string;
  created_at: string;
  created_by: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface SearchResult {
  policies: Policy[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

function GlobalSearch() {
  const { data: session } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch();
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Close results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const performSearch = async () => {
    if (!session) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`);
      
      if (response.ok) {
        const data: { success: boolean; data: SearchResult } = await response.json();
        if (data.success) {
          setResults(data.data.policies);
          setTotalCount(data.data.pagination.totalCount);
          setShowResults(true);
        }
      }
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (policy: Policy) => {
    setShowResults(false);
    setQuery('');
    router.push(`/policy/${policy._id}`);
  };

  const handleViewAllResults = () => {
    setShowResults(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? 'bg-success' : 'bg-warning';
  };

  const getStatusText = (status: string) => {
    return status === 'active' ? 'Published' : 'Draft';
  };

  if (!session) return null;

  return (
    <div className="position-relative" ref={searchRef}>
      <div className="input-group">
        <span className="input-group-text">
          <Search size={16} />
        </span>
        <input
          type="text"
          className="form-control"
          placeholder="Search policies..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowResults(true);
          }}
        />
        {loading && (
          <span className="input-group-text">
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </span>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="position-absolute top-100 start-0 w-100 mt-1 bg-white border rounded shadow-lg" style={{ zIndex: 1000, maxHeight: '400px', overflowY: 'auto' }}>
          {results.length === 0 ? (
            <div className="p-3 text-center text-muted">
              {query.trim().length >= 2 ? 'No policies found' : 'Type to search...'}
            </div>
          ) : (
            <>
              <div className="p-2 border-bottom">
                <small className="text-muted">
                  Found {totalCount} result{totalCount !== 1 ? 's' : ''}
                </small>
              </div>
              
              {results.map((policy) => (
                <div
                  key={policy._id}
                  className="p-3 border-bottom cursor-pointer hover-bg-light"
                  onClick={() => handleResultClick(policy)}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.classList.add('bg-light')}
                  onMouseLeave={(e) => e.currentTarget.classList.remove('bg-light')}
                >
                  <div className="d-flex align-items-start">
                    <div className="me-3">
                      <FileText size={16} className="text-primary" />
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-semibold text-truncate">
                        {policy.title}
                      </div>
                      {policy.description && (
                        <div className="text-muted small text-truncate">
                          {policy.description}
                        </div>
                      )}
                      <div className="d-flex align-items-center gap-2 mt-1">
                        <span className={`badge ${getStatusBadge(policy.status)}`}>
                          {getStatusText(policy.status)}
                        </span>
                        <span className="badge bg-secondary">
                          {policy.category}
                        </span>
                        <span className="badge bg-light text-dark">
                          {policy.organization}
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-3 mt-1 text-muted small">
                        <span>
                          <User size={12} className="me-1" />
                          {policy.created_by.first_name} {policy.created_by.last_name}
                        </span>
                        <span>
                          <Clock size={12} className="me-1" />
                          {formatDate(policy.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {totalCount > results.length && (
                <div className="p-2 text-center">
                  <button
                    className="btn btn-link btn-sm"
                    onClick={handleViewAllResults}
                  >
                    View all {totalCount} results
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default GlobalSearch; 