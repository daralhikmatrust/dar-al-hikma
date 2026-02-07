import { Helmet } from "react-helmet-async"
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { FiSearch, FiMapPin, FiFilter, FiHeart } from 'react-icons/fi'
import api from '../services/api'
import { getStoredFaculties, loadFacultiesWithFallback } from '../utils/faculties'
import { formatINR, normalizeAmount } from '../utils/currency'

export default function Faculties() {
  const navigate = useNavigate()
  const location = useLocation()

  const params = new URLSearchParams(location.search)
  const initialCategory = params.get('category') || 'All'

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [categoryItems, setCategoryItems] = useState([
    { id: 'all', label: 'All', faculty: '' },
    { id: 'completed', label: 'Successfully Completed', faculty: '', status: 'completed' }
  ])

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true)
        const { data } = await api.get('/projects')
        setProjects(data.projects || [])
      } catch (e) {
        console.error('Failed to load projects for categories page:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])

  useEffect(() => {
    const build = (cats) => [
      { id: 'all', label: 'All', faculty: '' },
      ...cats.map((cat) => ({
        id: cat.id,
        label: cat.name,
        faculty: cat.name
      })),
      { id: 'completed', label: 'Successfully Completed', faculty: '', status: 'completed' }
    ]

    const load = async () => {
      const stored = getStoredFaculties()
      if (stored.length > 0) {
        setCategoryItems(build(stored))
        return
      }
      const fromApi = await loadFacultiesWithFallback()
      setCategoryItems(build(fromApi))
    }
    load()
  }, [])

  useEffect(() => {
    const onUpdate = () => {
      const stored = getStoredFaculties()
      if (stored.length > 0) {
        setCategoryItems([
          { id: 'all', label: 'All', faculty: '' },
          ...stored.map((cat) => ({ id: cat.id, label: cat.name, faculty: cat.name })),
          { id: 'completed', label: 'Successfully Completed', faculty: '', status: 'completed' }
        ])
      }
    }
    window.addEventListener('faculties-updated', onUpdate)
    return () => window.removeEventListener('faculties-updated', onUpdate)
  }, [])

  // Sync selected category from URL (supports label or slug - same page filtering)
  useEffect(() => {
    const urlCat = new URLSearchParams(location.search).get('category')
    if (!urlCat) {
      setSelectedCategory('All')
      return
    }
    const byLabel = categoryItems.find((c) => c.label === urlCat)
    const bySlug = categoryItems.find(
      (c) =>
        c.id === urlCat ||
        (c.faculty && String(c.faculty).toLowerCase().replace(/\s+/g, '-') === urlCat.toLowerCase())
    )
    const resolved = byLabel || bySlug
    if (resolved) setSelectedCategory(resolved.label)
    else if (urlCat === 'completed') setSelectedCategory('Successfully Completed')
    else setSelectedCategory(urlCat)
  }, [location.search, categoryItems])

  // Keep URL in sync when category changes (from local UI, e.g. category filter buttons)
  // Do NOT remove category param when categoryItems may still be loading (e.g. landing with ?category=Nikah)
  useEffect(() => {
    const item = categoryItems.find((c) => c.label === selectedCategory)
    const categoryParam = item?.label && item.label !== 'All' ? item.label : null
    const next = new URLSearchParams(location.search)
    const currentCat = next.get('category')
    if (categoryParam && currentCat !== categoryParam) {
      next.set('category', categoryParam)
      navigate({ pathname: location.pathname, search: next.toString() }, { replace: true })
    } else if (!categoryParam && currentCat && selectedCategory === 'All') {
      // Only remove param when user explicitly chose "All", not when categoryItems hasn't loaded yet
      next.delete('category')
      navigate({ pathname: location.pathname, search: next.toString() }, { replace: true })
    }
  }, [selectedCategory, categoryItems])

  const cities = useMemo(() => {
    const unique = new Set()
    projects.forEach((p) => {
      if (p.location?.city) unique.add(p.location.city)
    })
    return Array.from(unique).sort()
  }, [projects])

  const filteredProjects = useMemo(() => {
    let list = [...projects]

    const categoryConfig = categoryItems.find((c) => c.label === selectedCategory)
    if (categoryConfig) {
      if (categoryConfig.faculty) {
        list = list.filter((p) => (p.faculty || '').toLowerCase() === categoryConfig.faculty.toLowerCase())
      }
      if (categoryConfig.status) {
        list = list.filter((p) => p.status === categoryConfig.status)
      }
    } else if (selectedCategory && selectedCategory !== 'All' && selectedCategory !== 'Successfully Completed') {
      list = list.filter((p) => (p.faculty || '').toLowerCase() === selectedCategory.toLowerCase())
    }

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.shortDescription?.toLowerCase().includes(q)
      )
    }

    if (typeFilter) {
      list = list.filter((p) => (p.status || '').toLowerCase() === typeFilter.toLowerCase())
    }

    if (cityFilter) {
      list = list.filter((p) => (p.location?.city || '').toLowerCase() === cityFilter.toLowerCase())
    }

    return list
  }, [projects, selectedCategory, search, typeFilter, cityFilter])

  return (
    <div className="bg-slate-50 min-h-screen">
      <Helmet>
        <title>Our Departments &amp; Faculties | Dar Al Hikma Trust</title>
        <meta name="description" content="Discover the various departments and specialized faculties driving our educational and welfare initiatives." />
        <link rel="canonical" href="https://daralhikma.org.in/faculties" />
      </Helmet>
      {/* Top search & filters */}
      <section className="bg-white/95 border-b border-slate-200/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search for the causes of your choice and location"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 text-sm shadow-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <input
                type="text"
                className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/70 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                placeholder="Select Category"
                value={selectedCategory === 'All' ? '' : selectedCategory}
                readOnly
              />
              <select
                className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 bg-white"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">-Select Type-</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="planned">Planned</option>
              </select>
              <select
                className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 bg-white"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              >
                <option value="">{cities.length ? '-Select City-' : 'City'}</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          {/* Left sidebar: categories - horizontal scroll on mobile, vertical on desktop */}
          <aside className="lg:w-60 w-full bg-slate-900/95 text-white rounded-2xl overflow-hidden shadow-lg flex-shrink-0 border border-slate-800">
            <div className="px-5 py-4 border-b border-white/10 text-xs font-semibold tracking-[0.18em] uppercase text-slate-200">
              Categories
            </div>
            <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto lg:max-h-[520px] py-2 lg:py-0 custom-scrollbar">
              {categoryItems.map((cat) => {
                const active = selectedCategory === cat.label
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`lg:w-full shrink-0 lg:shrink text-left px-5 py-3 lg:py-2.5 text-sm transition-colors relative min-h-[44px] touch-manipulation whitespace-nowrap lg:whitespace-normal ${
                      active
                        ? 'bg-slate-800 text-primary-100 font-semibold'
                        : 'hover:bg-white/5 active:bg-white/10 text-slate-100/85'
                    }`}
                    onClick={() => setSelectedCategory(cat.label)}
                  >
                    {active && (
                      <span className="absolute inset-y-1 left-0 w-1 rounded-r-full bg-primary-400" />
                    )}
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </aside>

          {/* Right side: project cards */}
          <div className="flex-1">
            {loading ? (
              <div className="grid md:grid-cols-2 gap-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 animate-pulse">
                    <div className="h-40 bg-slate-200 rounded-md mb-4" />
                    <div className="h-4 bg-slate-200 rounded mb-2" />
                    <div className="h-3 bg-slate-200 rounded w-2/3 mb-4" />
                    <div className="h-2 bg-slate-200 rounded mb-2" />
                    <div className="h-8 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center shadow-sm">
                <p className="text-lg font-semibold text-slate-800 mb-2">No projects found</p>
                <p className="text-sm text-slate-600">
                  Try changing the selected category or filters to see more projects.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-sm text-slate-600 font-semibold">
                  Showing {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}{' '}
                  {selectedCategory !== 'All' && (
                    <>
                      under <span className="text-slate-900">{selectedCategory}</span>
                    </>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  {filteredProjects.map((project) => {
                    const raised = normalizeAmount(project.currentAmount)
                    const goal = normalizeAmount(project.targetAmount)
                    const pct = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0
                    const projectId = project._id || project.id

                    return (
                      <div
                        key={project._id}
                        className="bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-200/80 hover:border-primary-200 overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1"
                      >
                        <Link
                          to={`/projects/${projectId}`}
                          className="block flex-1 flex flex-col"
                        >
                        <div className="relative h-40 bg-slate-200">
                          {(() => {
                            const firstImage = project.images?.[0]
                            const imageUrl =
                              typeof firstImage === 'string' ? firstImage : firstImage?.url
                            if (imageUrl) {
                              return (
                                <img
                                  src={imageUrl}
                                  alt={project.title}
                                  className="w-full h-full object-cover"
                                />
                              )
                            }
                            return (
                              <div className="w-full h-full flex items-center justify-center text-slate-500 text-3xl font-bold">
                                {project.faculty?.[0] || 'P'}
                              </div>
                            )
                          })()}
                        </div>

                        <div className="p-4 flex-1 flex flex-col">
                          <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold text-primary-700 bg-primary-50 border border-primary-100 mb-2">
                            {project.faculty || 'General'}
                          </div>
                          <h3 className="font-semibold text-slate-900 text-sm mb-1 line-clamp-2">
                            {project.title}
                          </h3>
                          <p className="text-xs text-slate-600 mb-3 line-clamp-2">
                            {project.shortDescription || project.description}
                          </p>

                          <div className="flex items-center text-[11px] text-slate-500 gap-3 mb-3">
                            {project.location?.city && (
                              <span className="inline-flex items-center gap-1">
                                <FiMapPin className="w-3 h-3" />
                                {project.location.city}
                              </span>
                            )}
                            {project.status && (
                              <span className="inline-flex items-center gap-1">
                                <FiFilter className="w-3 h-3" />
                                {project.status}
                              </span>
                            )}
                          </div>

                          {goal > 0 && (
                            <>
                              <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden mb-2">
                                <div
                                  className="h-2 bg-primary-500 rounded-full"
                                  style={{ width: `${pct.toFixed(1)}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-[11px] text-slate-600 mb-3">
                                <span>
                                  {formatINR(raised)} <span className="opacity-70">Raised</span>
                                </span>
                                <span>
                                  {formatINR(goal)} <span className="opacity-70">Goal</span>
                                </span>
                              </div>
                            </>
                          )}

                          <span className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-primary-600 border-2 border-primary-600 rounded-full hover:bg-primary-50 transition-all">
                            Explore Project
                          </span>
                        </div>
                        </Link>
                        <div className="p-4 pt-0 -mt-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              navigate('/donate', { state: { project: project._id } })
                            }}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold bg-primary-600 text-white rounded-xl hover:bg-primary-700 focus:ring-2 focus:ring-primary-300 focus:outline-none shadow-sm hover:shadow-md transition-all"
                          >
                            <FiHeart className="w-3 h-3" />
                            Donate Now
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
