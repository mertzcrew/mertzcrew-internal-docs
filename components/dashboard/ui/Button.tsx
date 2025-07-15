import React from 'react'
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

export interface DashboardButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode
  label: string
}

function Button({ icon, label, ...props }: DashboardButtonProps) {
  return (
    <button
      type={props.type || 'button'}
      className={
        'btn btn-outline-primary w-100 h-100 d-flex flex-column align-items-center justify-content-center p-3 ' +
        (props.className || '')
      }
      {...props}
    >
      {icon && React.cloneElement(icon as React.ReactElement, { size: 24, className: 'mb-2' })}
      <span>{label}</span>
    </button>
  )
}

export default Button