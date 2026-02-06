import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  FiMenu,
  FiX,
  FiChevronDown,
  FiLogOut,
  FiUser,
  FiHome,
  FiImage,
  FiFolder,
  FiBookOpen,
  FiBarChart2,
  FiPhone,
  FiAward,
  FiHeart
} from 'react-icons/fi'
import logo from '../assets/Picsart_26-01-27_19-42-26-791.png'
import { getStoredFaculties, loadFacultiesWithFallback } from '../utils/faculties'

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)
  const [openMobileSection, setOpenMobileSection] = useState(null)

  const profileRef = useRef(null)
  const mobileMenuRef = useRef(null)
  const dropdownTimeoutRef = useRef(null)

  const [navCategories, setNavCategories] = useState(() => getStoredFaculties())

  useEffect(() => {
    const load = async () => {
      const stored = getStoredFaculties()
      if (stored.length > 0) {
        setNavCategories(stored)
        return
      }
      const fromApi = await loadFacultiesWithFallback()
      setNavCategories(fromApi)
    }
    load()
  }, [])

  useEffect(() => {
    const onUpdate = () => setNavCategories(getStoredFaculties())
    window.addEventListener('faculties-updated', onUpdate)
    return () => window.removeEventListener('faculties-updated', onUpdate)
  }, [])

  const NAV_ITEMS = [
    {
      id: 'home',
      type: 'link',
      label: 'Home',
      to: '/',
      icon: FiHome
    },
    {
      id: 'about',
      type: 'dropdown',
      label: 'About Us',
      icon: FiBookOpen,
      items: [
        { id: 'who-we-are', label: 'Who We Are', to: '/about/who-we-are' },
        { id: 'why-dar-al-hikma', label: 'Why Dar Al Hikma', to: '/about/why-dar-al-hikma' },
        { id: 'our-council', label: 'Our Council', to: '/about/our-council' },
        { id: 'advisory-board', label: 'Advisory Board', to: '/about/advisory-board' },
        { id: 'legal-financial', label: 'Legal & Financial Team', to: '/about/legal-financial-team' },
        { id: 'audit', label: 'Audit', to: '/about/audit' }
      ]
    },
    {
      id: 'categories',
      type: 'dropdown',
      label: 'Category',
      icon: FiBookOpen,
      items: [
        { id: 'all', label: 'All', to: '/faculties', slug: '' },
        ...navCategories.map((cat) => {
          const slug = cat.slug || cat.id || String(cat.name).toLowerCase().replace(/\s+/g, '-')
          return { id: `nav-cat-${cat.id}`, label: cat.name, slug, to: `/faculties?category=${encodeURIComponent(cat.name)}` }
        }),
        { id: 'completed', label: 'Successfully Completed', to: '/faculties?category=completed', slug: 'completed' }
      ]
    },
    {
      id: 'explore',
      type: 'dropdown',
      label: 'Explore',
      icon: FiBookOpen,
      items: [
        { id: 'projects', label: 'Projects', to: '/projects', icon: FiFolder },
        { id: 'blogs', label: 'Blogs', to: '/blogs', icon: FiBookOpen },
        { id: 'gallery', label: 'Gallery', to: '/gallery', icon: FiImage },
        { id: 'hall-of-fame', label: 'Hall of Fame', to: '/hall-of-fame', icon: FiAward },
        { id: 'zakat-calculator', label: 'Zakat Calculator', to: '/zakat-calculator', icon: FiBarChart2 },
        { id: 'todays-nisab', label: "Today’s Nisab", to: '/zakat/nisab', icon: FiBarChart2 },
        { id: 'contact', label: 'Contact Us', to: '/contact', icon: FiPhone }
      ]
    },
    {
      id: 'events',
      type: 'link',
      label: 'Events',
      to: '/events',
      icon: FiImage
    }
  ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onDown = (e) => {
      const t = e.target
      if (profileRef.current && !profileRef.current.contains(t)) setProfileOpen(false)
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(t) && !e.target.closest('[data-mobile-toggle]')) {
        setMobileOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const go = (to) => {
    setProfileOpen(false)
    setMobileOpen(false)
    navigate(to)
  }

  const handleLogout = () => {
    logout()
    go('/')
  }

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const avatarLetter = (user?.name || user?.email || 'U').trim().charAt(0).toUpperCase()

  const openDropdownNow = (id) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current)
      dropdownTimeoutRef.current = null
    }
    setOpenDropdown(id)
  }

  const scheduleCloseDropdown = () => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current)
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null)
    }, 150)
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 overflow-visible ${
        scrolled
          ? 'bg-white shadow-md border-b border-slate-200'
          : 'bg-white/95 backdrop-blur-sm border-b border-slate-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="h-16 md:h-20 lg:h-28 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center min-w-0 group h-full overflow-visible -ml-4 md:-ml-8 lg:-ml-12"
            aria-label="Dar Al Hikma Trust - Home"
          >
            <img
              src={logo}
              alt="Dar Al Hikma Trust"
              className="h-12 md:h-16 lg:h-24 w-auto object-contain select-none scale-110 lg:scale-125"
              style={{
                imageRendering: 'auto',
                WebkitImageRendering: 'auto',
                transform: 'translate3d(0, 0, 0)',
                willChange: 'transform'
              }}
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-2 flex-1 justify-center">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              if (item.type === 'link') {
                const active = isActive(item.to)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => go(item.to)}
                    className={[
                      'relative px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 whitespace-nowrap',
                      'text-[15px] lg:text-base font-semibold tracking-wide uppercase',
                      active ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-slate-800 hover:bg-slate-50 hover:text-primary-700 hover:-translate-y-0.5 hover:shadow-md'
                    ].join(' ')}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    <span>{item.label}</span>
                    {active && <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-10 h-0.5 bg-primary-600 rounded-full" />}
                  </button>
                )
              }

              const isOpen = openDropdown === item.id
              const anyChildActive = item.items?.some((it) => isActive(it.to.replace(/#.+$/, '')))

              return (
                <div
                  key={item.id}
                  className="relative"
                  onMouseEnter={() => openDropdownNow(item.id)}
                  onMouseLeave={scheduleCloseDropdown}
                >
                  <button
                    type="button"
                    onClick={() => {
                      // REMOVED go('/faculties') from here to prevent accidental navigation
                      if (item.type === 'dropdown' && item.items?.length) {
                        setOpenDropdown(openDropdown === item.id ? null : item.id)
                      }
                    }}
                    className={[
                      'relative px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-all duration-200 whitespace-nowrap',
                      'text-[15px] lg:text-base font-semibold tracking-wide uppercase',
                      anyChildActive || isOpen ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-slate-800 hover:bg-slate-50 hover:text-primary-700 hover:-translate-y-0.5 hover:shadow-md'
                    ].join(' ')}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    <span>{item.label}</span>
                    <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-60 max-h-[70vh] overflow-y-auto bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-[60] custom-scrollbar">
                      {item.items?.map((sub, i) => (
                        <div
                          key={`${item.id}-${sub.id || i}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setOpenDropdown(null)
                            go(sub.to)
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-primary-50 hover:text-primary-700 hover:pl-5 text-left transition-all duration-150 cursor-pointer"
                        >
                          {sub.icon && <sub.icon className="w-4 h-4" />}
                          <span>{sub.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/donate" className="hidden lg:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
              <FiHeart className="w-4 h-4" />
              <span>Donate</span>
            </Link>

            <div ref={profileRef} className="relative">
              <button type="button" className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors" onClick={() => setProfileOpen(!profileOpen)}>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white font-semibold flex items-center justify-center text-sm shadow-sm">
                  {isAuthenticated ? avatarLetter : <FiUser className="w-5 h-5" />}
                </div>
                <FiChevronDown className={`hidden lg:block w-4 h-4 text-slate-500 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                  <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <p className="text-sm font-semibold text-slate-900 truncate">{isAuthenticated ? user?.name || user?.email : 'Guest'}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{isAuthenticated ? (user?.role === 'admin' ? 'Administrator' : 'Donor') : 'Not signed in'}</p>
                  </div>
                  <div className="p-2">
                    {isAuthenticated ? (
                      <>
                        <button type="button" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-slate-50 text-slate-700 text-sm font-medium" onClick={() => go(user?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard')}>
                          <FiUser className="w-4 h-4" /> Dashboard
                        </button>
                        <button type="button" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-red-50 text-red-600 text-sm font-medium" onClick={handleLogout}>
                          <FiLogOut className="w-4 h-4" /> Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-slate-50 text-slate-700 text-sm font-medium" onClick={() => go('/login')}>
                          <FiUser className="w-4 h-4" /> Login
                        </button>
                        <button type="button" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-slate-50 text-slate-700 text-sm font-medium" onClick={() => go('/register')}>
                          <FiUser className="w-4 h-4" /> Register
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button type="button" data-mobile-toggle className="lg:hidden w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div ref={mobileMenuRef} className="lg:hidden absolute top-full left-0 right-0 z-[60] bg-transparent flex justify-center max-h-[calc(100vh-5rem)] overflow-y-auto">
            <div className="py-2 w-full flex justify-center px-2">
              <div className="w-full max-w-sm mt-1 rounded-3xl shadow-2xl border border-slate-200 bg-white overflow-visible min-w-0">
                <nav className="space-y-1 px-4 pt-3 pb-2 max-h-[calc(100vh-12rem)] overflow-y-auto">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon
                    if (item.type === 'link') {
                      const active = isActive(item.to)
                      return (
                        <Link key={item.id} to={item.to} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold min-h-[44px] ${active ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600' : 'text-slate-700 hover:bg-slate-50 active:bg-slate-100'}`} onClick={() => setMobileOpen(false)}>
                          {Icon && <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-primary-600' : 'text-slate-500'}`} />}
                          {item.label}
                        </Link>
                      )
                    }
                    const isSectionOpen = openMobileSection === item.id
                    return (
                      <div key={item.id} className="border border-slate-100 rounded-xl overflow-visible">
                        <button type="button" className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 text-slate-800 text-sm font-semibold min-h-[44px] active:bg-slate-100" onClick={() => setOpenMobileSection(isSectionOpen ? null : item.id)}>
                          <span className="flex items-center gap-2">
                            {Icon && <Icon className="w-5 h-5 shrink-0 text-slate-500" />}
                            {item.label}
                          </span>
                          <FiChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isSectionOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isSectionOpen && (
                          <div className="bg-white max-h-[50vh] overflow-y-auto overscroll-contain custom-scrollbar">
                            {item.items?.map((sub, i) => (
                              <Link key={`${item.id}-${i}`} to={sub.to} className="flex items-center gap-2 px-6 py-3 text-sm text-slate-700 hover:bg-slate-50 active:bg-slate-100 min-h-[44px]" onClick={() => { setMobileOpen(false); setOpenMobileSection(null); }}>
                                {sub.icon && <sub.icon className="w-4 h-4 shrink-0 text-slate-400" />}
                                {sub.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </nav>
                <div className="px-4 pt-3 pb-4 border-t border-slate-200 bg-slate-50/60 sticky bottom-0">
                  <Link to="/donate" className="flex items-center justify-center gap-2 w-full px-4 py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl shadow-md transition-all duration-200 active:scale-[0.98]" onClick={() => setMobileOpen(false)}>
                    <FiHeart className="w-5 h-5" /> Donate Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}