"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Home, 
  FileText, 
  Users, 
  Building2, 
  Star, 
  BookOpenText, 
  Search, 
  ClipboardList, 
  Calendar, 
  CheckCircle,
  Plus
} from 'lucide-react';
import NotificationBell from '../notifications/NotificationBell';
import GlobalSearch from '../search/GlobalSearch';
import Image from 'next/image';

function TopNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [activeNav, setActiveNav] = useState("dashboard");

  // Don't show top nav on auth pages
  if (!session || pathname?.startsWith('/auth/')) {
    return null;
  }

  // Update active nav based on pathname
  useEffect(() => {
    if (pathname === '/dashboard') setActiveNav('dashboard');
    else if (pathname === '/search') setActiveNav('search');
    else if (pathname === '/my-assigned-policies') setActiveNav('myAssignedPolicies');
    else if (pathname === '/policies' || pathname?.startsWith('/policies/')) setActiveNav('policies');
    else if (pathname === '/documentation') setActiveNav('documentation');
    else if (pathname === '/hr-resources') setActiveNav('hrResources');
    else if (pathname === '/culture-guide') setActiveNav('cultureGuide');
    else if (pathname === '/processes') setActiveNav('processes');
    else if (pathname === '/quality') setActiveNav('quality');
    else if (pathname === '/calendar') setActiveNav('calendar');
  }, [pathname]);

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, href: "/dashboard" },
    { id: "search", label: "Global Search", icon: Search, href: "/search" },
    { id: "myAssignedPolicies", label: "My Assigned Policies", icon: ClipboardList, href: "/my-assigned-policies" },
    { id: "policies", label: "All Policies", icon: FileText, href: "/policies" },
    { id: "documentation", label: "Documentation", icon: Users, href: "/documentation" },
    { id: "hrResources", label: "HR Resources", icon: Building2, href: "/hr-resources" },
    { id: "cultureGuide", label: "Culture Guide", icon: Star, href: "/culture-guide" },
    { id: "processes", label: "Processes", icon: BookOpenText, href: "/processes" },
    { id: "quality", label: "Quality", icon: CheckCircle, href: "/quality" },
    { id: "calendar", label: "Calendar", icon: Calendar, href: "/calendar" }
  ];

  return (
    <div className="bg-white border-bottom" style={{ borderBottom: '1px solid #dee2e6' }}>
      {/* Top section with logo and actions */}
      <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
        <div className="d-flex align-items-center">
          <div className="me-3">
            <Image
              src="/Mertzcrew.jpeg"
              alt="Mertzcrew Logo"
              width={40}
              height={40}
              className="rounded small-logo-border"
            />
          </div>
          <h5 className="mb-0 fw-bold mt-6" style={{ fontSize: '1.5rem' }}>Control Room</h5>
        </div>
        
        <div className="d-flex align-items-center gap-3">
          <NotificationBell />
          <div style={{ width: "300px" }}>
            <GlobalSearch />
          </div>
          <button 
            className="btn text-white" 
            style={{ backgroundColor: "#ca1f27" }} 
            onClick={() => router.push('/new_policy')}
          >
            <Plus size={16} className="me-1" />
            New Policy
          </button>
        </div>
      </div>

      {/* Navigation items */}
     
    </div>
  );
}

export default TopNavigation; 