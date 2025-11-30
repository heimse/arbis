// Общие типы приложения

export interface NavItem {
  title: string
  href: string
  icon?: string
  disabled?: boolean
}

export interface DashboardConfig {
  mainNav: NavItem[]
  sidebarNav: NavItem[]
}

export interface User {
  id: string
  email: string
  name?: string
}

export interface Project {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
}



