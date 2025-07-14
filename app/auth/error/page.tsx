"use client"

import { useSearchParams } from 'next/navigation';
import { Building2, AlertTriangle } from 'lucide-react';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'CredentialsSignin':
        return 'Invalid email or password. Please try again.';
      case 'AccessDenied':
        return 'Access denied. You do not have permission to access this resource.';
      case 'Verification':
        return 'Email verification required. Please check your email.';
      default:
        return 'An authentication error occurred. Please try again.';
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow border-0">
              <div className="card-body p-5 text-center">
                {/* Logo and Title */}
                <div className="mb-4">
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
                  <h3 className="fw-bold">Authentication Error</h3>
                </div>

                {/* Error Icon */}
                <div className="mb-4">
                  <div
                    className="rounded-circle mx-auto d-flex align-items-center justify-content-center"
                    style={{
                      width: "80px",
                      height: "80px",
                      backgroundColor: "#f8d7da",
                      color: "#721c24",
                    }}
                  >
                    <AlertTriangle size={40} />
                  </div>
                </div>

                {/* Error Message */}
                <div className="alert alert-danger" role="alert">
                  <p className="mb-0">{getErrorMessage(error)}</p>
                </div>

                {/* Action Buttons */}
                <div className="d-grid gap-2">
                  <a
                    href="/auth/signin"
                    className="btn text-white fw-semibold"
                    style={{ backgroundColor: '#ca1f27' }}
                  >
                    Try Again
                  </a>
                  <a
                    href="/"
                    className="btn btn-outline-secondary"
                  >
                    Go to Home
                  </a>
                </div>

                {/* Footer */}
                <div className="mt-4">
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