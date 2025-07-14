"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import {
  Search,
  Bell,
  Plus,
  FileText,
  Users,
  Eye,
  Folder,
  TrendingUp,
  MoreHorizontal,
  Home,
  BookOpen,
  Star,
  Clock,
  Tag,
  Share2,
  Settings,
  User,
  Building2,
  LogOut,
} from "lucide-react"
import Header from "./layout/Header"

export default function Dashboard() {
  const [activeNav, setActiveNav] = useState("dashboard")
  const { data: session, status } = useSession()

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  // Show loading while session is being fetched
  if (status === 'loading') {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }


  const stats = [
    {
      title: "Total Documents",
      value: "847",
      change: "+12% from last month",
      icon: FileText,
      color: "text-primary",
    },
    {
      title: "Active Users",
      value: "156",
      change: "+8% from last week",
      icon: Users,
      color: "text-info",
    },
    {
      title: "Views Today",
      value: "1,892",
      change: "+15% from yesterday",
      icon: Eye,
      color: "text-success",
    },
    {
      title: "Collections",
      value: "32",
      change: "4 created this week",
      icon: Folder,
      color: "text-warning",
    },
  ]

  const recentDocuments = [
    {
      title: "Employee Handbook 2024",
      author: "HR Team",
      time: "2 hours ago",
      views: 89,
    },
    {
      title: "Safety Protocols Update",
      author: "Safety Committee",
      time: "1 day ago",
      views: 156,
    },
    {
      title: "New Hire Onboarding Checklist",
      author: "Jennifer Martinez",
      time: "2 days ago",
      views: 234,
    },
    {
      title: "Company Culture Guidelines",
      author: "Leadership Team",
      time: "3 days ago",
      views: 178,
    },
  ]

  const popularDocuments = [
    {
      rank: 1,
      title: "Getting Started Guide",
      views: 567,
      change: "+23%",
    },
    {
      rank: 2,
      title: "Benefits Overview",
      views: 445,
      change: "+18%",
    },
    {
      rank: 3,
      title: "Time Off Policy",
      views: 389,
      change: "+15%",
    },
    {
      rank: 4,
      title: "Remote Work Guidelines",
      views: 298,
      change: "+12%",
    },
  ]

  return (
    <div className="d-flex min-vh-100" style={{ backgroundColor: "#f8f9fa" }}>
      {/* Sidebar */}
      <div className="bg-white border-end" style={{ width: "280px", minHeight: "100vh" }}>
        <div className="p-3 border-bottom">
          <div className="d-flex align-items-center">
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
        </div>

        <Header activeNav={activeNav} setActiveNav={setActiveNav} />
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
              <div className="text-muted small">{session?.user?.email || 'user@mertzcrew.com'}</div>
              <div className="text-muted small">{session?.user?.role || 'employee'}</div>
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
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1">
        {/* Top Navigation */}
        <div className="bg-white border-bottom p-3">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <h4 className="mb-0 me-3">Dashboard</h4>
              <span className="badge bg-light text-dark">Demo Mode</span>
            </div>
            <div className="d-flex align-items-center gap-3">
              <div className="position-relative" style={{ width: "300px" }}>
                <Search
                  size={16}
                  className="position-absolute text-muted"
                  style={{ left: "12px", top: "50%", transform: "translateY(-50%)" }}
                />
                <input
                  type="text"
                  className="form-control ps-5"
                  placeholder="Search documentation..."
                  style={{ backgroundColor: "#f8f9fa", border: "1px solid #dee2e6" }}
                />
              </div>
              <button className="btn btn-outline-secondary">
                <Bell size={16} />
              </button>
              <button className="btn text-white" style={{ backgroundColor: "#ca1f27" }}>
                <Plus size={16} className="me-1" />
                New Document
              </button>
            </div>
          </div>
        </div>

        <div className="p-4">
          {/* Hero Section */}
          <div className="rounded p-4 mb-4 text-white position-relative" style={{ backgroundColor: "#ca1f27" }}>
            <div className="row align-items-center">
              <div className="col-md-8">
                <h2 className="mb-3">Welcome to Mertz Control Room</h2>
                <p className="mb-4 opacity-90">
                  Your central hub for company resources. Access policies, training materials, HR documentation, and
                  culture guidelines all in one place.
                </p>
                <div className="d-flex gap-2">
                  <button className="btn btn-light">Create First Document</button>
                  <button className="btn btn-outline-light">Take Tour</button>
                </div>
              </div>
              <div className="col-md-4 text-end">
                <BookOpen size={120} className="opacity-25" />
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="row mb-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="col-md-3 mb-3">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <p className="text-muted mb-1 small">{stat.title}</p>
                          <h3 className="mb-0">{stat.value}</h3>
                        </div>
                        <Icon size={24} className={stat.color} />
                      </div>
                      <div className="d-flex align-items-center">
                        <TrendingUp size={12} className="text-success me-1" />
                        <small className="text-success">{stat.change}</small>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Content Sections */}
          <div className="row">
            {/* Recent Documents */}
            <div className="col-md-7 mb-4">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Recent Documents</h5>
                  <button className="btn btn-link text-decoration-none p-0">View All</button>
                </div>
                <div className="card-body p-0">
                  {recentDocuments.map((doc, index) => (
                    <div key={index} className="d-flex align-items-center p-3 border-bottom">
                      <FileText size={16} className="text-muted me-3" />
                      <div className="flex-grow-1">
                        <h6 className="mb-1">{doc.title}</h6>
                        <small className="text-muted">
                          by {doc.author} • {doc.time}
                        </small>
                      </div>
                      <div className="text-end">
                        <small className="text-muted">{doc.views} views</small>
                        <button className="btn btn-link p-1 ms-2">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Popular This Week */}
            <div className="col-md-5 mb-4">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Popular This Week</h5>
                  <button className="btn btn-link text-decoration-none p-0">View All</button>
                </div>
                <div className="card-body p-0">
                  {popularDocuments.map((doc, index) => (
                    <div key={index} className="d-flex align-items-center p-3 border-bottom">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center me-3 fw-bold text-white"
                        style={{
                          width: "24px",
                          height: "24px",
                          backgroundColor: "#ca1f27",
                          fontSize: "12px",
                        }}
                      >
                        #{doc.rank}
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="mb-1">{doc.title}</h6>
                        <small className="text-muted">{doc.views} views</small>
                      </div>
                      <span className="badge bg-success">{doc.change}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0">
              <h5 className="mb-1">Quick Actions</h5>
              <small className="text-muted">Common tasks to help you get started</small>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3 mb-3">
                  <button className="btn btn-outline-primary w-100 h-100 d-flex flex-column align-items-center justify-content-center p-3">
                    <FileText size={24} className="mb-2" />
                    <span>Create Policy</span>
                  </button>
                </div>
                <div className="col-md-3 mb-3">
                  <button className="btn btn-outline-primary w-100 h-100 d-flex flex-column align-items-center justify-content-center p-3">
                    <Users size={24} className="mb-2" />
                    <span>Add Training</span>
                  </button>
                </div>
                <div className="col-md-3 mb-3">
                  <button className="btn btn-outline-primary w-100 h-100 d-flex flex-column align-items-center justify-content-center p-3">
                    <Building2 size={24} className="mb-2" />
                    <span>HR Document</span>
                  </button>
                </div>
                <div className="col-md-3 mb-3">
                  <button className="btn btn-outline-primary w-100 h-100 d-flex flex-column align-items-center justify-content-center p-3">
                    <Star size={24} className="mb-2" />
                    <span>Culture Guide</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}