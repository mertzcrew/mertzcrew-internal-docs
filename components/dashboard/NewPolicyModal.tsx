import React, { useRef, useState } from 'react';
import { Editor, EditorProvider } from 'react-simple-wysiwyg';

interface NewPolicyModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (values: PolicyFormValues) => void;
}

interface PolicyFormValues {
  title: string;
  category: string;
  tags: string;
  body: string;
}

const initialForm: PolicyFormValues = {
  title: '',
  category: '',
  tags: '',
  body: '',
};

export default function NewPolicyModal({ show, onClose, onSubmit }: NewPolicyModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<PolicyFormValues>(initialForm);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === modalRef.current) onClose();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleBodyChange(e: { target: { value: string } }) {
    setForm({ ...form, body: e.target.value });
  }

  function validate(values: PolicyFormValues) {
    const errs: { [k: string]: string } = {};
    if (!values.title.trim()) errs.title = 'Title is required';
    // Remove HTML tags and check if body has text
    const bodyText = values.body.replace(/<[^>]+>/g, '').trim();
    if (!bodyText) errs.body = 'Body is required';
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      onSubmit(form);
      setForm(initialForm);
      setErrors({});
      onClose();
    }
  }

  function handleClose() {
    setForm(initialForm);
    setErrors({});
    onClose();
  }

  return (
    <div
      className={`modal fade${show ? ' show d-block' : ''}`}
      tabIndex={-1}
      role="dialog"
      ref={modalRef}
      onClick={handleBackdropClick}
      style={{ backgroundColor: show ? 'rgba(0,0,0,0.5)' : undefined }}
      aria-modal="true"
    >
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">Create New Policy</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={handleClose}></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label fw-semibold">Title</label>
                <input
                  name="title"
                  className={`form-control${errors.title ? ' is-invalid' : ''}`}
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
                <EditorProvider>
                  <Editor
                    value={form.body}
                    onChange={handleBodyChange}
                    placeholder="Enter policy body..."
                  />
                </EditorProvider>
                {errors.body && <div className="invalid-feedback d-block">{errors.body}</div>}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Create Policy
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 