"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface PolicyFormProps {
  form: {
    title: string;
    category: string;
    organization: string;
    description: string;
    tags: string;
    body?: string;
    content?: string;
    status?: string;
  };
  errors: { [k: string]: string };
  isSubmitting: boolean;
  submitMessage: { type: 'success' | 'error', text: string } | null;
  handleSubmit: (e: React.FormEvent) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleBodyChange: (value: string | undefined) => void;
  mode?: 'create' | 'edit';
  policyId?: string;
  originalStatus?: string;
  onPublishPolicy?: () => void;
  isPublishing?: boolean;
  hasChanges?: boolean;
  onCancel?: () => void;
}

function PolicyForm({
  form, 
  errors, 
  isSubmitting, 
  submitMessage, 
  handleSubmit, 
  handleChange, 
  handleBodyChange, 
  mode = 'create',
  policyId,
  originalStatus,
  onPublishPolicy,
  isPublishing = false,
  hasChanges = false,
  onCancel
}: PolicyFormProps) {
  const router = useRouter();
  const isEditMode = mode === 'edit';
  const isActiveStatus = originalStatus === 'active';
  const canPublish = !isActiveStatus || (isActiveStatus && hasChanges);
  
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-7">
          <div className="card shadow border-0">
            <div className="card-body p-4">
              <h2 className="mb-4">{isEditMode ? 'Edit Policy' : 'Create New Policy'}</h2>
              
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
                
                {!isEditMode && (
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Draft </label>
                    <input
                      type="checkbox"
                      name="status"
                      className="form-check-input ml-10"
                      value="draft"
                      onChange={handleChange}
                      placeholder="draft"
                    />
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label fw-semibold">Body Content *</label>
                  <div data-color-mode="light">
                    <MDEditor
                      value={form.body || form.content}
                      onChange={handleBodyChange}
                      height={300}
                    />
                  </div>
                  {errors.body && <div className="invalid-feedback d-block">{errors.body}</div>}
                  {errors.content && <div className="invalid-feedback d-block">{errors.content}</div>}
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={onCancel || (() => router.push(isEditMode ? `/policy/${policyId}` : '/dashboard'))}
                    disabled={isSubmitting || isPublishing}
                  >
                    Cancel
                  </button>
                  
                  {isEditMode && onPublishPolicy && (
                    <button 
                      type="button" 
                      className="btn btn-success"
                      onClick={onPublishPolicy}
                      disabled={!canPublish || isSubmitting || isPublishing}
                    >
                      {isPublishing ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Publishing...
                        </>
                      ) : (
                        'Publish Policy'
                      )}
                    </button>
                  )}
                  
                  <button 
                    type="submit" 
                    id={isEditMode ? "update-policy" : "create-policy"}
                    className="btn btn-primary"
                    disabled={isSubmitting || isPublishing}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {isEditMode ? 'Saving...' : 'Creating Policy...'}
                      </>
                    ) : (
                      isEditMode ? 'Save Changes' : 'Create Policy'
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

export default PolicyForm