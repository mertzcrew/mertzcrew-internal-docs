"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  FileText, 
  Search, 
  Plus, 
  ArrowLeft, 
  Eye, 
  Edit, 
  Calendar, 
  User,
  Users, 
  Building2, 
  Star, 
  Shield, 
  Briefcase, 
  Heart, 
  Zap,
  BookOpen,
  Settings,
  Globe,
  Home,
  Award,
  Trash2
} from "lucide-react";

interface Policy {
  _id: string;
  title: string;
  description: string;
  category: string;
  organization: string;
  tags: Array<{
    _id: string;
    name: string;
    color: string;
  }>;
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

export default function CategoryPoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletePolicyId, setDeletePolicyId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const categoryName = decodeURIComponent(params.category as string);
  // Icon mapping for categories
  const getCategoryIcon = (categoryName: string) => {
    const category = categoryName.toLowerCase();
    if (category.includes('hr') || category.includes('human')) return Users;
    if (category.includes('safety') || category.includes('security')) return Shield;
    if (category.includes('training') || category.includes('education')) return BookOpen;
    if (category.includes('culture') || category.includes('values')) return Heart;
    if (category.includes('technology') || category.includes('tech')) return Zap;
    if (category.includes('operations') || category.includes('ops')) return Settings;
    if (category.includes('finance') || category.includes('accounting')) return Briefcase;
    if (category.includes('marketing') || category.includes('brand')) return Star;
    if (category.includes('legal') || category.includes('compliance')) return Building2;
    if (category.includes('general') || category.includes('company')) return Home;
    if (category.includes('award') || category.includes('recognition')) return Award;
    if (category.includes('international') || category.includes('global')) return Globe;
    return FileText; // Default icon
  };

  useEffect(() => {
    if (status === 'loading') return; // Still loading
    
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    
    if (status === 'authenticated') {
      fetchPolicies();
    }
  }, [status, session]);

