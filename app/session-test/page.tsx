"use client";

import { useSession } from "next-auth/react";

export default function SessionTestPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return <div>Not authenticated</div>;
  }

  return (
    <div className="container mt-5">
      <h1>Session Test</h1>
      <pre className="bg-light p-3 rounded">
        {JSON.stringify(session, null, 2)}
      </pre>
    </div>
  );
} 