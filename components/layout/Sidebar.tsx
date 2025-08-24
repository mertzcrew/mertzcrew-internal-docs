"use client";
import React, { useState, useEffect } from 'react';
import Header from './Header';
import NotificationBell from '../notifications/NotificationBell';
import GlobalSearch from '../search/GlobalSearch';
import { User, Settings, LogOut, Building2 } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

function Sidebar() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [assignedPoliciesCount, setAssignedPoliciesCount] = useState(0);
  const { data: session, status } = useSession();
  const router = useRouter();
  const handleSignOut = () => signOut({ callbackUrl: '/' });

  // Fetch assigned policies count
  useEffect(() => {
    const fetchAssignedPoliciesCount = async () => {
      if (status === 'authenticated' && session?.user?.id) {
        try {
          const response = await fetch('/api/policies?assigned=true', {
            credentials: 'include',
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setAssignedPoliciesCount(data.policies?.length || 0);
            }
          }
        } catch (error) {
          console.error('Error fetching assigned policies count:', error);
        }
      }
    };

    fetchAssignedPoliciesCount();
  }, [status, session?.user?.id]);

  // Listen for policy assignment changes
  useEffect(() => {
    const handlePolicyAssignmentChange = () => {
      const fetchAssignedPoliciesCount = async () => {
        if (status === 'authenticated' && session?.user?.id) {
          try {
            const response = await fetch('/api/policies?assigned=true', {
              credentials: 'include',
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.success) {
                setAssignedPoliciesCount(data.policies?.length || 0);
              }
            }
          } catch (error) {
            console.error('Error fetching assigned policies count:', error);
          }
        }
      };
      fetchAssignedPoliciesCount();
    };

    window.addEventListener('policyAssignmentChange', handlePolicyAssignmentChange);
    return () => {
      window.removeEventListener('policyAssignmentChange', handlePolicyAssignmentChange);
    };
  }, [status, session?.user?.id]);

  const handleBrandClick = () => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  };

  return (
    <div className="bg-white border-end" style={{ width: "280px", minHeight: "100vh" }}>
      <div className="p-3 border-bottom">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div 
            className="d-flex align-items-center"
            onClick={handleBrandClick}
            style={{ 
              cursor: status === 'authenticated' ? 'pointer' : 'default',
              transition: 'opacity 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (status === 'authenticated') {
                e.currentTarget.style.opacity = '0.7';
              }
            }}
            onMouseLeave={(e) => {
              if (status === 'authenticated') {
                e.currentTarget.style.opacity = '1';
              }
            }}
          >
            <div
              className="rounded me-2 d-flex align-items-center justify-content-center"
              style={{
                width: "32px",
                height: "32px",
                backgroundColor: "#ca1f27",
                color: "white",
              }}
            >
              <Building2 size={18} />
            </div>
            <h5 className="mb-0 fw-bold">Mertz Control Room</h5>
          </div>
          <NotificationBell />
        </div>
      </div>
      <Header activeNav={activeNav} setActiveNav={setActiveNav} assignedPoliciesCount={assignedPoliciesCount} />
      {/* User Profile */}
      <div className="mt-auto p-3 border-top">
        <div className="d-flex align-items-center">
          <div
            className="rounded-circle bg-secondary d-flex align-items-center justify-content-center me-2"
            style={{ width: "32px", height: "32px" }}
          >
            <User size={16} className="text-white" />
          </div>
          <div className="flex-grow-1">
            <div className="fw-semibold small">{session?.user?.name || 'User'}</div>
            <div 
              className="text-muted small"
              title={session?.user?.email || 'user@mertzcrew.com'}
            >
              {(session?.user?.email || 'user@mertzcrew.com').length > 18 
                ? `${(session?.user?.email || 'user@mertzcrew.com').substring(0, 18)}...`
                : (session?.user?.email || 'user@mertzcrew.com')
              }
            </div>
            {session?.user?.role === 'admin' && (
              <div className="text-muted small">{session?.user?.role}</div>
            )}
          </div>
          <div className="d-flex gap-1">
            <button className="btn btn-link p-1" title="Settings">
              <Settings size={16} className="text-muted" />
            </button>
            <button 
              className="btn btn-link p-1" 
              title="Sign Out"
              onClick={handleSignOut}
            >
              <LogOut size={16} className="text-muted" />
            </button>
          </div>
        </div>

        {session?.user?.role === 'admin' && (
          <Header activeNav={activeNav} setActiveNav={setActiveNav} isAdmin={true} assignedPoliciesCount={assignedPoliciesCount} />
        )}
      </div>
    </div>
  );
}

export default Sidebar; 