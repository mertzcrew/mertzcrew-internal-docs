"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Edit, ArrowLeft, Tag, BookOpen, Users, Building2, Star, Globe } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Policy {
  _id: string;
  title: string;
  content: string;
  description: string;
  category: string;
  organization: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export default function PolicyDetailPage() {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const policyId = params.policyId as string;

  useEffect(() => {
    fetchPolicy();
  }, [policyId]);

  const fetchPolicy = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/policies/${policyId}`);
      const result = await response.json();
      if (response.ok) {
        setPolicy(result.data);
      } else {
        setError(result.message || "Policy not found");
      }
    } catch (err) {
      setError("An error occurred while fetching the policy");
    } finally {
      setLoading(false);
    }
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

  if (error || !policy) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          {error || "Policy not found"}
        </div>
        <button className="btn btn-link" onClick={() => router.back()}>
          <ArrowLeft size={16} className="me-1" /> Back
        </button>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-10 col-lg-8">
          <div className="card shadow border-0 mb-4">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="mb-0">{policy.title}</h2>
                <button
                  className="btn btn-outline-primary"
                  onClick={() => router.push(`/policy/${policy._id}/edit`)}
                >
                  <Edit size={16} className="me-2" /> Edit
                </button>
              </div>
              <div className="mb-3 text-muted">
                <span className="me-3">
                  <BookOpen size={14} className="me-1" /> {policy.category}
                </span>
                <span className="me-3">
                  <Globe size={14} className="me-1" /> {policy.organization}
                </span>
                {policy.tags && policy.tags.length > 0 && (
                  <span>
                    <Tag size={14} className="me-1" />
                    {policy.tags.map((tag, idx) => (
                      <span key={idx} className="badge bg-light text-dark me-1">
                        {tag}
                      </span>
                    ))}
                  </span>
                )}
              </div>
              <div className="mb-3">
                <strong>Description:</strong>
                <div className="text-muted mt-1">{policy.description}</div>
              </div>
              <div className="mb-3">
                <strong>Content:</strong>
                <div className="mt-2 border rounded p-3 bg-light" data-color-mode="light">
                  {policy.content ? (
                    <ReactMarkdown>{policy.content}</ReactMarkdown>
                  ) : (
                    <span className="text-muted">No content</span>
                  )}
                </div>
              </div>
              <div className="d-flex justify-content-end">
                <button className="btn btn-link" onClick={() => router.back()}>
                  <ArrowLeft size={16} className="me-1" /> Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 