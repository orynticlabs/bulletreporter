'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AdminSidebar } from '@/components/AdminSidebar'
import { Button } from '@/components/ui/button'
import { ArrowLeft, LogOut, Menu } from 'lucide-react'

export default function AdminLayout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const checkAuth = () => {
    const authStatus = localStorage.getItem('adminAuth')
    const token = localStorage.getItem('adminAuthToken')
    return authStatus === 'true' && !!token
  }

  useEffect(() => {
    const isAuth = checkAuth()
    setIsAuthenticated(isAuth)
    setIsLoading(false)

    const handleChange = () => setIsAuthenticated(checkAuth())
    window.addEventListener('adminAuthChange', handleChange)
    return () => window.removeEventListener('adminAuthChange', handleChange)
  }, [])

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/admin/login') {
      router.push('/admin/login')
    }
  }, [isLoading, isAuthenticated, pathname, router])

  const handleLogout = () => {
    localStorage.removeItem('adminAuth')
    localStorage.removeItem('adminAuthToken')
    localStorage.removeItem('userInfo')
    window.dispatchEvent(new CustomEvent('adminAuthChange'))
    router.push('/admin/login')
  }

  if (pathname === '/admin/login') return <>{children}</>

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  )

  if (!isAuthenticated) return null

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Admin Header — mobile responsive */}
          <header className="h-14 md:h-16 border-b bg-white flex items-center justify-between px-3 md:px-6 sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-2 md:gap-4">
              {/* Sidebar trigger — hamburger on mobile */}
              <SidebarTrigger className="flex-shrink-0" />
              <h1 className="text-sm md:text-lg font-semibold text-gray-800 truncate">
                <span className="hidden sm:inline">न्यूज़ एडमिन पैनल</span>
                <span className="sm:hidden">Admin</span>
              </h1>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <Button variant="outline" size="sm"
                className="hidden sm:flex items-center gap-1 text-xs md:text-sm"
                onClick={() => router.push('/')}>
                <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden md:inline">मुख्य साइट पर जाएं</span>
                <span className="md:hidden">Site</span>
              </Button>

              <div className="flex items-center gap-1 md:gap-2">
                <div className="w-7 h-7 md:w-8 md:h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-xs md:text-sm font-bold flex-shrink-0">
                  A
                </div>
                <span className="text-xs md:text-sm font-medium hidden sm:block">Admin</span>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="p-1 md:p-2">
                  <LogOut className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          </header>

          {/* Page content — scrollable */}
          <main className="flex-1 overflow-auto">
            <div className="p-3 md:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
