"use client"

import { useEffect } from "react"

export default function BootstrapProvider() {
  useEffect(() => {
    // Dynamically import Bootstrap JS
    // @ts-ignore - Bootstrap bundle doesn't have TypeScript declarations for this specific import
    import("bootstrap/dist/js/bootstrap.bundle.min.js")
  }, [])

  return null
}
