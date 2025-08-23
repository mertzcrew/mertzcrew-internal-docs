"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Edit, ArrowLeft, Tag, BookOpen, Users, Building2, Star, Globe, Download, ExternalLink, FileText, Trash2, AlertCircle, CheckCircle, Pin, PinOff, Calendar, UserPlus } from "lucide-react";
import dynamic from "next/dynamic";
import "@uiw/react-markdown-preview/markdown.css";
import { DEPARTMENTS, POLICY_ORGANIZATIONS, formatDateMMDDYYYY } from "../../../lib/validations";

const MarkdownPreview = dynamic(() => import("@uiw/react-markdown-preview"), { ssr: false });

// Utility functions for file handling
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(fileType: string): string {
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📈';
  if (fileType.includes('text')) return '📄';
  if (fileType.includes('csv')) return '📊';
  return '📎';
}

interface PolicyAttachment {
  fileName: string;
  filePath: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedBy?: string;
  uploadedAt: Date | string;
  description?: string;
}

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
  pending_changes?: any;
  assigned_users?: Array<{
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  }>;
  attachments?: PolicyAttachment[];
  created_at: string;
  updated_at: string;
  created_by: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  updated_by?: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  require_signature?: boolean;
  userSignature?: {
    name: string;
    signedAt: string;
  };
}

