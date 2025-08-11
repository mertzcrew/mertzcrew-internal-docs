"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { BookOpen, Globe, Building2, Tag, FileText, Download, ExternalLink, ArrowLeft } from "lucide-react";
import { DEPARTMENTS, POLICY_ORGANIZATIONS } from "../../../../lib/validations";
import "@uiw/react-markdown-preview/markdown.css";

const MarkdownPreview = dynamic(() => import("@uiw/react-markdown-preview"), { ssr: false });

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getFileIcon(fileType: string): string {
  if (fileType.includes("pdf")) return "📄";
  if (fileType.includes("word") || fileType.includes("document")) return "📝";
  if (fileType.includes("excel") || fileType.includes("spreadsheet")) return "📊";
  if (fileType.includes("powerpoint") || fileType.includes("presentation")) return "📈";
  if (fileType.includes("text")) return "📄";
  if (fileType.includes("csv")) return "📊";
  return "📎";
}

export default function CurrentPublishedPolicyPage() {
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const policyId = params.policyId as string;

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/policies/${policyId}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || "Failed to fetch policy");
          return;
        }
        // Use the published version only (do not overlay pending_changes)
        setPolicy(data.data);
      } catch (e) {
        setError("Failed to load policy");
      } finally {
        setLoading(false);
      }
    };
    fetchPolicy();
  }, [policyId]);

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !policy) {
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
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="mb-0">{policy.title}</h2>
                {/* No action buttons on current published view */}
              </div>

              <div className="mb-3 text-muted">
                <span className="me-3">
                  <BookOpen size={14} className="me-1" /> {policy.category}
                </span>
                <span className="me-3 d-inline-flex align-items-center" style={{ lineHeight: 1 }}>
                  {policy.organization === 'mertzcrew' ? (
                    <img src="/Mertzcrew.jpeg" alt="Mertzcrew" className="org-icon" loading="lazy" />
                  ) : policy.organization === 'mertz_production' ? (
                    <img src="/mertz_productions_logo.jpeg" alt="Mertz Production" className="org-icon" loading="lazy" />
                  ) : (
                    <Globe size={14} className="me-1 align-middle" />
                  )}
                  <span className="align-middle">
                    {(POLICY_ORGANIZATIONS.find((o: { value: string }) => o.value === policy.organization)?.display) || policy.organization}
                  </span>
                </span>
                {policy.department && (
                  <span className="me-3">
                    <Building2 size={14} className="me-1" />
                    {DEPARTMENTS.find((d: { value: string }) => d.value === policy.department)?.display || policy.department}
                  </span>
                )}
                <span className="me-3">
                  <span className={`badge ${policy.status === 'active' ? 'bg-success' : 'bg-warning'}`}>
                    {policy.status === 'active' ? 'Published' : 'Draft'}
                  </span>
                </span>
                {policy.tags && policy.tags.length > 0 && (
                  <span>
                    <Tag size={14} className="me-1" />
                    {policy.tags.map((tag: string, idx: number) => (
                      <span key={idx} className="badge bg-light text-dark me-1">
                        {tag}
                      </span>
                    ))}
                  </span>
                )}
              </div>

              {policy.assigned_users && policy.assigned_users.length > 0 && (
                <div className="mb-3">
                  <strong>Assigned Users:</strong>
                  <div className="mt-2 d-flex flex-wrap gap-2">
                    {policy.assigned_users.map((user: any) => (
                      <div key={user._id} className="d-flex align-items-center">
                        <span className="badge bg-info me-2">
                          {user.first_name} {user.last_name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-3">
                <strong>Description:</strong>
                <div className="text-muted mt-1">{policy.description}</div>
              </div>

              <div className="mb-4">
                <h4 className="mb-3">Content</h4>
                <div data-color-mode="light">
                  {policy.content ? (
                    <MarkdownPreview source={policy.content} />
                  ) : (
                    <div className="text-muted p-3 border rounded bg-light">No content available</div>
                  )}
                </div>
              </div>

              {policy.attachments && policy.attachments.length > 0 && (
                <div className="mb-4">
                  <h4 className="mb-3">
                    <FileText size={20} className="me-2" />
                    Attachments ({policy.attachments.length})
                  </h4>
                  <div className="attachments-list">
                    {policy.attachments.map((attachment: any, index: number) => (
                      <div key={index} className="attachment-item border rounded p-3 mb-2 bg-light">
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center">
                            <span className="me-2 fs-4">{getFileIcon(attachment.fileType)}</span>
                            <div>
                              <div className="fw-semibold">{attachment.fileName}</div>
                              <div className="text-muted small">
                                {formatFileSize(attachment.fileSize)} • {attachment.fileType}
                                {attachment.uploadedAt && (
                                  <span className="ms-2">• {new Date(attachment.uploadedAt).toLocaleDateString()}</span>
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

              <div className="d-flex justify-content-end">
                <button className="btn btn-link" onClick={() => router.back()}>
                  <ArrowLeft size={16} className="me-1" /> Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 