"use client"

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Building2 } from 'lucide-react';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow border-0">
              <div className="card-body p-5">
                {/* Logo and Title */}
                <div className="text-center mb-4">
                  <div
                    className="rounded mx-auto mb-3 d-flex align-items-center justify-content-center"
                    style={{
                      width: "60px",
                      height: "60px",
                      backgroundColor: "#ca1f27",
                      color: "white",
                    }}
                  >
                    <Building2 size={30} />
                  </div>
                  <h3 className="fw-bold">Mertz Control Room</h3>
                  <p className="text-muted">Sign in to access your workspace</p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                {/* Sign In Form */}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label fw-semibold">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="form-control form-control-lg"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label htmlFor="password" className="form-label fw-semibold mb-0">
                        Password
                      </label>
                      <a href="/forgot-password" className="text-decoration-none small">
                        Forgot Password?
                      </a>
                    </div>
                    <div className="position-relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-control form-control-lg pe-5"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        className="btn position-absolute end-0 top-0 h-100 border-0 bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ zIndex: 10 }}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-lg w-100 text-white fw-semibold mb-3"
                    style={{ backgroundColor: '#ca1f27' }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>

                <div className="d-flex align-items-center my-3">
                  <div className="flex-grow-1 border-top" />
                  <span className="mx-2 text-muted small">OR</span>
                  <div className="flex-grow-1 border-top" />
                </div>

                <button
                  type="button"
                  className="btn btn-outline-secondary w-100"
                  onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                >
                  Continue with Google
                </button>

                {/* Footer */}
                <div className="text-center mt-4">
                  <p className="text-muted small mb-0">
                    Need help? Contact your administrator
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 