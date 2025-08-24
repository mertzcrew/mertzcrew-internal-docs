"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Please enter your email address' });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: result.message });
        setEmail('');
      } else {
        setMessage({ type: 'error', text: result.message || 'An error occurred. Please try again.' });
      }
    } catch (error) {
      console.error('Error requesting password reset:', error);
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow">
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <div
                    className="rounded-circle bg-primary d-flex align-items-center justify-content-center mx-auto mb-3"
                    style={{ width: '60px', height: '60px' }}
                  >
                    <Mail size={24} className="text-white" />
                  </div>
                  <h4 className="mb-2">Forgot Password?</h4>
                  <p className="text-muted mb-0">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>

                {message && (
                  <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`} role="alert">
                    {message.text}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setMessage(null)}
                    />
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 mb-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Sending Reset Link...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>
                </form>

                <div className="text-center">
                  <Link href="/auth/signin" className="text-decoration-none">
                    <ArrowLeft size={16} className="me-1" />
                    Back to Sign In
                  </Link>
                </div>
              </div>
            </div>

            <div className="text-center mt-3">
              <small className="text-muted">
                Remember your password?{' '}
                <Link href="/auth/signin" className="text-decoration-none">
                  Sign in here
                </Link>
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 