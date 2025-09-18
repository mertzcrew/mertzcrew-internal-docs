"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BookOpenText, Search, Plus, Eye, Edit, Calendar, User } from 'lucide-react';

interface Policy {
  _id: string;
  title: string;
  description: string;
  category: string;
  organization: string;
  tags: string[];
  status: string;
  pending_changes?: Record<string, unknown>;
  assigned_users?: Array<{
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  }>;
  created_at: string;
  created_by: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function ProcessesPage() {
  const [processes, setProcesses] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [filteredProcesses, setFilteredProcesses] = useState<Policy[]>([]);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    
    if (status === 'authenticated') {
      fetchProcesses();
    }
  }, [status, session, router]);

  useEffect(() => {
    // Filter processes based on search term
    const filtered = processes.filter(process =>
      process.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredProcesses(filtered);
  }, [processes, searchTerm]);

  const fetchProcesses = async () => {
    try {
      setLoading(true);
      console.log('Fetching processes with category=Process');
      const response = await fetch('/api/policies?category=Process');
      const result = await response.json();
      console.log('API response:', result);

      if (response.ok) {
        setProcesses(result.data || []);
        console.log('Processes loaded:', result.data?.length || 0);
      } else {
        setError(result.message || 'Failed to fetch processes');
      }
    } catch (error) {
      console.error('Error fetching processes:', error);
      setError('An error occurred while fetching processes');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (process: Policy) => {
    // Check if user can see pending changes (admins or assigned users)
    const canSeePendingChanges = session?.user?.role === 'admin' || 
      process.assigned_users?.some(user => user._id.toString() === session?.user?.id);
    
    if (process.pending_changes && Object.keys(process.pending_changes).length > 0 && canSeePendingChanges) {
      return <span className="badge bg-warning">Pending Changes</span>;
    }
    if (process.status === 'active') {
      return <span className="badge bg-success">Published</span>;
    }
    return <span className="badge bg-secondary">Draft</span>;
  };

  if (status === 'loading') {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow-1">
        <div className="p-4">
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow-1">
      <div className="p-4">
        {/* Hero Section */}
        <div className="rounded p-4 mb-4 text-white position-relative" style={{ backgroundColor: "#ca1f27" }}>
          <div className="row align-items-center">
            <div className="col-md-8">
              <h2 className="mb-3">Processes</h2>
              <p className="mb-4 opacity-90">
                Access standard operating procedures, workflows, and process documentation.
              </p>
            </div>
            <div className="col-md-4 text-end">
              <BookOpenText size={120} className="opacity-25" />
            </div>
          </div>
        </div>

        {/* Page-specific controls */}
        <div className="p-3 border-bottom">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-1">Process Documentation</h5>
              <small className="text-muted">
                {filteredProcesses.length} process{filteredProcesses.length !== 1 ? 'es' : ''} available
              </small>
            </div>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-primary"
                onClick={() => router.push('/new_policy')}
              >
                <Plus size={16} className="me-2" />
                New Process
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-bottom">
          <div className="position-relative">
            <Search
              size={16}
              className="position-absolute text-muted"
              style={{ left: "12px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              className="form-control ps-5"
              placeholder="Search processes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Processes List */}
        <div className="p-4">
          {filteredProcesses.length === 0 ? (
            <div className="text-center py-5">
              <BookOpenText size={48} className="text-muted mb-3" />
              <h5 className="text-muted">
                {searchTerm ? 'No processes found matching your search' : 'No processes found'}
              </h5>
              {!searchTerm && (
                <div>
                  <p className="text-muted mb-3">
                    No process documentation has been created yet. Create your first process document to get started.
                  </p>
                  <button 
                    className="btn btn-primary mt-3"
                    onClick={() => router.push('/new_policy')}
                  >
                    <Plus size={16} className="me-2" />
                    Create Your First Process
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="row">
              {filteredProcesses.map((process) => (
                <div key={process._id} className="col-md-6 col-lg-4 mb-3">
                  <div 
                    className="card h-100 border-0 shadow-sm"
                    style={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/policy/${process._id}`)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    }}
                  >
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="card-title mb-0">{process.title}</h6>
                        <div className="dropdown">
                          <button 
                            className="btn btn-link btn-sm p-0" 
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-muted">•••</span>
                          </button>
                          <ul className="dropdown-menu">
                            <li>
                              <a 
                                className="dropdown-item" 
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  router.push(`/policy/${process._id}`);
                                }}
                              >
                                <Eye size={14} className="me-2" />View
                              </a>
                            </li>
                            <li>
                              <a 
                                className="dropdown-item" 
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  router.push(`/policy/${process._id}/edit`);
                                }}
                              >
                                <Edit size={14} className="me-2" />Edit
                              </a>
                            </li>
                          </ul>
                        </div>
                      </div>
                      
                      <p className="card-text text-muted small mb-3">
                        {process.description}
                      </p>
                      
                      <div className="mb-3">
                        <div className="mb-2">
                          {getStatusBadge(process)}
                          <span className="badge bg-primary ms-2">Process</span>
                        </div>
                        {process.tags && process.tags.length > 0 && (
                          <div>
                            {process.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="badge bg-light text-dark me-1 small">
                                {tag}
                              </span>
                            ))}
                            {process.tags.length > 3 && (
                              <span className="badge bg-light text-dark small">
                                +{process.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center text-muted small">
                          <Calendar size={12} className="me-1" />
                          {formatDate(process.created_at)}
                        </div>
                        <div className="d-flex align-items-center text-muted small">
                          <User size={12} className="me-1" />
                          {process.created_by?.first_name} {process.created_by?.last_name}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 