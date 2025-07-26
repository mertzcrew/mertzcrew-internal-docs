"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface PolicyFormValues {
  title: string;
  category: string;
  organization: string;
  description: string;
  tags: string;
  body: string;
}

const initialForm: PolicyFormValues = {
  title: "",
  category: "",
  organization: "all",
  description: "",
  tags: "",
  body: "",
};

export default function NewPolicyPage() {
  const [form, setForm] = useState<PolicyFormValues>(initialForm);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  }

  function handleBodyChange(value: string | undefined) {
    setForm({ ...form, body: value || "" });
    // Clear error when user starts typing
    if (errors.body) {
      setErrors({ ...errors, body: "" });
    }
  }

  function validate(values: PolicyFormValues) {
    const errs: { [k: string]: string } = {};
    if (!values.title.trim()) errs.title = "Title is required";
    if (!values.category.trim()) errs.category = "Category is required";
    if (!values.organization.trim()) errs.organization = "Organization is required";
    if (!values.description.trim()) errs.description = "Description is required";
    if (!values.body.trim()) errs.body = "Body content is required";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    
    if (Object.keys(errs).length === 0) {
      setIsSubmitting(true);
      setSubmitMessage(null);
      
      try {
        const response = await fetch('/api/policies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: form.title,
            content: form.body, // WYSIWYG content
            description: form.description,
            category: form.category,
            organization: form.organization,
            tags: form.tags
          }),
        });

        const result = await response.json();

        if (response.ok) {
          setSubmitMessage({ type: 'success', text: 'Policy created successfully!' });
          // Reset form after successful submission
          setTimeout(() => {
            setForm(initialForm);
            setSubmitMessage(null);
            // Optionally redirect to dashboard or policy list
            router.push('/dashboard');
          }, 2000);
        } else {
          setSubmitMessage({ 
            type: 'error', 
            text: result.message || 'Failed to create policy' 
          });
        }
      } catch (error) {
        console.error('Error creating policy:', error);
        setSubmitMessage({ 
          type: 'error', 
          text: 'An error occurred while creating the policy' 
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-7">
          <div className="card shadow border-0">
            <div className="card-body p-4">
              <h2 className="mb-4">Create New Policy</h2>
              
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
                    className={`form-control${errors.title ? " is-invalid" : ""}`}
                    value={form.title}
                    onChange={handleChange}
                    required
                  />
                  {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Category *</label>
                  <input
                    name="category"
                    className={`form-control${errors.category ? " is-invalid" : ""}`}
                    value={form.category}
                    onChange={handleChange}
                    required
                  />
                  {errors.category && <div className="invalid-feedback">{errors.category}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Organization *</label>
                  <select
                    name="organization"
                    className={`form-select${errors.organization ? " is-invalid" : ""}`}
                    value={form.organization}
                    onChange={handleChange}
                    required
                  >
                    <option value="all">All Organizations</option>
                    <option value="mertzcrew">Mertzcrew</option>
                    <option value="mertz_production">Mertz Production</option>
                  </select>
                  {errors.organization && <div className="invalid-feedback">{errors.organization}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Description *</label>
                  <input
                    name="description"
                    className={`form-control${errors.description ? " is-invalid" : ""}`}
                    value={form.description}
                    onChange={handleChange}
                    required
                  />
                  {errors.description && <div className="invalid-feedback">{errors.description}</div>}
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
                      value={form.body}
                      onChange={handleBodyChange}
                      height={300}
                    />
                  </div>
                  {errors.body && <div className="invalid-feedback d-block">{errors.body}</div>}
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => router.push('/dashboard')}
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
                        Creating...
                      </>
                    ) : (
                      'Create Policy'
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