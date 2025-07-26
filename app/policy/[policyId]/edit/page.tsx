"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface Policy {
  _id: string;
  title: string;
  content: string;
  description: string;
  category: string;
  organization: string;
  tags: string[];
}

const initialForm = {
  title: "",
  content: "",
  description: "",
  category: "",
  organization: "all",
  tags: "",
};

export default function EditPolicyPage() {
  const [form, setForm] = useState({ ...initialForm });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();
  const params = useParams();
  const policyId = params.policyId as string;

  useEffect(() => {
    fetchPolicy();
    // eslint-disable-next-line
  }, [policyId]);

  const fetchPolicy = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/policies/${policyId}`);
      const result = await response.json();
      if (response.ok) {
        const policy: Policy = result.data;
        setForm({
          title: policy.title,
          content: policy.content,
          description: policy.description,
          category: policy.category,
          organization: policy.organization,
          tags: policy.tags ? policy.tags.join(", ") : "",
        });
      } else {
        setError(result.message || "Policy not found");
      }
    } catch (err) {
      setError("An error occurred while fetching the policy");
    } finally {
      setLoading(false);
    }
  };

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError(null);
  }

  function handleBodyChange(value: string | undefined) {
    setForm({ ...form, content: value || "" });
    if (error) setError(null);
  }

  function validate(values: typeof initialForm) {
    const errs: { [k: string]: string } = {};
    if (!values.title.trim()) errs.title = "Title is required";
    if (!values.category.trim()) errs.category = "Category is required";
    if (!values.organization.trim()) errs.organization = "Organization is required";
    if (!values.description.trim()) errs.description = "Description is required";
    if (!values.content.trim()) errs.content = "Body content is required";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setError(Object.values(errs).join(". "));
      return;
    }
    setIsSubmitting(true);
    setSubmitMessage(null);
    try {
      const response = await fetch(`/api/policies/${policyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          description: form.description,
          category: form.category,
          organization: form.organization,
          tags: form.tags,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        setSubmitMessage({ type: 'success', text: 'Policy updated successfully!' });
        setTimeout(() => {
          router.push(`/policy/${policyId}`);
        }, 1500);
      } else {
        setSubmitMessage({ type: 'error', text: result.message || 'Failed to update policy' });
      }
    } catch (err) {
      setSubmitMessage({ type: 'error', text: 'An error occurred while updating the policy' });
    } finally {
      setIsSubmitting(false);
    }
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
        <button className="btn btn-link" onClick={() => router.back()}>
          <ArrowLeft size={16} className="me-1" /> Back
        </button>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-7">
          <div className="card shadow border-0">
            <div className="card-body p-4">
              <h2 className="mb-4">Edit Policy</h2>
              {submitMessage && (
                <div className={`alert alert-${submitMessage.type === 'success' ? 'success' : 'danger'}`}>
                  {submitMessage.text}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Title *</label>
                  <input
                    name="title"
                    className="form-control"
                    value={form.title}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Category *</label>
                  <input
                    name="category"
                    className="form-control"
                    value={form.category}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Organization *</label>
                  <select
                    name="organization"
                    className="form-select"
                    value={form.organization}
                    onChange={handleChange}
                    required
                  >
                    <option value="all">All Organizations</option>
                    <option value="mertzcrew">Mertzcrew</option>
                    <option value="mertz_production">Mertz Production</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Description *</label>
                  <input
                    name="description"
                    className="form-control"
                    value={form.description}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Tags (comma separated)</label>
                  <input
                    name="tags"
                    className="form-control"
                    value={form.tags}
                    onChange={handleChange}
                    placeholder="e.g., hr, safety, onboarding"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Body Content *</label>
                  <div data-color-mode="light">
                    <MDEditor
                      value={form.content}
                      onChange={handleBodyChange}
                      height={300}
                    />
                  </div>
                </div>
                <div className="d-flex justify-content-end gap-2">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => router.push(`/policy/${policyId}`)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 