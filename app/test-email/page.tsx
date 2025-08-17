"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function TestEmailPage() {
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; error?: string } | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not admin
  if (status === 'loading') {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'admin') {
    router.push('/dashboard');
    return null;
  }

  const handleTestEmail = async () => {
    setIsTesting(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to test email service',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow">
            <div className="card-header">
              <h3 className="mb-0">Test Email Service</h3>
            </div>
            <div className="card-body">
              <p className="text-muted mb-4">
                This page allows you to test the email service configuration. 
                Make sure you have set up your SENDGRID_API_KEY in the environment variables.
              </p>

              <div className="mb-4">
                <h5>Environment Variables Required:</h5>
                <ul className="list-unstyled">
                  <li><code>SENDGRID_API_KEY</code> - Your SendGrid API key</li>
                  <li><code>FROM_EMAIL</code> - The email address to send from (optional, defaults to noreply@yourdomain.com)</li>
                  <li><code>TEST_EMAIL</code> - Email address to send test emails to (optional, defaults to test@example.com)</li>
                </ul>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleTestEmail}
                disabled={isTesting}
              >
                {isTesting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Testing Email Service...
                  </>
                ) : (
                  'Test Email Service'
                )}
              </button>

              {result && (
                <div className={`alert alert-${result.success ? 'success' : 'danger'} mt-3`}>
                  <h6>{result.success ? 'Success!' : 'Error'}</h6>
                  <p className="mb-1">{result.message}</p>
                  {result.error && (
                    <details>
                      <summary>Error Details</summary>
                      <pre className="mt-2 mb-0 small">{result.error}</pre>
                    </details>
                  )}
                </div>
              )}

              <div className="mt-4">
                <a href="/dashboard" className="btn btn-outline-secondary">
                  Back to Dashboard
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 