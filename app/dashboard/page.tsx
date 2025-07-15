import Dashboard from "@/components/dashboard/dashboard"
import AuthGuard from "@/components/auth-guard"

export default function DashboardPage() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  )
} 