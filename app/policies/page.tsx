"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Search, Plus, Eye, Edit, Calendar, User } from "lucide-react";

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

interface GroupedPolicies {
  [category: string]: Policy[];
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [groupedPolicies, setGroupedPolicies] = useState<GroupedPolicies>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchPolicies();
  }, []);

  useEffect(() => {
    // Group policies by category
    const grouped = policies.reduce((acc, policy) => {
      const category = policy.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(policy);
      return acc;
    }, {} as GroupedPolicies);
    setGroupedPolicies(grouped);
  }, [policies]);

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

  const filteredGroupedPolicies = Object.keys(groupedPolicies).reduce((acc, category) => {
    const filteredPolicies = groupedPolicies[category].filter(policy =>
      policy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (filteredPolicies.length > 0) {
      acc[category] = filteredPolicies;
    }
    return acc;
  }, {} as GroupedPolicies);

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
            <h4 className="mb-0">Policies</h4>
            <small className="text-muted">
              {policies.length} total policy{policies.length !== 1 ? 'ies' : 'y'}
            </small>
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
              placeholder="Search policies by title, description, category, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Policies by Category */}
        {Object.keys(filteredGroupedPolicies).length === 0 ? (
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
          Object.keys(filteredGroupedPolicies).map((category) => (
            <div key={category} className="mb-5">
              <div className="d-flex align-items-center mb-3">
                <h5 className="mb-0 me-3">{category}</h5>
                <span className="badge bg-secondary">
                  {filteredGroupedPolicies[category].length} policy{filteredGroupedPolicies[category].length !== 1 ? 'ies' : 'y'}
                </span>
              </div>
              
              <div className="row">
                {filteredGroupedPolicies[category].map((policy) => (
                  <div key={policy._id} className="col-md-6 col-lg-4 mb-3">
                    <div className="card h-100 border-0 shadow-sm">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="card-title mb-0">{policy.title}</h6>
                          <div className="dropdown">
                            <button 
                              className="btn btn-link btn-sm p-0" 
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
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
            </div>
          ))
        )}
      </div>
    </div>
  );
} 