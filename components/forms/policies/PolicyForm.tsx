"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Tag } from "lucide-react";
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
    tags: Array<{_id: string; name: string; color: string}>;
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

  // Tag-related state
  const [showAddTagPopover, setShowAddTagPopover] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [addingTag, setAddingTag] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [tagPopoverRef, setTagPopoverRef] = useState<HTMLDivElement | null>(null);

  // Handle click outside to close tag popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tagPopoverRef && !tagPopoverRef.contains(event.target as Node)) {
        setShowAddTagPopover(false);
        setNewTag('');
        setTagSuggestions([]);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [tagPopoverRef]);

  // Handle adding a tag
  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    
    try {
      setAddingTag(true);
      
      // Check if tag already exists
      if (form.tags.some(tag => tag.name.toLowerCase() === newTag.trim().toLowerCase())) {
        setNewTag('');
        setShowAddTagPopover(false);
        return;
      }

      // For now, we'll add the tag locally since this is during form creation
      // The actual tag creation will happen when the policy is saved
      const tempTag = {
        _id: `temp_${Date.now()}`,
        name: newTag.trim(),
        color: '#6c757d' // Default gray color
      };
      
      // Update the form tags
      const updatedTags = [...form.tags, tempTag];
      handleChange({
        target: { name: 'tags', value: updatedTags }
      } as any);
      
      setNewTag('');
      setShowAddTagPopover(false);
      setTagSuggestions([]);
    } catch (err) {
      console.error('Error adding tag:', err);
    } finally {
      setAddingTag(false);
    }
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = form.tags.filter(tag => tag.name !== tagToRemove);
    handleChange({
      target: { name: 'tags', value: updatedTags }
    } as any);
  };

  // Fetch tag suggestions based on input
  const fetchTagSuggestions = async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setTagSuggestions([]);
      return;
    }

    try {
      setLoadingSuggestions(true);
      const response = await fetch(`/api/tags?q=${encodeURIComponent(query.trim())}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Filter out tags that are already on this policy
          const currentTagNames = form.tags.map(tag => tag.name);
          const filteredSuggestions = data.data.filter((tag: string) => 
            !currentTagNames.includes(tag)
          );
          setTagSuggestions(filteredSuggestions);
        }
      }
    } catch (error) {
      console.error('Error fetching tag suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Handle tag input change
  const handleTagInputChange = (value: string) => {
    setNewTag(value);
    fetchTagSuggestions(value);
  };

  // Handle selecting a tag suggestion
  const handleSelectTagSuggestion = (suggestion: string) => {
    setNewTag(suggestion);
    setTagSuggestions([]);
  };
  
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

                {/* Tags Section */}
                <div className="mb-3">
                  <div className="d-flex align-items-center mb-2">
                    <label className="form-label fw-semibold mb-0 me-2">Tags:</label>
                    <div className="position-relative">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary btn-no-border"
                        onClick={() => setShowAddTagPopover(!showAddTagPopover)}
                        disabled={isSubmitting || isPublishing}
                      >
                        <Tag size={14} className="me-1" />
                        Add Tag
                      </button>
                      
                      {/* Tag Popover */}
                      {showAddTagPopover && (
                        <div
                          ref={setTagPopoverRef}
                          className="position-absolute top-100 end-0 mt-1 bg-white border rounded shadow-lg"
                          style={{ zIndex: 1000, minWidth: '300px', maxWidth: '400px' }}
                        >
                          <div className="p-3 border-bottom">
                            <div className="input-group">
                              <span className="input-group-text">
                                <Tag size={14} />
                              </span>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Search or create new tag"
                                value={newTag}
                                onChange={(e) => handleTagInputChange(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddTag();
                                  }
                                }}
                                autoFocus
                              />
                            </div>
                          </div>
                          
                          {/* Tag Suggestions */}
                          {tagSuggestions.length > 0 && (
                            <div className="p-2 border-bottom" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                              <div className="small text-muted mb-2">Existing tags:</div>
                              <div className="d-flex flex-wrap gap-1">
                                {tagSuggestions.map((suggestion, idx) => (
                                  <span
                                    key={idx}
                                    className="badge bg-light text-dark cursor-pointer"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleSelectTagSuggestion(suggestion)}
                                    onMouseEnter={(e) => e.currentTarget.classList.add('bg-secondary', 'text-white')}
                                    onMouseLeave={(e) => e.currentTarget.classList.remove('bg-secondary', 'text-white')}
                                  >
                                    {suggestion}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Current Tags */}
                          {form.tags && form.tags.length > 0 && (
                            <div className="p-2">
                              <div className="small text-muted mb-2">Current tags:</div>
                              <div className="d-flex flex-wrap gap-1">
                                {form.tags.map((tag) => (
                                  <span
                                    key={tag._id}
                                    className="badge text-white position-relative"
                                    style={{ 
                                      paddingRight: '20px',
                                      backgroundColor: tag.color
                                    }}
                                  >
                                    {tag.name}
                                    <span
                                      className="position-absolute top-0 end-0 h-100 d-flex align-items-center justify-content-center"
                                      style={{
                                        width: '16px',
                                        fontSize: '10px',
                                        color: 'white',
                                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                        borderTopRightRadius: '0.375rem',
                                        borderBottomRightRadius: '0.375rem'
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveTag(tag.name);
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                                      }}
                                    >
                                      ×
                                    </span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Add Button */}
                          <div className="p-2 border-top">
                            <button
                              type="button"
                              className="btn btn-primary btn-sm w-100"
                              onClick={handleAddTag}
                              disabled={addingTag || !newTag.trim()}
                            >
                              {addingTag ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                  Adding...
                                </>
                              ) : (
                                'Add Tag'
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Display current tags */}
                  {form.tags && form.tags.length > 0 ? (
                    <div className="d-flex flex-wrap gap-2">
                      {form.tags.map((tag, idx) => (
                        <span
                          key={tag._id}
                          className="badge position-relative"
                          style={{ 
                            cursor: 'pointer', 
                            paddingRight: '25px',
                            backgroundColor: tag.color,
                            color: '#ffffff'
                          }}
                          onClick={() => handleRemoveTag(tag.name)}
                          title="Click to remove tag"
                        >
                          {tag.name}
                          <span
                            className="position-absolute top-0 end-0 h-100 d-flex align-items-center justify-content-center"
                            style={{
                              width: '20px',
                              fontSize: '12px',
                              color: '#ffffff',
                              backgroundColor: 'rgba(255, 255, 255, 0.2)',
                              borderTopRightRadius: '0.375rem',
                              borderBottomRightRadius: '0.375rem'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                            }}
                          >
                            ×
                          </span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted small">No tags assigned to this policy.</div>
                  )}
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