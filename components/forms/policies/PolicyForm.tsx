"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import PolicyFileUpload from "../../ui/PolicyFileUpload";
import UserAssignmentInput from './UserAssignmentInput';
import { POLICY_ORGANIZATIONS, DEPARTMENTS } from "../../../lib/validations";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface PolicyAttachment {
  fileName: string;
  filePath: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedBy?: string;
  uploadedAt: Date | string;
//   description?: string;
}

interface User {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface PolicyFormProps {
  form: {
    title: string;
    category: string;
    organization: string;
    department?: string;
    effective_date?: string;
    // description: string;
    tags: string;
    body?: string;
    content?: string;
    status?: string;
    isDraft?: boolean;
    require_signature?: boolean;
  };
  attachments: PolicyAttachment[];
  onAttachmentsChange: (attachments: PolicyAttachment[]) => void;
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
  // New props for user selection
  availableUsers?: User[];
  selectedUsers?: string[];
  onUserSelection?: (userId: string, isSelected: boolean) => void;
  loadingUsers?: boolean;
  isAdmin?: boolean;
  currentUserId?: string;
}

function PolicyForm({
  form, 
  attachments,
  onAttachmentsChange,
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
  onCancel,
  availableUsers = [],
  selectedUsers = [],
  onUserSelection,
  loadingUsers = false,
  isAdmin = false,
  currentUserId
}: PolicyFormProps) {
  const router = useRouter();
  const isEditMode = mode === 'edit';
  const isActiveStatus = originalStatus === 'active';
  const canPublish = !isActiveStatus || (isActiveStatus && hasChanges);
  
  console.log('=== PolicyForm RENDER ===')
  console.log('Form props:', { attachments: attachments.length, isSubmitting, mode })
  console.log('About to render PolicyFileUpload component')
  
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
              
              <form onSubmit={handleSubmit} noValidate>
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
                  <select
                    name="category"
                    className={`form-select${errors.category ? " is-invalid" : ""}`}
                    value={form.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a category</option>
                    <option value="HR">HR</option>
                    <option value="Culture">Culture</option>
                    <option value="Documentation">Documentation</option>
                    <option value="Process">Process</option>
                    <option value="Safety">Safety</option>
                    <option value="Quality">Quality</option>
                    <option value="Other">Other</option>
                  </select>
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
                    <option value="">Select Organization</option>
                    {POLICY_ORGANIZATIONS.map(org => (
                      <option key={org.value} value={org.value}>
                        {org.display}
                      </option>
                    ))}
                  </select>
                  {errors.organization && <div className="invalid-feedback">{errors.organization}</div>}
                </div>

                {form.organization === 'mertzcrew' && (
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Department</label>
                    <select
                      name="department"
                      className={`form-select${errors.department ? " is-invalid" : ""}`}
                      value={form.department || ""}
                      onChange={handleChange}
                    >
                      <option value="">Select Department (Optional)</option>
                      {DEPARTMENTS.map(dept => (
                        <option key={dept.value} value={dept.value}>
                          {dept.display}
                        </option>
                      ))}
                    </select>
                    {errors.department && <div className="invalid-feedback">{errors.department}</div>}
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label fw-semibold">Effective Date</label>
                  <input
                    type="date"
                    name="effective_date"
                    className={`form-control${errors.effective_date ? " is-invalid" : ""}`}
                    value={form.effective_date || ""}
                    onChange={handleChange}
                  />
                  {errors.effective_date && <div className="invalid-feedback">{errors.effective_date}</div>}
                </div>

                {/* <div className="mb-3">
                  <label className="form-label fw-semibold">Description *</label>
                  <input
                    name="description"
                    className={`form-control${errors.description ? " is-invalid" : ""}`}
                    value={form.description}
                    onChange={handleChange}
                  />
                  {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                </div> */}

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

                {/* User Assignment Section */}
                {availableUsers && selectedUsers && onUserSelection && (
                  <UserAssignmentInput
                    assignedUsers={availableUsers.filter(user => selectedUsers.includes(user._id))}
                    onUsersChange={(users) => {
                      // Convert User objects back to selected user IDs
                      const userIds = users.map(user => user._id);
                      // Update selected users by calling onUserSelection for each change
                      const currentSelectedIds = new Set(selectedUsers);
                      const newSelectedIds = new Set(userIds);
                      
                      // Add users that are in new selection but not in current
                      userIds.forEach(userId => {
                        if (!currentSelectedIds.has(userId)) {
                          onUserSelection(userId, true);
                        }
                      });
                      
                      // Remove users that are in current selection but not in new
                      selectedUsers.forEach(userId => {
                        if (!newSelectedIds.has(userId)) {
                          onUserSelection(userId, false);
                        }
                      });
                    }}
                    currentUserId={currentUserId}
                    disabled={isSubmitting}
                    error={errors.assignedUsers}
                    isAdmin={isAdmin}
                  />
                )}

                {/* File Upload Section */}
                <div className="mb-4">
                  <PolicyFileUpload
                    attachments={attachments}
                    onAttachmentsChange={onAttachmentsChange}
                    disabled={isSubmitting || isPublishing}
                  />
                </div>
                
                {/* Draft Checkbox - Only show for admins or hide for non-admins */}
                {!isEditMode && (
                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        name="isDraft"
                        className="form-check-input"
                        id="isDraft"
                        checked={form.isDraft}
                        onChange={handleChange}
                        disabled={isSubmitting || !isAdmin}
                      />
                      <label className="form-check-label" htmlFor="isDraft">
                        <strong>Save as Draft</strong>
                        {!isAdmin && (
                          <span className="text-muted ms-2">(Draft policies require admin review before publishing)</span>
                        )}
                        {isAdmin && (
                          <span className="text-muted ms-2">(Uncheck to publish immediately)</span>
                        )}
                      </label>
                    </div>
                  </div>
                )}

                <div className="mb-3 form-check">
                  <input
                    type="checkbox"
                    id="require_signature"
                    name="require_signature"
                    className="form-check-input"
                    checked={!!form.require_signature}
                    onChange={(e) => handleChange({
                      target: { name: 'require_signature', value: e.target.checked } as any
                    } as any)}
                    disabled={isSubmitting || isPublishing}
                  />
                  <label className="form-check-label" htmlFor="require_signature">
                    Require electronic signature upon publish
                  </label>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Body Content {attachments.length === 0 ? '*' : '(Optional - you can provide content or upload files)'}
                  </label>
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
                    <>
                      {isAdmin ? (
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
                      ) : (
                        <button 
                          type="button" 
                          className="btn btn-warning"
                          onClick={() => router.push(`/policy/${policyId}/assign-to-publish`)}
                          disabled={!canPublish || isSubmitting || isPublishing}
                        >
                          Ready to Publish
                        </button>
                      )}
                    </>
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