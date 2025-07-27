"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import PolicyForm from "@/components/forms/policies/PolicyForm";

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
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();

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
            tags: form.tags,
            status: form.status
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