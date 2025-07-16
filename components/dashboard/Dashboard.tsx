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
import Header from "../layout/Header"
import Button from './ui/Button';
import RecentDocumentItem from './ui/RecentDocumentItem';
import PopularDocumentItem from './ui/PopularDocumentItem';
import StatCard from './ui/StatCard';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [activeNav, setActiveNav] = useState("dashboard")
  const { data: session, status } = useSession()
  const router = useRouter();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
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
            <button className="btn text-white" style={{ backgroundColor: "#ca1f27" }} onClick={() => router.push('/new_policy')}>
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
          {stats.map((stat, index) => (
            <div key={index} className="col-md-3 mb-3">
              <StatCard
                title={stat.title}
                value={stat.value}
                change={stat.change}
                icon={stat.icon}
                color={stat.color}
              />
            </div>
          ))}
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
                  <RecentDocumentItem
                    key={index}
                    title={doc.title}
                    author={doc.author}
                    time={doc.time}
                    views={doc.views}
                  />
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
                  <PopularDocumentItem
                    key={index}
                    rank={doc.rank}
                    title={doc.title}
                    views={doc.views}
                    change={doc.change}
                  />
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
                <Button icon={<FileText />} label="Create Policy" />
              </div>
              <div className="col-md-3 mb-3">
                <Button icon={<Users />} label="Add Training" />
              </div>
              <div className="col-md-3 mb-3">
                <Button icon={<Building2 />} label="HR Document" />
              </div>
              <div className="col-md-3 mb-3">
                <Button icon={<Star />} label="Culture Guide" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}