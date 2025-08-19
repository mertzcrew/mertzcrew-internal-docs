"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
  attachments?: PolicyAttachment[];
  effective_date?: string | Date;
  pending_changes?: any;
}

interface PolicyFormValues {
  title: string;
  category: string;
  organization: string;
  department?: string;
  description: string;
  tags: string;
  content: string;
  status: string;
  effective_date?: string;
}

const initialForm: PolicyFormValues = {
  title: "",
  category: "",
  organization: "all",
  department: "",
  description: "",
  tags: "",
  content: "",
  status: "draft",
  effective_date: "",
};

export default function EditPolicyPage() {
  const [form, setForm] = useState<PolicyFormValues>(initialForm);
  const [originalForm, setOriginalForm] = useState<PolicyFormValues>(initialForm);
  const [attachments, setAttachments] = useState<PolicyAttachment[]>([]);
  const [originalAttachments, setOriginalAttachments] = useState<PolicyAttachment[]>([]);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();
  const params = useParams();
  const policyId = params.policyId as string;
  const { data: session } = useSession();

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
        const toDateInput = (d?: string | Date) => {
          if (!d) return "";
          const dt = new Date(d);
          if (isNaN(dt.getTime())) return "";
          const yyyy = dt.getFullYear();
          const mm = String(dt.getMonth() + 1).padStart(2, '0');
          const dd = String(dt.getDate()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}`;
        };
        const formData = {
          title: policy.title,
          content: policy.content,
          description: policy.description,
          category: policy.category,
          organization: policy.organization,
          department: (policy as any).department || "",
          tags: policy.tags ? policy.tags.join(", ") : "",
          status: policy.status,
          effective_date: toDateInput(policy.effective_date)
        };
        setForm(formData);
        setOriginalForm(formData);
        setAttachments(policy.attachments || []);
        setOriginalAttachments(policy.attachments || []);
        setHasPendingChanges(policy.pending_changes && Object.keys(policy.pending_changes).length > 0);
      } else {
        setError(result.message || "Policy not found");
      }
    } catch {
      setError("An error occurred while fetching the policy");
    } finally {
      setLoading(false);
    }
  };

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  }

  function handleBodyChange(value: string | undefined) {
    setForm({ ...form, content: value || "" });
    // Clear error when user starts typing
    if (errors.content) {
      setErrors({ ...errors, content: "" });
    }
  }

  function validate(values: PolicyFormValues) {
    const errs: { [k: string]: string } = {};
    if (!values.title.trim()) errs.title = "Title is required";
    if (!values.category.trim()) errs.category = "Category is required";
    if (!values.organization.trim()) errs.organization = "Organization is required";
    // Description is optional
    
    // Body content is only required if there are no attachments
    const hasAttachments = attachments.length > 0;
    if (!values.content.trim() && !hasAttachments) errs.content = "Either body content or attachments are required";
    return errs;
  }

  function hasChanges(): boolean {
    const formChanged = JSON.stringify(form) !== JSON.stringify(originalForm);
    const attachmentsChanged = JSON.stringify(attachments) !== JSON.stringify(originalAttachments);
    return formChanged || attachmentsChanged || hasPendingChanges;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    
    if (Object.keys(errs).length === 0) {
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
            department: form.department || undefined,
            effective_date: form.effective_date || undefined,
            tags: form.tags,
            status: form.status,
            attachments: attachments
          }),
        });

        const result = await response.json();

        if (response.ok) {
          setSubmitMessage({ type: 'success', text: 'Policy updated successfully!' });
          // Update original form and attachments to reflect changes
          setOriginalForm({ ...form });
          setOriginalAttachments([...attachments]);
          setTimeout(() => {
            setSubmitMessage(null);
            router.push(`/policy/${policyId}`);
          }, 2000);
        } else {
          setSubmitMessage({ 
            type: 'error', 
            text: result.message || 'Failed to update policy' 
          });
        }
      } catch (error) {
        console.error('Error updating policy:', error);
        setSubmitMessage({ 
          type: 'error', 
          text: 'An error occurred while updating the policy' 
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  async function handlePublishPolicy() {
    // First validate the form
    const errs = validate(form);
    setErrors(errs);
    
    if (Object.keys(errs).length > 0) {
      return; // Don't proceed if there are validation errors
    }

    setIsPublishing(true);
    setSubmitMessage(null);
    
    try {
      // First save changes (so pending_changes or draft is updated)
      const saveRes = await fetch(`/api/policies/${policyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          description: form.description,
          category: form.category,
          organization: form.organization,
          department: form.department || undefined,
          effective_date: form.effective_date || undefined,
          tags: form.tags,
          attachments: attachments
        })
      });
      const saveJson = await saveRes.json();
      if (!saveRes.ok) {
        setSubmitMessage({ type: 'error', text: saveJson.message || 'Failed to save changes before publishing' });
        setIsPublishing(false);
        return;
      }

      // Then trigger publish
      const response = await fetch(`/api/policies/${policyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish' })
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitMessage({ type: 'success', text: 'Policy published successfully!' });
        // Update form and original form to reflect the status change
        const updatedForm = { ...form, status: 'active' };
        setForm(updatedForm);
        setOriginalForm(updatedForm);
        setTimeout(() => {
          setSubmitMessage(null);
          router.push(`/policy/${policyId}`);
        }, 1500);
      } else {
        setSubmitMessage({ type: 'error', text: result.message || 'Failed to publish policy' });
      }
    } catch (error) {
      console.error('Error publishing policy:', error);
      setSubmitMessage({ type: 'error', text: 'An error occurred while publishing the policy' });
    } finally {
      setIsPublishing(false);
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
          ← Back
        </button>
      </div>
    );
  }

  return (
    <PolicyForm
      form={form}
      attachments={attachments}
      onAttachmentsChange={setAttachments}
      errors={errors}
      isSubmitting={isSubmitting}
      submitMessage={submitMessage}
      handleSubmit={handleSubmit}
      handleChange={handleChange}
      handleBodyChange={handleBodyChange}
      mode="edit"
      policyId={policyId}
      originalStatus={originalForm.status}
      onPublishPolicy={handlePublishPolicy}
      isPublishing={isPublishing}
      hasChanges={hasChanges()}
      onCancel={() => router.push(`/policy/${policyId}`)}
      isAdmin={session?.user?.role === 'admin'}
      currentUserId={session?.user?.id}
    />
  );
} 