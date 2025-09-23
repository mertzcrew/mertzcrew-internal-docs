"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AddUserForm from "@/components/admin/AddUserForm";

interface FormData {
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  role: string;
  permissions: string[];
  organization: string;
  department: string;
  position?: string;
  phone?: string;
}

export default function EditUserPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
  }, [status]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/users/${userId}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.message || 'Failed to load user');
          return;
        }
        const u = data.data;
        setFormData({
          email: u.email,
          first_name: u.first_name,
          last_name: u.last_name,
          role: u.role,
          permissions: u.permissions || [],
          organization: u.organization,
          department: u.department || '',
          position: u.position || '',
          phone: u.phone || ''
        });
      } catch {
        setError('Failed to load user');
      } finally {
        setLoading(false);
      }
    };
    if (userId) loadUser();
  }, [userId]);

  if (loading) return (
    <div className="container py-4 d-flex justify-content-center"><div className="spinner-border" role="status" /></div>
  );

  if (error || !formData) return (
    <div className="container py-4"><div className="alert alert-danger">{error || 'User not found'}</div></div>
  );

  return (
    <div className="container py-4">
      <h1 className="h3 mb-3">Edit User</h1>
      <AddUserForm editMode initialData={formData} userId={userId} />
    </div>
  );
} 