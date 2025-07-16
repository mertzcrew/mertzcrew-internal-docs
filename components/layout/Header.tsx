"use client";
import { Home, FileText, BookOpen, Users, Building2, Star, Clock, Tag, Share2 } from 'lucide-react'
import React from 'react'
import { useRouter } from 'next/navigation';

function Header({ activeNav, setActiveNav }: { activeNav: string, setActiveNav: (id: string) => void }) {
	const router = useRouter();
	const sidebarItems = [
		{ id: "dashboard", label: "Dashboard", icon: Home },
		{ id: "documents", label: "All Documents", icon: FileText },
		{ id: "policies", label: "Policies", icon: BookOpen },
		{ id: "training", label: "Training", icon: Users },
		{ id: "hr", label: "HR Resources", icon: Building2 },
		{ id: "culture", label: "Culture Guide", icon: Star },
		{ id: "recent", label: "Recent", icon: Clock },
		{ id: "tags", label: "Tags", icon: Tag },
		{ id: "shared", label: "Shared", icon: Share2 },
	]
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
					if (item.id === "dashboard") router.push("/dashboard");
				}}
				style={{
					backgroundColor: activeNav === item.id ? "#f8f9fa" : "transparent",
					border: "none",
					padding: "8px 12px",
				}}
				>
				<Icon size={18} className="me-2" />
				{item.label}
				</button>
			)
			})}
		</nav>
	)
}

export default Header