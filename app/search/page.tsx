'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, FileText, Clock, User, Building2, Tag } from 'lucide-react';

interface Policy {
  _id: string;
  title: string;
  description: string;
  category: string;
  organization: string;
  status: string;
  tags: string[];
  createdAt: string;
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

export default function SearchPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Get initial query from URL
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    setQuery(urlQuery);
    if (urlQuery) {
      performSearch(urlQuery, 1);
    }
  }, [searchParams]);

  const performSearch = async (searchQuery: string, page: number = 1) => {
    if (!session || !searchQuery.trim()) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&page=${page}&limit=20`);
      
      if (response.ok) {
        const data: { success: boolean; data: SearchResult } = await response.json();
        if (data.success) {
          setResults(data.data.policies);
          setTotalCount(data.data.pagination.totalCount);
          setTotalPages(data.data.pagination.totalPages);
          setCurrentPage(data.data.pagination.page);
        }
      }
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handlePageChange = (page: number) => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}&page=${page}`);
    }
  };

  const handlePolicyClick = (policyId: string) => {
    router.push(`/policy/${policyId}`);
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

  if (status === 'loading') {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h3">Search Results</h1>
            <button
              className="btn btn-outline-secondary"
              onClick={() => router.push('/dashboard')}
            >
              Back to Dashboard
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-4">
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
              />
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Searching...
                  </>
                ) : (
                  'Search'
                )}
              </button>
            </div>
          </form>

          {/* Results Summary */}
          {query && (
            <div className="mb-3">
              <p className="text-muted">
                {loading ? 'Searching...' : `Found ${totalCount} result${totalCount !== 1 ? 's' : ''} for "${query}"`}
              </p>
            </div>
          )}

          {/* Search Results */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-5">
              {query ? (
                <>
                  <Search size={48} className="text-muted mb-3" />
                  <h4 className="text-muted">No policies found</h4>
                  <p className="text-muted">Try adjusting your search terms or browse all policies.</p>
                </>
              ) : (
                <>
                  <Search size={48} className="text-muted mb-3" />
                  <h4 className="text-muted">Enter a search term</h4>
                  <p className="text-muted">Search for policies by title, description, content, category, or tags.</p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="list-group">
                {results.map((policy) => (
                  <div
                    key={policy._id}
                    className="list-group-item list-group-item-action cursor-pointer"
                    onClick={() => handlePolicyClick(policy._id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-start">
                      <div className="me-3">
                        <FileText size={20} className="text-primary" />
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start">
                          <h5 className="mb-1">{policy.title}</h5>
                          <div className="d-flex gap-2">
                            <span className={`badge ${getStatusBadge(policy.status)}`}>
                              {getStatusText(policy.status)}
                            </span>
                          </div>
                        </div>
                        
                        {policy.description && (
                          <p className="mb-2 text-muted">{policy.description}</p>
                        )}
                        
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span className="badge bg-secondary">
                            {policy.category}
                          </span>
                          <span className="badge bg-light text-dark">
                            {policy.organization}
                          </span>
                          {policy.tags && policy.tags.length > 0 && (
                            <>
                              <Tag size={12} className="text-muted" />
                              {policy.tags.slice(0, 3).map((tag, idx) => (
                                <span key={idx} className="badge bg-outline-secondary">
                                  {tag}
                                </span>
                              ))}
                              {policy.tags.length > 3 && (
                                <span className="text-muted small">
                                  +{policy.tags.length - 3} more
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        
                        <div className="d-flex align-items-center gap-3 text-muted small">
                          <span>
                            <User size={12} className="me-1" />
                            {policy.created_by.first_name} {policy.created_by.last_name}
                          </span>
                          <span>
                            <Clock size={12} className="me-1" />
                            {formatDate(policy.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="d-flex justify-content-center mt-4">
                  <ul className="pagination">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                    </li>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      return (
                        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </button>
                        </li>
                      );
                    })}
                    
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 