  useEffect(() => {
    // Filter policies based on search term
    const filtered = policies.filter(policy =>
      policy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.tags.some(tag => tag.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredPolicies(filtered);
  }, [policies, searchTerm]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/policies');
      const result = await response.json();

      if (response.ok) {
        // Filter policies by category
        const categoryPolicies = result.data.filter((policy: Policy) => 
          policy.category === categoryName
        );
        setPolicies(categoryPolicies);
      } else {
        setError(result.message || 'Failed to fetch policies');
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
      setError('An error occurred while fetching policies');
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

  const handleDelete = async () => {
    if (!deletePolicyId) return;
    
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/policies/${deletePolicyId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Remove the deleted policy from the list
        setPolicies(prevPolicies => prevPolicies.filter(policy => policy._id !== deletePolicyId));
        setShowDeleteConfirm(false);
        setDeletePolicyId(null);
      } else {
        setError(result.message || 'Failed to delete policy');
        setShowDeleteConfirm(false);
        setDeletePolicyId(null);
      }
    } catch {
      setError('An error occurred while deleting the policy');
      setShowDeleteConfirm(false);
      setDeletePolicyId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = (policyId: string) => {
    setDeletePolicyId(policyId);
    setShowDeleteConfirm(true);
  };

  const getStatusBadge = (policy: Policy) => {
    if (policy.pending_changes && Object.keys(policy.pending_changes).length > 0) {
      return <span className="badge bg-warning">Pending Changes</span>;
    }
    if (policy.status === 'active') {
      return <span className="badge bg-success">Published</span>;
    }
    return <span className="badge bg-secondary">Draft</span>;
  };

  const CategoryIcon = getCategoryIcon(categoryName);

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
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow-1">
      {/* Header */}
      <div className="bg-white border-bottom p-3">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <button 
              className="btn btn-link text-decoration-none me-3"
              onClick={() => router.push('/policies')}
            >
              <ArrowLeft size={16} className="me-1" />
              Back to Categories
            </button>
            <div>
              <h4 className="mb-0 d-flex align-items-center">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: "32px",
                    height: "32px",
                    backgroundColor: "#f8f9fa",
                    color: "#ca1f27"
                  }}
                >
                  <CategoryIcon size={18} />
                </div>
                {categoryName}
              </h4>
              <small className="text-muted">
                {policies.length} polic{policies.length !== 1 ? 'ies' : 'y'} in this category
              </small>
            </div>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => router.push('/new_policy')}
          >
            <Plus size={16} className="me-2" />
            New Policy
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show m-3" role="alert">
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Deletion</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePolicyId(null);
                  }}
                  disabled={isDeleting}
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this policy?</p>
                <p className="text-danger mb-0">This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePolicyId(null);
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Deleting...
                    </>
                  ) : (
                    'Delete Policy'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Search Bar */}
        <div className="mb-4">
          <div className="position-relative">
            <Search
              size={16}
              className="position-absolute text-muted"
              style={{ left: "12px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              className="form-control ps-5"
              placeholder="Search policies in this category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Policies List */}
        {filteredPolicies.length === 0 ? (
          <div className="text-center py-5">
            <FileText size={48} className="text-muted mb-3" />
            <h5 className="text-muted">
              {searchTerm ? 'No policies found matching your search' : 'No policies in this category'}
            </h5>
            {!searchTerm && (
              <button 
                className="btn btn-primary mt-3"
                onClick={() => router.push('/new_policy')}
              >
                <Plus size={16} className="me-2" />
                Create First Policy in {categoryName}
              </button>
            )}
          </div>
        ) : (
          <div className="row">
            {filteredPolicies.map((policy) => (
              <div key={policy._id} className="col-md-6 col-lg-4 mb-3">
                <div 
                  className="card h-100 border-0 shadow-sm"
                  style={{ cursor: 'pointer' }}
                  onClick={() => router.push(`/policy/${policy._id}`)}
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
                      <h6 className="card-title mb-0">{policy.title}</h6>
                      <div className="dropdown">
                        <button 
                          className="btn btn-link btn-sm p-0" 
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-muted">•••</span>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end">
                          <li>
                            <a 
                              className="dropdown-item" 
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                router.push(`/policy/${policy._id}`);
                              }}
                            >
                              <Eye size={14} className="me-2" />View
                            </a>
                          </li>
                          {session?.user?.role === 'admin' && (
                            <>
                              <li>
                                <a 
                                  className="dropdown-item" 
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    router.push(`/policy/${policy._id}/edit`);
                                  }}
                                >
                                  <Edit size={14} className="me-2" />Edit
                                </a>
                              </li>
                              <li><hr className="dropdown-divider" /></li>
                              <li>
                                <a 
                                  className="dropdown-item text-danger" 
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    confirmDelete(policy._id);
                                  }}
                                >
                                  <Trash2 size={14} className="me-2" />Delete
                                </a>
                              </li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                    
                    <p className="card-text text-muted small mb-3">
                      {policy.description}
                    </p>
                    
                    <div className="mb-3">
                      <div className="mb-2">
                        {getStatusBadge(policy)}
                      </div>
                      {policy.tags && policy.tags.length > 0 && (
                        <div>
                          {policy.tags.slice(0, 3).map((tag) => (
                            <span 
                              key={tag._id} 
                              className="badge text-white me-1 small"
                              style={{ backgroundColor: tag.color }}
                            >
                              {tag.name}
                            </span>
                          ))}
                          {policy.tags.length > 3 && (
                            <span className="badge bg-light text-dark small">
                              +{policy.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center text-muted small">
                        <Calendar size={12} className="me-1" />
                        {formatDate(policy.created_at)}
                      </div>
                      <div className="d-flex align-items-center text-muted small">
                        <User size={12} className="me-1" />
                        {policy.created_by?.first_name} {policy.created_by?.last_name}
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
  );
} 