import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
      permissions: string[]
      department?: string
      position?: string
      avatar?: string
      organization?: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: string
    permissions: string[]
    department?: string
    position?: string
    avatar?: string
    organization?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    permissions: string[]
    department?: string
    position?: string
    avatar?: string
    organization?: string
  }
} 