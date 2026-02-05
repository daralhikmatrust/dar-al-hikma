import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { FiLayout, FiFolder, FiDollarSign, FiUsers, FiImage, FiLogOut, FiMenu, FiX, FiShield, FiBook, FiAward, FiEdit, FiLayers, FiCalendar, FiMessageCircle } from 'react-icons/fi'
import { useState } from 'react'

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // Grouped menu items for better organization
  const menuSections = [
    {
      title: 'Overview',
      items: [
        { path: '/admin/dashboard', icon: FiLayout, label: 'Dashboard' }
      ]
    },
    {
      title: 'Content Management',
      items: [
        { path: '/admin/projects', icon: FiFolder, label: 'Projects' },
        { path: '/admin/faculties', icon: FiBook, label: 'Categories' },
        { path: '/admin/blogs', icon: FiBook, label: 'Blogs' },
        { path: '/admin/events', icon: FiCalendar, label: 'Events' },
        { path: '/admin/testimonials', icon: FiMessageCircle, label: 'Testimonials' },
        { path: '/admin/media', icon: FiImage, label: 'Media & Photos' },
        { path: '/admin/assets', icon: FiLayers, label: 'Site Assets' },
        { path: '/admin/content', icon: FiEdit, label: 'Content Editor' },
        { path: '/admin/about-us', icon: FiBook, label: 'About Us' },
        { path: '/admin/hall-of-fame', icon: FiAward, label: 'Hall of Fame' }
      ]
    },
    {
      title: 'Operations',
      items: [
        { path: '/admin/donations', icon: FiDollarSign, label: 'Donations' },
        { path: '/admin/donors', icon: FiUsers, label: 'Donors' }
      ]
    },
    {
      title: 'Administration',
      items: [
        { path: '/admin/admins', icon: FiShield, label: 'Admins' }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 shadow-xl sticky top-0 z-50 border-b-2 border-primary-400/50 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg transform transition-all duration-300 hover:scale-110 hover:rotate-3 ring-2 ring-white/30">
              <FiShield className="text-white w-6 h-6 drop-shadow-lg" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white drop-shadow-md">Admin Panel</h1>
              <p className="text-xs text-white/90 font-medium">{user?.name || user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white hover:text-white hover:bg-white/20 transition-all duration-200 p-2.5 rounded-xl active:scale-95 backdrop-blur-sm border border-white/20"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Left Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-40 flex-shrink-0
          w-72 max-w-[18rem] bg-white border-r border-slate-200 shadow-sm
          transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-transform duration-300 ease-in-out
          flex flex-col
        `}>
          {/* Header */}
          <div className="p-6 border-b border-slate-200 bg-white">
            <Link
              to="/"
              className="flex items-center gap-3 mb-4 animate-admin-fade-in group"
              aria-label="Dar Al Hikma Trust - Home"
            >
              <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <FiShield className="text-white w-7 h-7" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-slate-900 truncate">
                  Admin Panel
                </h2>
                <p className="text-xs font-medium text-slate-600">Dar Al Hikma Trust</p>
              </div>
            </Link>
            <div className="pt-4 border-t border-slate-200/60 animate-admin-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Logged in as</p>
                  <p className="text-sm font-bold text-slate-900 truncate mb-0.5">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-slate-600 truncate mt-0.5">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="
                    flex items-center gap-2 px-3 py-2 rounded-xl
                    text-slate-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-50/50 hover:text-red-700
                    transition-all duration-300 group
                    hover:shadow-lg hover:scale-[1.05] active:scale-95
                    border-2 border-slate-200 hover:border-red-300
                    flex-shrink-0 bg-white/50 backdrop-blur-sm
                  "
                  title="Logout"
                >
                  <FiLogOut className="w-4 h-4 text-slate-500 group-hover:text-red-600 transition-all duration-300 group-hover:rotate-12" />
                  <span className="text-xs font-semibold hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            {menuSections.map((section, sectionIndex) => (
              <div 
                key={sectionIndex} 
                className="space-y-2 animate-admin-fade-in"
                style={{ animationDelay: `${0.2 + sectionIndex * 0.1}s` }}
              >
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider px-3 mb-3 flex items-center gap-2">
                  <span className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent"></span>
                  <span className="text-slate-500">{section.title}</span>
                  <span className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent"></span>
                </h3>
                <div className="space-y-1.5">
                  {section.items.map((item, itemIndex) => {
                    const active = isActive(item.path)
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-xl
                          transition-all duration-200
                          ${active
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 bg-white border border-slate-200/80'
                          }
                        `}
                        style={{ 
                          animationDelay: `${0.3 + sectionIndex * 0.1 + itemIndex * 0.05}s` 
                        }}
                      >
                        <item.icon 
                          className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : 'text-slate-500 group-hover:text-primary-600'}`} 
                        />
                        <span className={`text-sm font-semibold flex-1 ${active ? 'text-white' : ''}`}>
                          {item.label}
                        </span>
                        {active && (
                          <div className="w-2 h-2 rounded-full bg-white flex-shrink-0"></div>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content: scrollable, no overflow clipping */}
        <main className="flex-1 min-w-0 min-h-screen bg-slate-50 overflow-y-auto overflow-x-hidden" id="admin-main-content">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 animate-admin-fade-in w-full">
            <Outlet />
          </div>
        </main>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          ></div>
        )}
      </div>

    </div>
  )
}

