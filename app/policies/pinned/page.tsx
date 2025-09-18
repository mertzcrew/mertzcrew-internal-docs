"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Star, ArrowLeft } from "lucide-react";

interface Policy {
  _id: string;
  title: string;
  content: string;
  description: string;
  category: string;
  organization: string;
  tags: string[];
  status: string;
  created_by: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  views?: number;
}

export default function PinnedPoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPinnedPolicies();
    }
  }, [status]);

  const fetchPinnedPolicies = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/policies/pinned', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPolicies(data.data || []);
        } else {
          setError(data.message || 'Failed to fetch pinned policies');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || `HTTP ${response.status}: Failed to fetch pinned policies`);
      }
    } catch (error) {
      console.error('Error fetching pinned policies:', error);
      setError('Network error: Failed to fetch pinned policies');
    } finally {
      setLoading(false);
    }
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

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-10">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex align-items-center">
              <button 
                className="btn btn-link text-decoration-none me-3"
                onClick={() => router.back()}
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="mb-1">
                  <Star size={24} className="text-warning me-2" />
                  Pinned Documents
                </h2>
                <p className="text-muted mb-0">
                  Your favorite policies for quick access
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading your pinned documents...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          ) : policies.length === 0 ? (
            <div className="text-center py-5">
              <Star size={64} className="text-muted mb-3" />
              <h4 className="text-muted">No Pinned Documents</h4>
              <p className="text-muted">
                You haven&apos;t pinned any policies yet. Pin policies you want to access quickly!
              </p>
              <button 
                className="btn btn-primary"
                onClick={() => router.push('/policies')}
              >
                Browse All Policies
              </button>
            </div>
          ) : (
            <div className="row">
              {policies.map((policy) => (
                <div key={policy._id} className="col-md-6 col-lg-4 mb-4">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="card-title mb-0">{policy.title}</h5>
                        <Star size={16} className="text-warning flex-shrink-0 ms-2" />
                      </div>
                      <p className="card-text text-muted small mb-3">
                        {policy.description}
                      </p>
                      <div className="mb-3">
                        <span className="badge bg-primary me-2">{policy.category}</span>
                        <span className={`badge ${policy.status === 'active' ? 'bg-success' : 'bg-warning'}`}>
                          {policy.status === 'active' ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          by {policy.created_by.first_name} {policy.created_by.last_name}
                        </small>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => router.push(`/policy/${policy._id}`)}
                        >
                          View
                        </button>
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