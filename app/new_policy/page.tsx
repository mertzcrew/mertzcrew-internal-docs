"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PolicyForm from "@/components/forms/policies/PolicyForm";

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

interface User {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface PolicyFormValues {
  title: string;
  category: string;
  organization: string;
  department?: string;
  description: string;
  tags: string;
  body: string;
  status: string;
  isDraft: boolean;
  effective_date?: string;
  require_signature?: boolean;
}

const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
const todayISO = `${yyyy}-${mm}-${dd}`;

const initialForm: PolicyFormValues = {
  title: "",
  category: "",
  organization: "",
  department: "",
  description: "",
  tags: "",
  body: "",
  status: "draft",
  isDraft: true,
  effective_date: todayISO,
  require_signature: false,
};

export default function NewPolicyPage() {
  const [form, setForm] = useState<PolicyFormValues>(initialForm);
  const [attachments, setAttachments] = useState<PolicyAttachment[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();

  // Fetch available users on component mount and set user's organization
  useEffect(() => {
    console.log('useEffect triggered - status:', status, 'session:', session?.user?.organization, 'form.organization:', form.organization);
    
    if (status === 'authenticated') {
      fetchUsers();
      
      // Set the user's organization as default if not already set
      if (session?.user?.organization && !form.organization) {
        console.log('Setting organization to user organization:', session.user.organization);
        setForm(prev => ({ ...prev, organization: session.user.organization! }));
      }
    }
  }, [status, session?.user?.organization, form.organization]);

  // Separate useEffect to handle organization setting
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.organization && form.organization === '') {
      console.log('Setting organization from session:', session.user.organization);
      setForm(prev => ({ ...prev, organization: session.user.organization! }));
    }
  }, [status, session?.user?.organization, form.organization]);

  // Fetch available users for assignment
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch('/api/users', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAvailableUsers(data.users || []);
          
          // Automatically add the current user to selected users if they exist in the available users
          const currentUser = data.users.find((user: User) => user._id === session?.user?.id);
          if (currentUser && !selectedUsers.includes(currentUser._id)) {
            setSelectedUsers([currentUser._id]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Debug attachments changes
  const handleAttachmentsChange = (newAttachments: PolicyAttachment[]) => {
    console.log('New policy page - attachments changed:', newAttachments);
    setAttachments(newAttachments);
  };

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    if (e.target.name === "isDraft" && e.target instanceof HTMLInputElement) {
      const isDraft = e.target.checked;
      setForm({ 
        ...form, 
        isDraft,
        status: isDraft ? "draft" : "active"
      });
    } else if (e.target.name === 'organization') {
      const org = e.target.value;
      setForm({
        ...form,
        organization: org,
        // Clear department when org is not mertzcrew
        department: org === 'mertzcrew' ? form.department : ''
      });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
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

  function handleUserSelection(userId: string, isSelected: boolean) {
    if (isSelected) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  }

  function validate(values: PolicyFormValues) {
    const errs: { [k: string]: string } = {};
    if (!values.title.trim()) errs.title = "Title is required";
    if (!values.category.trim()) errs.category = "Category is required";
    if (!values.organization.trim()) errs.organization = "Organization is required";
    // Description is optional
    // if (!values.description.trim()) errs.description = "Description is required";
    
    // Body content is only required if there are no attachments
    const hasAttachments = attachments.length > 0;
    console.log('Validation - body content:', values.body.trim());
    console.log('Validation - attachments count:', attachments.length);
    console.log('Validation - hasAttachments:', hasAttachments);
    
    if (!values.body.trim() && !hasAttachments) {
      errs.body = "Either body content or attachments are required";
      console.log('Validation - Adding body error');
    }

    // User assignment is optional for all users (no validation required)
    
    console.log('Validation - errors:', errs);
    return errs;
  }

  // Function to scroll to the first error field
  const scrollToFirstError = (errorKeys: string[]) => {
    if (errorKeys.length === 0) return;
    
    // Try to find the first error field by its name
    const firstErrorKey = errorKeys[0];
    let errorElement = document.querySelector(`[name="${firstErrorKey}"]`) as HTMLElement;
    
    // Special handling for assignedUsers error (UserAssignmentInput component)
    if (firstErrorKey === 'assignedUsers') {
      // Look for the UserAssignmentInput component or its error message
      errorElement = document.querySelector('.invalid-feedback.d-block') as HTMLElement;
      if (!errorElement) {
        // If no error message found, look for the UserAssignmentInput container
        errorElement = document.querySelector('.mb-3') as HTMLElement;
      }
    }
    
    if (errorElement) {
      // Scroll to the error field with some offset
      errorElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      // Focus the field if it's an input element
      if (errorElement.tagName === 'INPUT' || errorElement.tagName === 'SELECT' || errorElement.tagName === 'TEXTAREA') {
        errorElement.focus();
      }
    } else {
      // If we can't find the specific field, scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Function to scroll to top of page
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log('Submit - form:', form);
    console.log('Submit - attachments:', attachments);
    console.log('Submit - attachments length:', attachments.length);
    console.log('Submit - selected users:', selectedUsers);
    
    const errs = validate(form);
    setErrors(errs);
    
    // If there are validation errors, scroll to the first error field
    if (Object.keys(errs).length > 0) {
      // Small delay to ensure error messages are rendered
      setTimeout(() => {
        scrollToFirstError(Object.keys(errs));
      }, 100);
      return;
    }
    
    if (Object.keys(errs).length === 0) {
      setIsSubmitting(true);
      setSubmitMessage(null);
      
      try {
        const requestBody = {
          title: form.title,
          content: form.body, // WYSIWYG content
          description: form.description,
          category: form.category,
          organization: form.organization,
          department: form.department || undefined,
          effective_date: form.effective_date ? new Date(form.effective_date) : undefined,
          tags: form.tags,
          status: form.status,
          isDraft: form.isDraft,
          require_signature: !!form.require_signature,
          assigned_users: selectedUsers.filter(userId => userId !== session?.user?.id), // Exclude current user since API adds them automatically
          attachments: attachments
        };
        
        console.log('Frontend - Request body being sent:', requestBody);
        console.log('Frontend - Category value:', form.category);
        console.log('Frontend - Organization value:', form.organization);
        console.log('Frontend - Selected users (including current):', selectedUsers);
        console.log('Frontend - Assigned users (excluding current):', requestBody.assigned_users);
        console.log('Frontend - Current user ID:', session?.user?.id);
        
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
            department: form.department || undefined,
            effective_date: form.effective_date ? new Date(form.effective_date) : undefined,
            tags: form.tags,
            status: form.status,
            isDraft: form.isDraft,
            require_signature: !!form.require_signature,
            assigned_users: selectedUsers.filter(userId => userId !== session?.user?.id), // Exclude current user since API adds them automatically
            attachments: attachments
          }),
        });

        const result = await response.json();

        if (response.ok) {
          console.log('Policy creation - API response:', result);
          console.log('Policy creation - Policy ID:', result.data?._id);
          
          const successMessage = form.isDraft 
            ? 'Policy created as draft successfully!' 
            : 'Policy created and published successfully!';
          setSubmitMessage({ type: 'success', text: successMessage });
          
          // Dispatch event to notify sidebar to refresh assigned policies count
          window.dispatchEvent(new CustomEvent('policyAssignmentChange'));
          
          // Get the created policy ID from the response
          const policyId = result.data?._id;
          
          // Reset form after successful submission
          setTimeout(() => {
            setForm(initialForm);
            setSelectedUsers([]);
            setSubmitMessage(null);
            
            // Navigate to the newly created policy's detail page
            if (policyId) {
              console.log('Policy creation - Navigating to policy:', policyId);
              router.push(`/policy/${policyId}`);
            } else {
              console.log('Policy creation - No policy ID found, falling back to dashboard');
              // Fallback to dashboard if policy ID is not available
              router.push('/dashboard');
            }
          }, 2000);
        } else {
          setSubmitMessage({ 
            type: 'error', 
            text: result.message || 'Failed to create policy' 
          });
          // Scroll to top when there's a backend error (with small delay to ensure message is rendered)
          setTimeout(() => {
            scrollToTop();
          }, 100);
        }
      } catch (error) {
        console.error('Error creating policy:', error);
        setSubmitMessage({ 
          type: 'error', 
          text: 'An error occurred while creating the policy' 
        });
        // Scroll to top when there's a network/other error (with small delay to ensure message is rendered)
        setTimeout(() => {
          scrollToTop();
        }, 100);
      } finally {
        setIsSubmitting(false);
      }
    }
  }

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

  const isAdmin = session?.user?.role === 'admin';

  return (
    <PolicyForm
      form={form}
      attachments={attachments}
      onAttachmentsChange={handleAttachmentsChange}
      errors={errors}
      isSubmitting={isSubmitting}
      submitMessage={submitMessage}
      handleSubmit={handleSubmit}
      handleChange={handleChange}
      handleBodyChange={handleBodyChange}
      onCancel={() => router.push('/dashboard')}
      // User assignment props - available for all users but optional
      availableUsers={availableUsers}
      selectedUsers={selectedUsers}
      onUserSelection={handleUserSelection}
      loadingUsers={loadingUsers}
      isAdmin={isAdmin}
      currentUserId={session?.user?.id}
    />
  )
} 