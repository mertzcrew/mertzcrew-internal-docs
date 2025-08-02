"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

interface PolicyFormValues {
  title: string;
  category: string;
  organization: string;
  description: string;
  tags: string;
  body: string;
  status: string;
}

const initialForm: PolicyFormValues = {
  title: "",
  category: "",
  organization: "all",
  description: "",
  tags: "",
  body: "",
  status: "active",
};

export default function NewPolicyPage() {
  const [form, setForm] = useState<PolicyFormValues>(initialForm);
  const [attachments, setAttachments] = useState<PolicyAttachment[]>([]);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();

  // Debug attachments changes
  const handleAttachmentsChange = (newAttachments: PolicyAttachment[]) => {
    console.log('New policy page - attachments changed:', newAttachments);
    setAttachments(newAttachments);
  };



  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    if (e.target.name === "status" && e.target instanceof HTMLInputElement) {
      setForm({ ...form, [e.target.name]: e.target.checked ? "draft" : "active" });
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
    
    console.log('Validation - errors:', errs);
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log('Submit - form:', form);
    console.log('Submit - attachments:', attachments);
    console.log('Submit - attachments length:', attachments.length);
    
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
            tags: form.tags,
            status: form.status,
            attachments: attachments
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

  //form, errors, isSubmitting, submitMessage, handleSubmit, handleChange, handleBodyChange, router
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
    />
  )
   

} 