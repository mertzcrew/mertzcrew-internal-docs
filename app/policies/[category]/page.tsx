"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
  Award
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

export default function CategoryPoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
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
    fetchPolicies();
  }, []);

  useEffect(() => {
    // Filter policies based on search term
    const filtered = policies.filter(policy =>
      policy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
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

  const CategoryIcon = getCategoryIcon(categoryName);

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
                        <ul className="dropdown-menu">
                          <li><a className="dropdown-item" href="#"><Eye size={14} className="me-2" />View</a></li>
                          <li><a className="dropdown-item" href="#"><Edit size={14} className="me-2" />Edit</a></li>
                        </ul>
                      </div>
                    </div>
                    
                    <p className="card-text text-muted small mb-3">
                      {policy.description}
                    </p>
                    
                    <div className="mb-3">
                      {policy.tags && policy.tags.length > 0 && (
                        <div className="mb-2">
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
        )}
      </div>
    </div>
  );
} 