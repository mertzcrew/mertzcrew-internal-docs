"use client";
import { Home, FileText, BookOpen, Users, Building2, Star, Clock, Tag, Share2, UserPlus, BookOpenText, Search, UserPen, ClipboardList, Bell, Calendar, CheckCircle } from 'lucide-react'
import React from 'react'
import { useRouter } from 'next/navigation';

function Header({ activeNav, setActiveNav, isAdmin, assignedPoliciesCount }: { 
	activeNav: string, 
	setActiveNav: (id: string) => void, 
	isAdmin?: boolean,
	assignedPoliciesCount?: number 
}) {
	const router = useRouter();
	const sidebarItems = [
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
		<nav className="p-3">
			{sidebarItems.map((item) => {
			const Icon = item.icon
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
				<div className="d-flex align-items-center justify-content-between w-100">
					<span>{item.label}</span>
					{item.id === "myAssignedPolicies" && assignedPoliciesCount && assignedPoliciesCount > 0 && (
						<span className="badge bg-primary rounded-pill ms-auto">{assignedPoliciesCount}</span>
					)}
				</div>
				</button>
			)
			})}
		</nav>
	)
}

export default Header