import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import { useAuth } from '../contexts/AuthContext'

export default function Layout() {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  const location = useLocation()

  // Wait for auth to load before redirecting
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  // When logged in as admin, only allow admin panel UI (but allow public pages)
  const isPublicPage = ['/', '/about', '/projects', '/faculties', '/gallery', '/contact', '/hall-of-fame', '/donate', '/payment/success', '/zakat-calculator', '/zakat/success', '/zakat/failure', '/blogs', '/events'].includes(location.pathname) ||
                       location.pathname.startsWith('/about/') ||
                       location.pathname.startsWith('/projects/') ||
                       location.pathname.startsWith('/faculties/') ||
                       location.pathname.startsWith('/blogs/')
  
  if (isAuthenticated && isAdmin && !isPublicPage && !location.pathname.startsWith('/admin')) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

