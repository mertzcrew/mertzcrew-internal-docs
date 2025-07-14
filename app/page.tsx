
"use client"

import React from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import SignIn from './auth/signin/page'

function Home() {
	const { data: session, status } = useSession()
	const router = useRouter()

	useEffect(() => {
		// If user is authenticated, redirect to dashboard
		if (status === 'authenticated' && session) {
			router.push('/dashboard')
		}
	}, [session, status, router])

	// Show loading while checking authentication
	if (status === 'loading') {
		return (
			<div className="min-vh-100 d-flex align-items-center justify-content-center">
				<div className="spinner-border text-primary" role="status">
					<span className="visually-hidden">Loading...</span>
				</div>
			</div>
		)
	}

	// If not authenticated, show sign-in page
	if (status === 'unauthenticated') {
		return (
			<div>
				<SignIn />
			</div>
		)
	}

	// While redirecting, show loading
	return (
		<div className="min-vh-100 d-flex align-items-center justify-content-center">
			<div className="spinner-border text-primary" role="status">
				<span className="visually-hidden">Redirecting...</span>
			</div>
		</div>
	)
}

export default Home