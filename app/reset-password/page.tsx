"use client";
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) {
      setMessage({ type: 'error', text: 'Invalid reset link. Please request a new password reset.' });
      setTokenValid(false);
    } else {
      setTokenValid(true);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setMessage({ type: 'error', text: 'Invalid reset link. Please request a new password reset.' });
      return;
    }

    if (password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token,
          password 
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: result.message });
        setPassword('');
        setConfirmPassword('');
        
        // Redirect to sign in after 3 seconds
        setTimeout(() => {
          router.push('/auth/signin');
        }, 3000);
      } else {
        setMessage({ type: 'error', text: result.message || 'An error occurred. Please try again.' });
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (tokenValid === false) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-4">
              <div className="card shadow">
                <div className="card-body p-4 text-center">
                  <div
                    className="rounded-circle bg-danger d-flex align-items-center justify-content-center mx-auto mb-3"
                    style={{ width: '60px', height: '60px' }}
                  >
                    <Lock size={24} className="text-white" />
                  </div>
                  <h4 className="mb-3">Invalid Reset Link</h4>
                  <p className="text-muted mb-4">
                    The password reset link is invalid or has expired. Please request a new password reset.
                  </p>
                  <Link href="/forgot-password" className="btn btn-primary">
                    Request New Reset Link
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                    <Lock size={24} className="text-white" />
                  </div>
                  <h4 className="mb-2">Reset Your Password</h4>
                  <p className="text-muted mb-0">
                    Enter your new password below.
                  </p>
                </div>

                {message && (
                  <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`} role="alert">
                    {message.text}
                    {message.type === 'success' && (
                      <div className="mt-2">
                        <small>Redirecting to sign in page...</small>
                      </div>
                    )}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setMessage(null)}
                    />
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                      New Password
                    </label>
                    <div className="input-group">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-control"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your new password"
                        required
                        disabled={loading}
                        minLength={8}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div className="form-text">
                      Password must be at least 8 characters long
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="confirmPassword" className="form-label">
                      Confirm New Password
                    </label>
                    <div className="input-group">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="form-control"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your new password"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={loading}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 mb-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Resetting Password...
                      </>
                    ) : (
                      'Reset Password'
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