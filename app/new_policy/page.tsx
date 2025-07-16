"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface PolicyFormValues {
  title: string;
  category: string;
  tags: string;
  body: string;
}

const initialForm: PolicyFormValues = {
  title: "",
  category: "",
  tags: "",
  body: "",
};

export default function NewPolicyPage() {
  const [form, setForm] = useState<PolicyFormValues>(initialForm);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleBodyChange(value: string | undefined) {
    setForm({ ...form, body: value || "" });
  }

  function validate(values: PolicyFormValues) {
    const errs: { [k: string]: string } = {};
    if (!values.title.trim()) errs.title = "Title is required";
    if (!values.body.trim()) errs.body = "Body is required";
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setSubmitted(true);
      console.log("New Policy:", form);
      // Reset form if desired
      // setForm(initialForm);
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-7">
          <div className="card shadow border-0">
            <div className="card-body p-4">
              <h2 className="mb-4">Create New Policy</h2>
              {submitted && (
                <div className="alert alert-success">Policy submitted! (See console for data)</div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Title</label>
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
                  <label className="form-label fw-semibold">Category</label>
                  <input
                    name="category"
                    className="form-control"
                    value={form.category}
                    onChange={handleChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Tags (comma separated)</label>
                  <input
                    name="tags"
                    className="form-control"
                    value={form.tags}
                    onChange={handleChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Body</label>
                  <div data-color-mode="light">
                    <MDEditor
                      value={form.body}
                      onChange={handleBodyChange}
                      height={300}
                    />
                  </div>
                  {errors.body && <div className="invalid-feedback d-block">{errors.body}</div>}
                </div>
                <div className="d-flex justify-content-end">
                  <button type="submit" className="btn btn-primary">
                    Create Policy
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