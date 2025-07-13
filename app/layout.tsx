import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import BootstrapProvider from "@/components/bootstrap-provider"

import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Mertz Control Room - Employee Resource Center",
  description: "Central hub for Mertzcrew employee resources, policies, training, and documentation",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <BootstrapProvider />
      </body>
    </html>
  )
}