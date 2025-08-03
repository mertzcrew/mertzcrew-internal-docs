"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  FileText, 
  Search, 
  Plus, 
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
  ArrowLeft,
  Eye,
  Edit,
  Trash2,
  Calendar,
  User
} from "lucide-react";

interface Policy {
  _id: string;
  title: string;
  description: string;
  category: string;
  organization: string;
  tags: string[];
  created_at: string;
  created_by: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface CategoryStats {
  name: string;
  count: number;
  icon: React.ElementType;
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showAllPolicies, setShowAllPolicies] = useState(false);
  const [filteredPolicies, setFilteredPolicies] = useState<Policy[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletePolicyId, setDeletePolicyId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();

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
    fetchPolicies();
  }, []);

  useEffect(() => {
    // Group policies by category and create stats
    const categoryCounts = policies.reduce((acc, policy) => {
      const category = policy.category || "Uncategorized";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const stats = Object.keys(categoryCounts).map(category => ({
      name: category,
      count: categoryCounts[category],
      icon: getCategoryIcon(category)
    }));

    setCategoryStats(stats);
  }, [policies]);

  useEffect(() => {
    // Filter policies based on search term when showing all policies
    if (showAllPolicies) {
      const filtered = policies.filter(policy =>
        policy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        policy.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        policy.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        policy.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPolicies(filtered);
    }
  }, [policies, searchTerm, showAllPolicies]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/policies');
      const result = await response.json();

      if (response.ok) {
        setPolicies(result.data);
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

  const filteredCategories = categoryStats.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCategoryClick = (categoryName: string) => {
    const encodedCategory = encodeURIComponent(categoryName);
    router.push(`/policies/${encodedCategory}`);
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
    } catch (err) {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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
          <div>
            <h4 className="mb-0">
              {showAllPolicies ? 'All Policies' : 'Policy Categories'}
            </h4>
            <small className="text-muted">
              {showAllPolicies 
                ? `${filteredPolicies.length} polic${filteredPolicies.length !== 1 ? 'ies' : 'y'}`
                : `${policies.length} total polic${policies.length !== 1 ? 'ies' : 'y'} across ${categoryStats.length} categor${categoryStats.length !== 1 ? 'ies' : 'y'}`
              }
            </small>
          </div>
          <div className="d-flex gap-2">
            {!showAllPolicies && (
              <button 
                className="btn btn-outline-primary"
                onClick={() => setShowAllPolicies(true)}
              >
                <FileText size={16} className="me-2" />
                View All Policies
              </button>
            )}
            {showAllPolicies && (
              <button 
                className="btn btn-outline-secondary"
                onClick={() => setShowAllPolicies(false)}
              >
                <ArrowLeft size={16} className="me-2" />
                Back to Categories
              </button>
            )}
            <button 
              className="btn btn-primary"
              onClick={() => router.push('/new_policy')}
            >
              <Plus size={16} className="me-2" />
              New Policy
            </button>
          </div>
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
              placeholder={showAllPolicies ? "Search policies..." : "Search categories..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* All Policies List View */}
        {showAllPolicies ? (
          filteredPolicies.length === 0 ? (
            <div className="text-center py-5">
              <FileText size={48} className="text-muted mb-3" />
              <h5 className="text-muted">
                {searchTerm ? 'No policies found matching your search' : 'No policies found'}
              </h5>
              {!searchTerm && (
                <button 
                  className="btn btn-primary mt-3"
                  onClick={() => router.push('/new_policy')}
                >
                  <Plus size={16} className="me-2" />
                  Create Your First Policy
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
                          <ul className="dropdown-menu">
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
                          </ul>
                        </div>
                      </div>
                      
                      <p className="card-text text-muted small mb-3">
                        {policy.description}
                      </p>
                      
                      <div className="mb-3">
                        <span className="badge bg-primary me-2">{policy.category}</span>
                        {policy.tags && policy.tags.length > 0 && (
                          <div className="mt-2">
                            {policy.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="badge bg-light text-dark me-1 small">
                                {tag}
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
          )
        ) : (
          // Category Cards View (existing code)
          filteredCategories.length === 0 ? (
            <div className="text-center py-5">
              <FileText size={48} className="text-muted mb-3" />
              <h5 className="text-muted">
                {searchTerm ? 'No categories found matching your search' : 'No policy categories found'}
              </h5>
              {!searchTerm && (
                <button 
                  className="btn btn-primary mt-3"
                  onClick={() => router.push('/new_policy')}
                >
                  <Plus size={16} className="me-2" />
                  Create Your First Policy
                </button>
              )}
            </div>
          ) : (
            <div className="row">
              {filteredCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <div key={category.name} className="col-md-6 col-lg-4 col-xl-3 mb-4">
                    <div 
                      className="card h-100 border-0 shadow-sm cursor-pointer"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleCategoryClick(category.name)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                      }}
                    >
                      <div className="card-body text-center p-4">
                        <div className="mb-3">
                          <div 
                            className="rounded-circle d-flex align-items-center justify-content-center mx-auto"
                            style={{
                              width: "64px",
                              height: "64px",
                              backgroundColor: "#f8f9fa",
                              color: "#ca1f27"
                            }}
                          >
                            <Icon size={32} />
                          </div>
                        </div>
                        
                        <h5 className="card-title mb-2">{category.name}</h5>
                        
                        <div className="d-flex align-items-center justify-content-center">
                          <span className="badge bg-primary fs-6">
                            {category.count} polic{category.count !== 1 ? 'ies' : 'y'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
} 