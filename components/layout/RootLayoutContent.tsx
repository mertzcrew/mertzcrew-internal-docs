"use client";
import React from "react";
import { useSession } from "next-auth/react";
import Sidebar from "./Sidebar";
import TopNavigation from "./TopNavigation";

interface RootLayoutContentProps {
  children: React.ReactNode;
}

function RootLayoutContent({ children }: RootLayoutContentProps) {
  const { data: session, status } = useSession();

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

  // If not authenticated, show only the children (login page, etc.)
  if (!session) {
    return <>{children}</>;
  }

  // If authenticated, show sidebar with main content
  return (
    <div className="min-vh-100">
      <TopNavigation />
      <div className="d-flex">
        <Sidebar />
        <main className="flex-grow-1">
          {children}
        </main>
      </div>
    </div>
  );
}

export default RootLayoutContent; 