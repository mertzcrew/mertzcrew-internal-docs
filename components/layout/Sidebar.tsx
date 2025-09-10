"use client";
import React, { useState, useEffect } from 'react';
import Header from './Header';
import GlobalSearch from '../search/GlobalSearch';
import { User, Settings, LogOut, Building2, UserPlus, UserPen, Tag, Share2 } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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

  const adminItems = [
    { id: "addUser", label: "Add User", icon: UserPlus, href: "/add-user" },
    { id: "editUsers", label: "Edit User", icon: UserPen, href: "/edit-user" },
    { id: "manageTags", label: "Manage Tags", icon: Tag, href: "/manage-tags" }
  ];

  return (
    <div className="bg-white border-end" style={{ width: "280px", minHeight: "100vh" }}>
      
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
            <button 
              className="btn btn-link p-1" 
              title="Settings"
              onClick={() => router.push('/settings')}
            >
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

        {/* Admin section - only show if user is admin */}
        {session?.user?.role === 'admin' && (
          <div className="mt-3">
            {adminItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`btn w-100 text-start d-flex align-items-center mb-1 ${
                    activeNav === item.id ? "btn-light" : "btn-link text-decoration-none text-dark"
                  }`}
                  onClick={() => {
                    setActiveNav(item.id);
                    if (item.href) router.push(item.href);
                  }}
                  style={{
                    backgroundColor: activeNav === item.id ? "#f8f9fa" : "transparent",
                    border: "none",
                    padding: "8px 12px",
                  }}
                >
                  <Icon size={18} className="me-2" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar; 