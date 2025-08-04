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
  description: string;
  tags: string;
  body: string;
  status: string;
  isDraft: boolean;
}

const initialForm: PolicyFormValues = {
  title: "",
  category: "",
  organization: "all",
  description: "",
  tags: "",
  body: "",
  status: "draft",
  isDraft: true,
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

  // Fetch available users on component mount
  useEffect(() => {
    if (status === 'authenticated') {
      fetchUsers();
    }
  }, [status]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch('/api/users');
      const result = await response.json();
      
      if (response.ok) {
        setAvailableUsers(result.data);
        // Set the current user as default selected user
        if (session?.user?.id) {
          setSelectedUsers([session.user.id]);
        }
      } else {
        console.error('Failed to fetch users:', result.message);
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
    if (!values.description.trim()) errs.description = "Description is required";
    
    // Body content is only required if there are no attachments
    const hasAttachments = attachments.length > 0;
    console.log('Validation - body content:', values.body.trim());
    console.log('Validation - attachments count:', attachments.length);
    console.log('Validation - hasAttachments:', hasAttachments);
    
    if (!values.body.trim() && !hasAttachments) {
      errs.body = "Either body content or attachments are required";
      console.log('Validation - Adding body error');
    }

    // For non-admin users, require at least one admin user to be assigned
    if (session?.user?.role !== 'admin' && values.isDraft) {
      const hasAdminUser = selectedUsers.some(userId => {
        const user = availableUsers.find(u => u._id === userId);
        return user?.role === 'admin';
      });
      
      if (!hasAdminUser) {
        errs.assignedUsers = "You must assign at least one admin user to review this policy";
      }
    }
    
    console.log('Validation - errors:', errs);
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log('Submit - form:', form);
    console.log('Submit - attachments:', attachments);
    console.log('Submit - attachments length:', attachments.length);
    console.log('Submit - selected users:', selectedUsers);
    
    const errs = validate(form);
    setErrors(errs);
    
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
          tags: form.tags,
          status: form.status,
          isDraft: form.isDraft,
          assigned_users: selectedUsers,
          attachments: attachments
        };
        
        console.log('Frontend - Request body being sent:', requestBody);
        console.log('Frontend - Category value:', form.category);
        console.log('Frontend - Organization value:', form.organization);
        
        const response = await fetch('/api/policies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        const result = await response.json();

        if (response.ok) {
          const successMessage = form.isDraft 
            ? 'Policy created as draft successfully!' 
            : 'Policy created and published successfully!';
          setSubmitMessage({ type: 'success', text: successMessage });
          // Reset form after successful submission
          setTimeout(() => {
            setForm(initialForm);
            setSelectedUsers([]);
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
      // New props for user selection
      availableUsers={availableUsers}
      selectedUsers={selectedUsers}
      onUserSelection={handleUserSelection}
      loadingUsers={loadingUsers}
      isAdmin={isAdmin}
    />
  )
} 