export default function PolicyDetailPage() {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [signing, setSigning] = useState(false);
  const [userHasSigned, setUserHasSigned] = useState(false);
  const [userSignature, setUserSignature] = useState<{ name: string; signedAt: string } | null>(null);
  const [showAddUserPopover, setShowAddUserPopover] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<Array<{_id: string; first_name: string; last_name: string; email: string}>>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userPopoverRef, setUserPopoverRef] = useState<HTMLDivElement | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSuggestions, setUserSuggestions] = useState<Array<{_id: string; first_name: string; last_name: string; email: string}>>([]);
  const [loadingUserSuggestions, setLoadingUserSuggestions] = useState(false);
  const [showAddTagPopover, setShowAddTagPopover] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [addingTag, setAddingTag] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [tagPopoverRef, setTagPopoverRef] = useState<HTMLDivElement | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [addingUsers, setAddingUsers] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const policyId = params.policyId as string;
  useEffect(() => {
    fetchPolicy();
  }, [policyId]);

  // Separate useEffect to check pin status when session is available
  useEffect(() => {
    if (session?.user?.id && policy) {
      checkPinStatus();
    }
  }, [session, policyId, policy]);

  // Track view count only once when policy is loaded and is active
  useEffect(() => {
    const trackView = async () => {
      if (policy && policy.status === 'active' && !hasTrackedView) {
        try {
          setHasTrackedView(true);
          await fetch(`/api/policies/${policyId}/track-view`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          console.error('Error tracking view:', error);
        }
      }
    };

    trackView();
  }, [policy, policyId, hasTrackedView]); // Run when policy is loaded

  // Check if user has already signed this policy
  useEffect(() => {
    const checkUserSignature = async () => {
      if (policy && policy.status === 'active' && policy.require_signature && session?.user?.id) {
        try {
          const res = await fetch(`/api/policies/${policyId}/signature`, {
            method: 'GET',
            credentials: 'include',
          });
          if (res.ok) {
            const data = await res.json();
            setUserHasSigned(data.hasSigned);
            if (data.signature) {
              setUserSignature({
                name: data.signature.name,
                signedAt: data.signature.signedAt
              });
            }
          }
        } catch (error) {
          console.error('Error checking signature:', error);
        }
      }
    };

    checkUserSignature();
  }, [policy, policyId, session]);

  const fetchPolicy = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/policies/${policyId}`);
      const result = await response.json();
      if (response.ok) {
        setPolicy(result.data);
      } else {
        setError(result.message || "Failed to fetch policy");
      }
    } catch (error) {
      console.error('Error fetching policy:', error);
      setError("An error occurred while fetching the policy");
    } finally {
      setLoading(false);
    }
  };

  const checkPinStatus = async () => {
    if (!session?.user?.id) {
      return;
    }
    
    try {
      const response = await fetch(`/api/policies/${policyId}?action=checkPin`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const result = await response.json();
        setIsPinned(!!result.isPinned);
      } else {
        console.error('checkPinStatus: API error:', response.status);
      }
    } catch (error) {
      console.error('Error checking pin status:', error);
    }
  };

  const handleTogglePin = async () => {
    if (!session?.user?.id) return;
    
    setIsPinning(true);
    try {
      const response = await fetch(`/api/policies/${policyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'togglePin'
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setIsPinned(!!result.isPinned);
        setSubmitMessage({ 
          type: 'success', 
          text: result.message 
        });
        setTimeout(() => setSubmitMessage(null), 3000);
      } else {
        setSubmitMessage({ 
          type: 'error', 
          text: result.message || 'Failed to toggle pin' 
        });
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
      setSubmitMessage({ 
        type: 'error', 
        text: 'An error occurred while toggling pin' 
      });
    } finally {
      setIsPinning(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/policies/${policyId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Redirect to policies page after successful deletion
        router.push('/policies');
      } else {
        setError(result.message || 'Failed to delete policy');
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      setError('An error occurred while deleting the policy');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      const response = await fetch(`/api/policies/${policyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'publish'
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Refresh the policy data
        await fetchPolicy();
        // Also show a success message
        setSubmitMessage({ type: 'success', text: 'Policy published successfully!' });
        setTimeout(() => setSubmitMessage(null), 3000);
      } else {
        setError(result.message || 'Failed to publish policy');
      }
    } catch (err) {
      setError('An error occurred while publishing the policy');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRemoveAssignedUser = async (userIdToRemove: string) => {
    try {
      const response = await fetch(`/api/policies/${policyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'removeAssignedUser',
          userIdToRemove: userIdToRemove
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Refresh the policy data
        await fetchPolicy();
        // Show success message
        setSubmitMessage({ type: 'success', text: 'User removed from policy successfully!' });
        setTimeout(() => setSubmitMessage(null), 3000);
        
        // Dispatch event to notify sidebar to refresh assigned policies count
        window.dispatchEvent(new CustomEvent('policyAssignmentChange'));
        
        // If the current user removed themselves, check if they can still access the policy
        if (userIdToRemove === session?.user?.id) {
          // Only redirect if user is not admin and policy is not published (draft)
          // If policy is published, they can still view it
          // If user is admin, they can still view it
          if (session?.user?.role !== 'admin' && policy?.status === 'draft') {
            router.push('/policies');
          }
        }
      } else {
        setError(result.message || 'Failed to remove user from policy');
      }
    } catch (err) {
      setError('An error occurred while removing user from policy');
    }
  };

  async function handleSignPolicy() {
    if (!signatureName.trim()) return;
    try {
      setSigning(true);
      const res = await fetch(`/api/policies/${policyId}/signature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: signatureName })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setSubmitMessage({ type: 'success', text: 'Signature recorded' });
        setSignatureName("");
        setUserHasSigned(true);
        setTimeout(() => setSubmitMessage(null), 2000);
      } else {
        setSubmitMessage({ type: 'error', text: json.message || 'Failed to record signature' });
      }
    } catch (e) {
      setSubmitMessage({ type: 'error', text: 'Failed to record signature' });
    } finally {
      setSigning(false);
    }
  }

  // Check if user can edit this policy
  const canEdit = policy && (
    session?.user?.role === 'admin' || 
    policy.assigned_users?.some(user => user._id.toString() === session?.user?.id)
  );

  // Check if user can publish (admins or policy creators/assigned users for draft policies)
  const canPublish = session?.user?.role === 'admin' || 
    (policy?.status === 'draft' && canEdit);

  // Check if policy has pending changes
  const hasPendingChanges = policy?.pending_changes && Object.keys(policy.pending_changes).length > 0;
  
  // Check if user can see pending changes (admins or assigned users)
  const canSeePendingChanges = session?.user?.role === 'admin' || canEdit;

  // Fetch available users for assignment
  const fetchAvailableUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch('/api/users', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Filter out users who are already assigned to this policy
          const assignedUserIds = policy?.assigned_users?.map(u => u._id) || [];
          const availableUsers = data.users.filter((user: any) => !assignedUserIds.includes(user._id));
          setAvailableUsers(availableUsers);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Handle user selection for assignment
  const handleUserSelection = (userId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  // Handle adding users to policy
  const handleAddUsersToPolicy = async () => {
    if (selectedUsers.length === 0) return;
    
    try {
      setAddingUsers(true);
      const response = await fetch(`/api/policies/${policyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'addAssignedUsers',
          assigned_users: selectedUsers
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Refresh the policy data
        await fetchPolicy();
        // Reset the popover state
        setShowAddUserPopover(false);
        setSelectedUsers([]);
        setUserSearchQuery('');
        setUserSuggestions([]);
        // Show success message
        setSubmitMessage({ type: 'success', text: 'Users added to policy successfully!' });
        setTimeout(() => setSubmitMessage(null), 3000);
        
        // Dispatch event to notify sidebar to refresh assigned policies count
        window.dispatchEvent(new CustomEvent('policyAssignmentChange'));
      } else {
        setError(result.message || 'Failed to add users to policy');
      }
    } catch (err) {
      setError('An error occurred while adding users to policy');
    } finally {
      setAddingUsers(false);
    }
  };

  // Handle adding a tag to the policy
  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    
    try {
      setAddingTag(true);
      const response = await fetch(`/api/policies/${policyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'addTag',
          tag: newTag.trim()
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Refresh the policy data
        await fetchPolicy();
        // Reset the popover state
        setShowAddTagPopover(false);
        setNewTag('');
        setTagSuggestions([]);
        // Show success message
        setSubmitMessage({ type: 'success', text: 'Tag added successfully!' });
        setTimeout(() => setSubmitMessage(null), 3000);
      } else {
        setError(result.message || 'Failed to add tag');
      }
    } catch (err) {
      setError('An error occurred while adding tag');
    } finally {
      setAddingTag(false);
    }
  };

  // Handle removing a tag from the policy
  const handleRemoveTag = async (tagToRemove: string) => {
    try {
      const response = await fetch(`/api/policies/${policyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'removeTag',
          tag: tagToRemove
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Refresh the policy data
        await fetchPolicy();
        // Show success message
        setSubmitMessage({ type: 'success', text: 'Tag removed successfully!' });
        setTimeout(() => setSubmitMessage(null), 3000);
      } else {
        setError(result.message || 'Failed to remove tag');
      }
    } catch (err) {
      setError('An error occurred while removing tag');
    }
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
          const currentTags = displayPolicy?.tags || [];
          const filteredSuggestions = data.data.filter((tag: string) => 
            !currentTags.includes(tag)
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

  // Handle tag input change with debounced suggestions
  const handleTagInputChange = (value: string) => {
    setNewTag(value);
    
    // Debounce the suggestion fetch
    const timeoutId = setTimeout(() => {
      fetchTagSuggestions(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  // Handle selecting a tag suggestion
  const handleSelectTagSuggestion = (suggestion: string) => {
    setNewTag(suggestion);
    setTagSuggestions([]);
  };

  // Fetch user suggestions based on search query
  const fetchUserSuggestions = async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setUserSuggestions([]);
      return;
    }

    try {
      setLoadingUserSuggestions(true);
      const response = await fetch(`/api/users?q=${encodeURIComponent(query.trim())}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Filter out users that are already assigned to this policy
          const assignedUserIds = policy?.assigned_users?.map(user => user._id.toString()) || [];
          const filteredSuggestions = data.users.filter((user: any) => 
            !assignedUserIds.includes(user._id.toString())
          );
          setUserSuggestions(filteredSuggestions);
        }
      }
    } catch (error) {
      console.error('Error fetching user suggestions:', error);
    } finally {
      setLoadingUserSuggestions(false);
    }
  };

  // Handle user search input change with debounced suggestions
  const handleUserSearchChange = (value: string) => {
    setUserSearchQuery(value);
    
    // Debounce the suggestion fetch
    const timeoutId = setTimeout(() => {
      fetchUserSuggestions(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  // Handle selecting a user suggestion
  const handleSelectUserSuggestion = (user: {_id: string; first_name: string; last_name: string; email: string}) => {
    if (!selectedUsers.includes(user._id)) {
      setSelectedUsers(prev => [...prev, user._id]);
    }
    setUserSearchQuery('');
    setUserSuggestions([]);
  };

  // Handle clicking outside the tag popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagPopoverRef && !tagPopoverRef.contains(event.target as Node)) {
        setShowAddTagPopover(false);
        setNewTag('');
        setTagSuggestions([]);
      }
    };

    if (showAddTagPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddTagPopover, tagPopoverRef]);

  // Handle clicking outside the user popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userPopoverRef && !userPopoverRef.contains(event.target as Node)) {
        setShowAddUserPopover(false);
        setSelectedUsers([]);
        setUserSearchQuery('');
        setUserSuggestions([]);
      }
    };

    if (showAddUserPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddUserPopover, userPopoverRef]);



  // Build the displayed policy by overlaying pending_changes on published data
  const displayPolicy = useMemo(() => {
    if (!policy) return null as any;
    if (policy.status === 'active' && hasPendingChanges && canSeePendingChanges) {
      const pc = policy.pending_changes || {};
      return {
        ...policy,
        title: pc.title ?? policy.title,
        content: pc.content ?? policy.content,
        description: pc.description ?? policy.description,
        category: pc.category ?? policy.category,
        tags: pc.tags ?? policy.tags,
        organization: pc.organization ?? policy.organization,
        attachments: pc.attachments ?? policy.attachments
      } as Policy;
    }
    return policy;
  }, [policy, hasPendingChanges, canSeePendingChanges]);

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !policy || !displayPolicy) {
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
              {/* Success Message */}
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

              {/* Pending Changes Alert */}
              {hasPendingChanges && canSeePendingChanges && (
                <div className="alert alert-warning d-flex align-items-center mb-4" role="alert">
                  <AlertCircle size={20} className="me-2" />
                  <div>
                    <strong>Pending Changes:</strong> This policy has unpublished changes waiting for admin approval.
                    {policy.status === 'active' && (
                      <button
                        className="btn btn-sm btn-outline-secondary ms-3"
                        onClick={() => router.push(`/policy/${policy._id}/current`)}
                      >
                        View published policy
                      </button>
                    )}
                    {canPublish && (
                      <button
                        className="btn btn-sm btn-warning ms-2"
                        onClick={handlePublish}
                        disabled={isPublishing}
                      >
                        {isPublishing ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Publishing...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={16} className="me-2" />
                            Publish Changes
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Show "View published policy" button for users who are assigned but can't see pending changes */}
              {hasPendingChanges && !canSeePendingChanges && canEdit && policy.status === 'active' && (
                <div className="alert alert-info d-flex align-items-center mb-4" role="alert">
                  <AlertCircle size={20} className="me-2" />
                  <div>
                    <strong>Policy Updated:</strong> This policy has been updated but changes are pending admin approval.
                    <button
                      className="btn btn-sm btn-outline-primary ms-3"
                      onClick={() => router.push(`/policy/${policy._id}/current`)}
                    >
                      View current published policy
                    </button>
                  </div>
                </div>
              )}

              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="mb-0">{displayPolicy.title}</h2>
                <div className="d-flex gap-2">
                  {/* Pin/Unpin Button */}
                  <button
                    className={`btn ${isPinned ? 'btn-warning' : 'btn-outline-warning'}`}
                    onClick={handleTogglePin}
                    disabled={isPinning}
                    title={isPinned ? 'Unpin Policy' : 'Pin Policy'}
                  >
                    {isPinning ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {isPinned ? 'Unpinning...' : 'Pinning...'}
                      </>
                    ) : (
                      <>
                        {isPinned ? <PinOff size={16} className="me-2" /> : <Pin size={16} className="me-2" />}
                        {isPinned ? 'Unpin' : 'Pin'}
                      </>
                    )}
                  </button>

                  {canPublish && policy.status === 'draft' && (
                    <>
                      {session?.user?.role === 'admin' ? (
                        <button
                          className="btn btn-warning me-2"
                          onClick={handlePublish}
                          disabled={isPublishing}
                        >
                          {isPublishing ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Publishing...
                            </>
                          ) : (
                            <>
                              <CheckCircle size={16} className="me-2" />
                              Publish Policy
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          className="btn btn-warning me-2"
                          onClick={() => router.push(`/policy/${policy._id}/assign-to-publish`)}
                        >
                          <CheckCircle size={16} className="me-2" />
                          Ready to Publish
                        </button>
                      )}
                    </>
                  )}
                  {canEdit && (
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => router.push(`/policy/${policy._id}/edit`)}
                    >
                      <Edit size={16} className="me-2" /> Edit
                    </button>
                  )}
                  {session?.user?.role === 'admin' && (
                    <button
                      className="btn btn-outline-danger"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isDeleting}
                    >
                      <Trash2 size={16} className="me-2" /> Delete
                    </button>
                  )}
                </div>
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
                <div className="mb-3 text-muted">
                    <span className="me-3">
                        <Calendar size={14} className="me-1" /> {formatDateMMDDYYYY(displayPolicy.effective_date)}
                    </span>
                </div>
              <div className="mb-3 text-muted">
                <span className="me-3">
                  <BookOpen size={14} className="me-1" /> {displayPolicy.category}
                </span>
                <span className="me-3 d-inline-flex align-items-center" style={{ lineHeight: 1 }}>
                  {displayPolicy.organization === 'mertzcrew' ? (
                    <img src="/Mertzcrew.jpeg" alt="Mertzcrew" className="org-icon" loading="lazy" />
                  ) : displayPolicy.organization === 'mertz_production' ? (
                    <img src="/mertz_productions_logo.jpeg" alt="Mertz Production" className="org-icon" loading="lazy" />
                  ) : (
                    <Globe size={14} className="me-1 align-middle" />
                  )}
                  <span className="align-middle">
                    {(POLICY_ORGANIZATIONS.find(o => o.value === displayPolicy.organization)?.display) || displayPolicy.organization}
                  </span>
                </span>
                {displayPolicy.department && (
                  <span className="me-3">
                    <Building2 size={14} className="me-1" />
                    {DEPARTMENTS.find(d => d.value === displayPolicy.department)?.display || displayPolicy.department}
                  </span>
                )}
                <span className="me-3">
                  <span className={`badge ${policy.status === 'active' ? 'bg-success' : 'bg-warning'}`}>
                    {policy.status === 'active' ? 'Published' : 'Draft'}
                  </span>
                </span>
              </div>

              {/* Assigned Users */}
              <div className="mb-3">
                <div className="d-flex align-items-center mb-2">
                  <strong className="me-2">Assigned Users:</strong>
                  {canEdit && (
                    <div className="position-relative">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary btn-no-border"
                        onClick={() => {
                          fetchAvailableUsers();
                          setShowAddUserPopover(!showAddUserPopover);
                        }}
                      >
                        <UserPlus size={14} className="me-1" />
                        Add User
                      </button>
                      
                      {/* User Popover */}
                      {showAddUserPopover && (
                        <div
                          ref={setUserPopoverRef}
                          className="position-absolute top-100 end-0 mt-1 bg-white border rounded shadow-lg"
                          style={{ zIndex: 1000, minWidth: '300px', maxWidth: '400px' }}
                        >
                          <div className="p-3 border-bottom">
                            <div className="input-group">
                              <span className="input-group-text">
                                <Users size={14} />
                              </span>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Search or add user"
                                value={userSearchQuery}
                                onChange={(e) => handleUserSearchChange(e.target.value)}
                                autoFocus
                              />
                            </div>
                          </div>
                          
                          {/* User Suggestions */}
                          {userSuggestions.length > 0 && (
                            <div className="p-2 border-bottom" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                              <div className="small text-muted mb-2">Available users:</div>
                              <div className="d-flex flex-column gap-1">
                                {userSuggestions.map((user, idx) => (
                                  <div
                                    key={user._id}
                                    className="d-flex align-items-center p-2 rounded cursor-pointer"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleSelectUserSuggestion(user)}
                                    onMouseEnter={(e) => e.currentTarget.classList.add('bg-light')}
                                    onMouseLeave={(e) => e.currentTarget.classList.remove('bg-light')}
                                  >
                                    <div className="flex-grow-1">
                                      <div className="small fw-semibold">{user.first_name} {user.last_name}</div>
                                      <div className="small text-muted">{user.email}</div>
                                    </div>
                                    <span className="badge bg-primary">Add</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Selected Users */}
                          {selectedUsers.length > 0 && (
                            <div className="p-2 border-bottom">
                              <div className="small text-muted mb-2">Selected users:</div>
                              <div className="d-flex flex-wrap gap-1">
                                {selectedUsers.map((userId) => {
                                  const user = userSuggestions.find(u => u._id === userId) || 
                                             availableUsers.find(u => u._id === userId);
                                  if (!user) return null;
                                  
                                  return (
                                    <span
                                      key={userId}
                                      className="badge bg-primary text-white position-relative"
                                      style={{ paddingRight: '20px' }}
                                    >
                                      {user.first_name} {user.last_name}
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
                                          setSelectedUsers(prev => prev.filter(id => id !== userId));
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
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {/* Current Assigned Users */}
                          {policy?.assigned_users && policy.assigned_users.length > 0 && (
                            <div className="p-2">
                              <div className="small text-muted mb-2">Current assigned users:</div>
                              <div className="d-flex flex-wrap gap-1">
                                {policy.assigned_users.map((user) => (
                                  <span
                                    key={user._id}
                                    className="badge bg-info text-white position-relative"
                                    style={{ paddingRight: '20px' }}
                                  >
                                    {user.first_name} {user.last_name}
                                    {canEdit && (
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
                                          handleRemoveAssignedUser(user._id);
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
                                    )}
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
                              onClick={handleAddUsersToPolicy}
                              disabled={addingUsers || selectedUsers.length === 0}
                            >
                              {addingUsers ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                  Adding Users...
                                </>
                              ) : (
                                `Add ${selectedUsers.length} User${selectedUsers.length !== 1 ? 's' : ''}`
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {policy.assigned_users && policy.assigned_users.length > 0 ? (
                  <div className="d-flex flex-wrap gap-2">
                    {policy.assigned_users.map((user, idx) => (
                      <span
                        key={user._id}
                        className="badge bg-info position-relative"
                        style={{ cursor: canEdit ? 'pointer' : 'default', paddingRight: canEdit ? '25px' : '8px' }}
                        onClick={canEdit ? () => handleRemoveAssignedUser(user._id) : undefined}
                        title={canEdit ? "Click to remove user" : undefined}
                      >
                        {user.first_name} {user.last_name}
                        {canEdit && (
                          <span
                            className="position-absolute top-0 end-0 h-100 d-flex align-items-center justify-content-center"
                            style={{
                              width: '20px',
                              fontSize: '12px',
                              color: '#dc3545',
                              backgroundColor: 'rgba(220, 53, 69, 0.1)',
                              borderTopRightRadius: '0.375rem',
                              borderBottomRightRadius: '0.375rem'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(220, 53, 69, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
                            }}
                          >
                            ×
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted small">No users assigned to this policy.</div>
                )}
              </div>

              {/* Tags */}
              <div className="mb-3">
                <div className="d-flex align-items-center mb-2">
                  <strong className="me-2">Tags:</strong>
                  <div className="position-relative">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary btn-no-border"
                      onClick={() => setShowAddTagPopover(!showAddTagPopover)}
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
                        {displayPolicy.tags && displayPolicy.tags.length > 0 && (
                          <div className="p-2">
                            <div className="small text-muted mb-2">Current tags:</div>
                            <div className="d-flex flex-wrap gap-1">
                              {displayPolicy.tags.map((tag: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="badge bg-primary text-white position-relative"
                                  style={{ paddingRight: '20px' }}
                                >
                                  {tag}
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
                                      handleRemoveTag(tag);
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
                {displayPolicy.tags && displayPolicy.tags.length > 0 ? (
                  <div className="d-flex flex-wrap gap-2">
                    {displayPolicy.tags.map((tag: string, idx: number) => (
                      <span
                        key={idx}
                        className="badge bg-light text-dark position-relative"
                        style={{ cursor: 'pointer', paddingRight: '25px' }}
                        onClick={() => handleRemoveTag(tag)}
                        title="Click to remove tag"
                      >
                        {tag}
                        <span
                          className="position-absolute top-0 end-0 h-100 d-flex align-items-center justify-content-center"
                          style={{
                            width: '20px',
                            fontSize: '12px',
                            color: '#dc3545',
                            backgroundColor: 'rgba(220, 53, 69, 0.1)',
                            borderTopRightRadius: '0.375rem',
                            borderBottomRightRadius: '0.375rem'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(220, 53, 69, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
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

              <div className="mb-3">
                <strong>Description:</strong>
                <div className="text-muted mt-1">{displayPolicy.description}</div>
              </div>

              <div className="mb-4">
                <h4 className="mb-3">Content</h4>
                <div data-color-mode="light">
                  {displayPolicy.content ? (
                    <MarkdownPreview source={displayPolicy.content} />
                  ) : (
                    <div className="text-muted p-3 border rounded bg-light">
                      No content available
                    </div>
                  )}
                </div>
              </div>

              {/* Pending Changes Preview */}
              {hasPendingChanges && canSeePendingChanges && (
                <div className="mb-4">
                  <h4 className="mb-3 text-warning">
                    <AlertCircle size={20} className="me-2" />
                    Pending Changes Preview
                  </h4>
                  <div className="border border-warning rounded p-3 bg-light">
                    {policy.pending_changes.title && (
                      <div className="mb-2">
                        <strong>New Title:</strong> {policy.pending_changes.title}
                      </div>
                    )}
                    {policy.pending_changes.description && (
                      <div className="mb-2">
                        <strong>New Description:</strong> {policy.pending_changes.description}
                      </div>
                    )}
                    {policy.pending_changes.content && (
                      <div>
                        <strong>New Content:</strong>
                        <div data-color-mode="light" className="mt-2">
                          <MarkdownPreview source={policy.pending_changes.content} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Attachments Section */}
              {displayPolicy.attachments && displayPolicy.attachments.length > 0 && (
                <div className="mb-4">
                  <h4 className="mb-3">
                    <FileText size={20} className="me-2" />
                    Attachments ({displayPolicy.attachments.length})
                  </h4>
                  <div className="attachments-list">
                    {displayPolicy.attachments.map((attachment: PolicyAttachment, index: number) => (
                      <div key={index} className="attachment-item border rounded p-3 mb-2 bg-light">
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fs-4">{getFileIcon(attachment.fileType)}</span>
                            <div>
                              <div className="fw-semibold">{attachment.fileName}</div>
                              <div className="text-muted small">
                                {formatFileSize(attachment.fileSize)} • {attachment.fileType}
                                {attachment.uploadedAt && (
                                  <span className="ms-2">
                                    • {new Date(attachment.uploadedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = attachment.fileUrl;
                                link.download = attachment.fileName;
                                link.target = '_blank';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              title="Download file"
                            >
                              <Download size={16} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => window.open(attachment.fileUrl, '_blank')}
                              title="Open in new tab"
                            >
                              <ExternalLink size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {policy.status === 'active' && policy.require_signature && (
                <div className="mb-4">
                  <h5>Electronic Signature</h5>
                  {userHasSigned ? (
                    <div className="alert alert-success">
                      <CheckCircle size={16} className="me-2" />
                      Signed on {userSignature ? new Date(userSignature.signedAt).toLocaleDateString() : new Date().toLocaleDateString()}
                    </div>
                  ) : (
                    <>
                      <p className="text-muted small">Type your full name to acknowledge you have read and agree to this policy.</p>
                      <div className="input-group" style={{ maxWidth: 420 }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Full name"
                          value={signatureName}
                          onChange={(e) => setSignatureName(e.target.value)}
                        />
                        <button className="btn btn-primary" disabled={signing || !signatureName.trim()} onClick={handleSignPolicy}>
                          {signing ? 'Signing...' : 'Sign'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              <div className="d-flex justify-content-end">
                <button className="btn btn-link" onClick={() => router.back()}>
                  <ArrowLeft size={16} className="me-1" /> Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>





      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal fade show" style={{ display: 'block', zIndex: 1050 }} tabIndex={-1}>
          <div className="modal-dialog" style={{ zIndex: 1055 }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDeleteConfirm(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this policy? This action cannot be undone.</p>
                <p className="text-muted small">Policy: {policy?.title}</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Deleting...
                    </>
                  ) : (
                    'Delete Policy'
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
        </div>
      )}
    </div>
  );
} 