"use client"

import { useState, useEffect } from "react"
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
    Pin,
} from "lucide-react"
import Header from "../layout/Header"
import Button from './ui/Button';
import RecentDocumentItem from './ui/RecentDocumentItem';
import PopularDocumentItem from './ui/PopularDocumentItem';
import StatCard from './ui/StatCard';
import GlobalSearch from '../search/GlobalSearch';
import { useRouter } from 'next/navigation';
import NotificationBell from '../notifications/NotificationBell';

interface Policy {
    _id: string;
    title: string;
    content: string;
    description: string;
    category: string;
    status: string;
    created_by: {
        _id: string;
        first_name: string;
        last_name: string;
        email: string;
    };
    createdAt: string;
    updatedAt: string;
    views?: number;
}

export default function Dashboard() {
  const [activeNav, setActiveNav] = useState("dashboard")
  const [recentDocuments, setRecentDocuments] = useState<Policy[]>([])
  const [pinnedDocuments, setPinnedDocuments] = useState<Policy[]>([])
  const [totalPinnedCount, setTotalPinnedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [pinnedLoading, setPinnedLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pinnedError, setPinnedError] = useState<string | null>(null)
  const { data: session, status } = useSession()
  const router = useRouter();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  // Fetch recent published documents
  useEffect(() => {
    const fetchRecentDocuments = async () => {
      try {
        setError(null);
        const response = await fetch(`/api/policies?dashboard=true&_t=${Date.now()}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setRecentDocuments(data.data || []);
          } else {
            setError(data.message || 'Failed to fetch recent documents');
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          
          // Handle authentication errors specifically
          if (response.status === 401) {
            setError('Authentication failed. Please refresh the page or log in again.');
            // Optionally redirect to login
            // router.push('/auth/signin');
          } else {
            setError(errorData.message || `HTTP ${response.status}: Failed to fetch recent documents`);
          }
        }
      } catch (error) {
        console.error('Dashboard - Error fetching recent documents:', error);
        setError('Network error: Failed to fetch recent documents');
      } finally {
        setLoading(false);
      }
    };

    const fetchPinnedDocuments = async () => {
      try {
        setPinnedError(null);
        const response = await fetch('/api/policies/pinned?limit=5', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setPinnedDocuments(data.data || []);
            // Store the total count to determine if "View All" should be shown
            setTotalPinnedCount(data.totalCount || 0);
          } else {
            setPinnedError(data.message || 'Failed to fetch pinned documents');
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 401) {
            setPinnedError('Authentication failed for pinned documents.');
          } else {
            setPinnedError(errorData.message || `HTTP ${response.status}: Failed to fetch pinned documents`);
          }
        }
      } catch (error) {
        console.error('Dashboard - Error fetching pinned documents:', error);
        setPinnedError('Network error: Failed to fetch pinned documents');
      } finally {
        setPinnedLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchRecentDocuments();
      fetchPinnedDocuments();
    }
  }, [status]);

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


  return (
    <div className="flex-grow-1">
      {/* Top Navigation */}

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
            </div>
            <div className="col-md-4 text-end">
              <BookOpen size={120} className="opacity-25" />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {/* <div className="row mb-4">
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
        </div> */}

        {/* Content Sections */}
        <div className="row">
			 {/* Pinned Documents */}
			 <div className="col-md-6 mb-4">
				<div className="card border-0 shadow-sm">
					<div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
					<h5 className="mb-0">
						<Pin size={20} className="me-2 text-warning" />
						My Pinned Policies
					</h5>
					{totalPinnedCount > 5 && (
						<button 
						className="btn btn-link text-decoration-none p-0"
						onClick={() => router.push('/policies/pinned')}
						>
						View All
						</button>
					)}
					</div>
					<div className="card-body p-0">
					{pinnedLoading ? (
						<div className="text-center py-4">
						<div className="spinner-border spinner-border-sm me-2" role="status">
							<span className="visually-hidden">Loading...</span>
						</div>
						Loading pinned policies...
						</div>
					) : pinnedError ? (
						<div className="text-center py-4 text-danger">
						<small>{pinnedError}</small>
						</div>
					) : pinnedDocuments.length === 0 ? (
						<div className="text-center py-4 text-muted">
						<small>No pinned policies yet. Pin policies you want to access quickly!</small>
						</div>
					) : (
						pinnedDocuments.map((doc, index) => (
						<RecentDocumentItem
							key={doc._id}
							id={doc._id}
							title={doc.title}
							author={`${doc.created_by?.first_name} ${doc.created_by?.last_name}`}
							time={new Date(doc.createdAt).toLocaleDateString()}
							views={doc.views || 0}
						/>
						))
					)}
					</div>
				</div>
			</div>
			{/* Recent Documents */}
			<div className="col-md-6 mb-4">
				<div className="card border-0 shadow-sm">
				<div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
					<h5 className="mb-0">Recent Policies</h5>
					<button 
					className="btn btn-link text-decoration-none p-0"
					onClick={() => router.push('/policies')}
					>
					View All
					</button>
				</div>
				<div className="card-body p-0">
					{loading ? (
					<div className="text-center py-4">
						<div className="spinner-border spinner-border-sm me-2" role="status">
						<span className="visually-hidden">Loading...</span>
						</div>
						Loading polocies...
					</div>
					) : error ? (
					<div className="text-center py-4 text-danger">
						<small>{error}</small>
						{error.includes('Authentication failed') && (
						<div className="mt-2">
							<button 
							className="btn btn-sm btn-outline-primary"
							onClick={() => window.location.reload()}
							>
							Refresh Page
							</button>
						</div>
						)}
					</div>
					) : recentDocuments.length === 0 ? (
					<div className="text-center py-4 text-muted">
						<small>No recent polocies found. Create your first policy to get started!</small>
						<div className="mt-3">
						<button 
							className="btn btn-sm btn-primary"
							onClick={() => router.push('/new_policy')}
						>
							<Plus size={16} className="me-1" />
							Create First Policy
						</button>
						</div>
					</div>
					) : (
					recentDocuments.map((doc, index) => (
						<RecentDocumentItem
						key={doc._id}
						id={doc._id}
						title={doc.title}
						author={`${doc.created_by?.first_name} ${doc.created_by?.last_name}`}
						time={new Date(doc.createdAt).toLocaleDateString()}
						views={doc.views || 0}
						/>
					))
					)}
				</div>
				</div>
			</div>

         
        </div>


        {/* Quick Actions */}
        {/* <div className="card border-0 shadow-sm">
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
        </div> */}
      </div>
    </div>
  )
}