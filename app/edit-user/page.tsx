"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search, User } from "lucide-react";

interface UserItem {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  organization: string;
}

export default function EditUserSearchPage() {
  const { status } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (query.trim().length < 2) { setResults([]); return; }
      try {
        setLoading(true);
        const res = await fetch(`/api/users?search=${encodeURIComponent(query)}&limit=20`);
        const data = await res.json();
        if (res.ok && data.success) setResults(data.users || []);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="container py-4">
      <h1 className="h3 mb-3">Edit User</h1>
      <div className="input-group mb-3">
        <span className="input-group-text"><Search size={16} /></span>
        <input
          className="form-control"
          placeholder="Search by name or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {loading && <div className="text-muted">Searching...</div>}
      <div className="list-group">
        {results.map(u => (
          <button
            key={u._id}
            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
            onClick={() => router.push(`/edit-user/${u._id}`)}
          >
            <div>
              <div className="fw-semibold"><User size={14} className="me-1" /> {u.first_name} {u.last_name}</div>
              <div className="text-muted small">{u.email} • {u.organization} • {u.role}</div>
            </div>
            <span className="text-primary small">Edit</span>
          </button>
        ))}
      </div>
    </div>
  );
} 