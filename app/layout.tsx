import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import BootstrapProvider from "@/components/bootstrap-provider"
import AuthSessionProvider from "@/components/session-provider"
import RootLayoutContent from "@/components/layout/RootLayoutContent"

import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Mertz Control Room - Employee Resource Center",
  description: "Central hub for Mertzcrew employee resources, policies, training, and documentation",
  icons: {
    icon: [
      {
        url: '/favicon-v2.ico',
        sizes: 'any',
      },
    ],
    shortcut: '/favicon-v2.ico',
    apple: '/favicon-v2.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon-v2.ico" />
        <link rel="shortcut icon" type="image/x-icon" href="/favicon-v2.ico" />
      </head>
      <body className={inter.className}>
        <AuthSessionProvider>
          <RootLayoutContent>
            {children}
          </RootLayoutContent>
          <BootstrapProvider />
        </AuthSessionProvider>
      </body>
    </html>
  )
}