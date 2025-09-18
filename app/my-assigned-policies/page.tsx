"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FileText, User, Building2, Tag, ArrowLeft, Clock, CheckCircle } from 'lucide-react';
import { POLICY_ORGANIZATIONS, DEPARTMENTS, formatDateMMDDYYYY } from '../../lib/validations';

interface Policy {
  _id: string;
  title: string;
  content: string;
  description: string;
  category: string;
  organization: string;
  department?: string;
  tags: string[];
  status: string;
  publish_date?: string | Date;
  created_at: string;
  updated_at: string;
  created_by: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  assigned_users: Array<{
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  }>;
}

export default function MyAssignedPoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const fetchAssignedPolicies = async () => {
      if (status === 'authenticated') {
        try {
          setLoading(true);
          const response = await fetch('/api/policies?assigned=true', {
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setPolicies(data.policies || []);
            } else {
              setError(data.message || 'Failed to fetch assigned policies');
            }
          } else {
            setError('Failed to fetch assigned policies');
          }
        } catch (error) {
          console.error('Error fetching assigned policies:', error);
          setError('An error occurred while fetching assigned policies');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchAssignedPolicies();
  }, [status]);

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

  if (loading) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-10">
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading your assigned policies...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-10">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">My Assigned Policies</h2>
              <p className="text-muted mb-0">
                Policies that have been assigned to you ({policies.length} total)
              </p>
            </div>
            <button className="btn btn-link" onClick={() => router.back()}>
              <ArrowLeft size={16} className="me-1" /> Back
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button
                type="button"
                className="btn-close"
                onClick={() => setError(null)}
              ></button>
            </div>
          )}

          {/* Policies List */}
          {policies.length === 0 ? (
            <div className="text-center py-5">
              <FileText size={48} className="text-muted mb-3" />
              <h4 className="text-muted">No Assigned Policies</h4>
              <p className="text-muted">
                You don&apos;t have any policies assigned to you at the moment.
              </p>
            </div>
          ) : (
            <div className="row">
              {policies.map((policy) => (
                <div key={policy._id} className="col-md-6 col-lg-4 mb-4">
                  <div className="card h-100 shadow-sm border-0">
                    <div className="card-body">
                      {/* Status Badge */}
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span className={`badge ${policy.status === 'active' ? 'bg-success' : 'bg-warning'}`}>
                          {policy.status === 'active' ? (
                            <>
                              <CheckCircle size={12} className="me-1" />
                              Published
                            </>
                          ) : (
                            <>
                              <Clock size={12} className="me-1" />
                              Draft
                            </>
                          )}
                        </span>
                        <small className="text-muted">
                          {formatDateMMDDYYYY(policy.created_at)}
                        </small>
                      </div>

                      {/* Title */}
                      <h5 className="card-title mb-2">
                        <button
                          className="btn btn-link text-decoration-none p-0 text-start"
                          onClick={() => router.push(`/policy/${policy._id}`)}
                        >
                          {policy.title}
                        </button>
                      </h5>

                      {/* Description */}
                      {policy.description && (
                        <p className="card-text text-muted small mb-3">
                          {policy.description.length > 100
                            ? `${policy.description.substring(0, 100)}...`
                            : policy.description}
                        </p>
                      )}

                      {/* Metadata */}
                      <div className="small text-muted">
                        <div className="mb-1">
                          <FileText size={12} className="me-1" />
                          {policy.category}
                        </div>
                        <div className="mb-1 d-flex align-items-center">
                          {policy.organization === 'mertzcrew' ? (
                            <img src="/Mertzcrew.jpeg" alt="Mertzcrew" className="org-icon me-1" loading="lazy" />
                          ) : policy.organization === 'mertz_production' ? (
                            <img src="/mertz_productions_logo.jpeg" alt="Mertz Production" className="org-icon me-1" loading="lazy" />
                          ) : (
                            <Building2 size={12} className="me-1" />
                          )}
                          <span>
                            {(POLICY_ORGANIZATIONS.find((o) => o.value === policy.organization)?.display) || policy.organization}
                          </span>
                        </div>
                        {policy.department && (
                          <div className="mb-1">
                            <Building2 size={12} className="me-1" />
                            {DEPARTMENTS.find((d) => d.value === policy.department)?.display || policy.department}
                          </div>
                        )}
                        <div className="mb-1">
                          <User size={12} className="me-1" />
                          {policy.created_by.first_name} {policy.created_by.last_name}
                        </div>
                        {policy.tags && policy.tags.length > 0 && (
                          <div className="mb-1">
                            <Tag size={12} className="me-1" />
                            {policy.tags.slice(0, 2).join(', ')}
                            {policy.tags.length > 2 && ` +${policy.tags.length - 2} more`}
                          </div>
                        )}
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