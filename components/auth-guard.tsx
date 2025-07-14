"use client"

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredPermissions?: string[];
}

export default function AuthGuard({ children, requiredRole, requiredPermissions }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    // Check role requirements
    if (requiredRole && session.user.role !== requiredRole && session.user.role !== 'admin') {
      router.push('/auth/signin');
      return;
    }

    // Check permission requirements
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.some(permission => 
        session.user.permissions?.includes(permission) || session.user.role === 'admin'
      );
      
      if (!hasPermission) {
        router.push('/');
        // router.push('/auth/signin');
        return;
      }
    }
  }, [session, status, router, requiredRole, requiredPermissions]);

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting
  if (!session) {
    return null;
  }

  // Check role requirements
  if (requiredRole && session.user.role !== requiredRole && session.user.role !== 'admin') {
    return null;
  }

  // Check permission requirements
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasPermission = requiredPermissions.some(permission => 
      session.user.permissions?.includes(permission) || session.user.role === 'admin'
    );
    
    if (!hasPermission) {
      return null;
    }
  }

  return <>{children}</>;
} 