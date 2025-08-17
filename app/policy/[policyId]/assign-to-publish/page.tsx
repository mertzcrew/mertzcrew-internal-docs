"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';

interface Policy {
  _id: string;
  title: string;
  status: string;
  created_by: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface AdminUser {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

export default function AssignToPublishPage() {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const policyId = params.policyId as string;

  useEffect(() => {
    const fetchPolicy = async () => {
      if (status === 'authenticated' && policyId) {
        try {
          setLoading(true);
          const response = await fetch(`/api/policies/${policyId}`, {
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setPolicy(data.data);
            } else {
              setError(data.message || 'Failed to fetch policy');
            }
          } else {
            setError('Failed to fetch policy');
          }
        } catch (error) {
          console.error('Error fetching policy:', error);
          setError('An error occurred while fetching policy');
        } finally {
          setLoading(false);
        }
      }
    };

    const fetchAdminUsers = async () => {
      if (status === 'authenticated') {
        try {
          setLoadingAdmins(true);
          const response = await fetch('/api/users', {
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              // Filter to only admin users
              const admins = data.users.filter((user: AdminUser) => user.role === 'admin');
              setAdminUsers(admins);
            }
          }
        } catch (error) {
          console.error('Error fetching admin users:', error);
        } finally {
          setLoadingAdmins(false);
        }
      }
    };

    fetchPolicy();
    fetchAdminUsers();
  }, [status, policyId]);

  const handleAdminSelection = (adminId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedAdmins(prev => [...prev, adminId]);
    } else {
      setSelectedAdmins(prev => prev.filter(id => id !== adminId));
    }
  };

  const handleSubmit = async () => {
    if (selectedAdmins.length === 0) {
      setError('Please select at least one admin to assign for review');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/policies/${policyId}/assign-to-publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminIds: selectedAdmins
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitMessage({ 
          type: 'success', 
          text: `Successfully assigned ${selectedAdmins.length} admin${selectedAdmins.length !== 1 ? 's' : ''} for review. They will be notified via email.` 
        });
        
        // Navigate back to policy after a delay
        setTimeout(() => {
          router.push(`/policy/${policyId}`);
        }, 3000);
      } else {
        setError(result.message || 'Failed to assign admins for review');
      }
    } catch (error) {
      console.error('Error assigning admins:', error);
      setError('An error occurred while assigning admins for review');
    } finally {
      setSubmitting(false);
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

  if (loading) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading policy...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="alert alert-danger" role="alert">
              {error || "Policy not found"}
            </div>
            <button className="btn btn-link" onClick={() => router.back()}>
              <ArrowLeft size={16} className="me-1" /> Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow border-0">
            <div className="card-body p-4">
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h2 className="mb-1">Assign for Review</h2>
                  <p className="text-muted mb-0">
                    Select admin users to review and publish: <strong>{policy.title}</strong>
                  </p>
                </div>
                <button className="btn btn-link" onClick={() => router.back()}>
                  <ArrowLeft size={16} className="me-1" /> Back
                </button>
              </div>

              {/* Success/Error Messages */}
              {submitMessage && (
                <div className={`alert alert-${submitMessage.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show mb-4`}>
                  {submitMessage.text}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setSubmitMessage(null)}
                  ></button>
                </div>
              )}

              {error && (
                <div className="alert alert-danger alert-dismissible fade show mb-4">
                  {error}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setError(null)}
                  ></button>
                </div>
              )}

              {/* Info Alert */}
              <div className="alert alert-info d-flex align-items-center mb-4">
                <AlertCircle size={20} className="me-2" />
                <div>
                  <strong>Ready for Review:</strong> This policy is ready to be reviewed and published. 
                  Select one or more admin users who will receive an email notification to review and publish this policy.
                </div>
              </div>

              {/* Admin Selection */}
              <div className="mb-4">
                <h5 className="mb-3">Select Admin Users for Review</h5>
                
                {loadingAdmins ? (
                  <div className="text-center py-3">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading admin users...</p>
                  </div>
                ) : adminUsers.length === 0 ? (
                  <div className="text-center py-3">
                    <p className="text-muted">No admin users found.</p>
                  </div>
                ) : (
                  <div className="list-group">
                    {adminUsers.map((admin) => (
                      <div key={admin._id} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-semibold">{admin.first_name} {admin.last_name}</div>
                          <div className="text-muted small">{admin.email}</div>
                        </div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`admin-${admin._id}`}
                            checked={selectedAdmins.includes(admin._id)}
                            onChange={(e) => handleAdminSelection(admin._id, e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor={`admin-${admin._id}`}>
                            Select
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => router.back()}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={handleSubmit}
                  disabled={submitting || selectedAdmins.length === 0}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Assigning...
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} className="me-2" />
                      Assign {selectedAdmins.length} Admin{selectedAdmins.length !== 1 ? 's' : ''} for Review
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 