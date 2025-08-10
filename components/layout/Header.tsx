"use client";
import { Home, FileText, BookOpen, Users, Building2, Star, Clock, Tag, Share2, UserPlus, BookOpenText, Search } from 'lucide-react'
import React from 'react'
import { useRouter } from 'next/navigation';

function Header({ activeNav, setActiveNav, isAdmin }: { activeNav: string, setActiveNav: (id: string) => void, isAdmin?: boolean }) {
	const router = useRouter();
	let sidebarItems = [
		{ id: "dashboard", label: "Dashboard", icon: Home },
		{ id: "search", label: "Global Search", icon: Search },
		// { id: "documents", label: "All Documents", icon: FileText },
		{ id: "policies", label: "All Policies", icon: BookOpen },
		{ id: "training", label: "Training", icon: Users },
		{ id: "hr", label: "HR Resources", icon: Building2 },
		{ id: "culture", label: "Culture Guide", icon: Star },
		{ id: "process", label: "Processes", icon: BookOpenText },
		// { id: "tags", label: "Tags", icon: Tag },
		// { id: "shared", label: "Shared", icon: Share2 },
	]
	if (isAdmin) {
		sidebarItems = [
			{ id: "adduser", label: "Add User", icon: UserPlus },
			{ id: "sessiontest", label: "Session Test", icon: BookOpenText },
		]
	}
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
					if (item.id === "search") router.push("/search");
					if (item.id === "policies") router.push("/policies");
					if (item.id === "adduser") router.push("/add-user");
					if (item.id === "sessiontest") router.push("/session-test");
					if (item.id === "hr") router.push("/policies/HR");
					if (item.id === "culture") router.push("/policies/Culture");
					if (item.id === "training") router.push("/policies/Training");
					if (item.id === "process") router.push("/policies/Process");
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