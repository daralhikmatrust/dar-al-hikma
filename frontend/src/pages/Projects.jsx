<Helmet>
  <title>Charitable Projects | Impacting Lives - Dar Al Hikma Trust</title>
  <meta name="description" content="Explore our ongoing projects in education, health, and social welfare. See how your contributions are making a real difference." />
  <link rel="canonical" href="https://daralhikma.org.in/projects" />
</Helmet>

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { formatINR, normalizeAmount } from '../utils/currency'
import { FiSearch, FiArrowRight, FiTarget, FiFilter, FiActivity, FiLayers } from 'react-icons/fi'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [facultyOptions, setFacultyOptions] = useState([
    'Education',
    'Healthcare',
    'Livelihood Support',
    'Relief & Welfare'
  ])
  const [filters, setFilters] = useState({
    status: '',
    faculty: '',
    search: ''
  })

  useEffect(() => {
    fetchProjects()
  }, [filters])

  // Load faculties defined in admin
  useEffect(() => {
    try {
      const storedFaculties = localStorage.getItem('faculties')
      if (storedFaculties) {
        const parsed = JSON.parse(storedFaculties)
        const names = parsed.map((f) => f.name).filter(Boolean)
        if (names.length) {
          setFacultyOptions(names)
        }
      }
    } catch {
      // keep defaults
    }
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.faculty) params.append('faculty', filters.faculty)
      
      const { data } = await api.get(`/projects?${params.toString()}`)
      let filtered = data.projects
      
      if (filters.search) {
        filtered = filtered.filter(p => 
          p.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          p.description.toLowerCase().includes(filters.search.toLowerCase())
        )
      }
      
      setProjects(filtered)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* --- HERO SECTION --- */}
      <section className="bg-white pt-24 pb-10 border-b border-slate-200 relative overflow-x-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>
        </div>

        <div className="container-custom px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-primary-50 text-primary-700 text-xs font-bold tracking-widest uppercase mb-4 border border-primary-100">
            <FiLayers className="w-3 h-3" /> Our Impact
          </span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Our <span className="text-primary-600">Projects</span> & Initiatives
          </h1>
          <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Discover how we are transforming lives across education, healthcare, and welfare through our dedicated programs.
          </p>
        </div>
      </section>

      {/* --- FILTERS SECTION --- */}
      <section className="py-8 bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm/50">
        <div className="container-custom px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            
            {/* Search */}
            <div className="relative w-full md:w-96 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-4 w-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all shadow-sm"
                placeholder="Search projects..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>

            {/* Dropdowns */}
            <div className="flex w-full md:w-auto gap-3">
              <div className="relative w-full md:w-48">
                 <select
                  className="block w-full pl-3 pr-8 py-2 text-sm border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 shadow-sm cursor-pointer text-slate-600"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="">All Statuses</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="planned">Planned</option>
                </select>
              </div>

              <div className="relative w-full md:w-48">
                <select
                  className="block w-full pl-3 pr-8 py-2 text-sm border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 shadow-sm cursor-pointer text-slate-600"
                  value={filters.faculty}
                  onChange={(e) => setFilters({ ...filters, faculty: e.target.value })}
                >
                  <option value="">All Categories</option>
                  {facultyOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- PROJECTS GRID --- */}
      <section className="py-10 bg-slate-50 min-h-[50vh]">
        <div className="container-custom px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
                  <div className="aspect-[16/9] bg-slate-200 rounded-lg mb-4"></div>
                  <div className="h-5 bg-slate-200 rounded mb-2 w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded mb-4 w-1/2"></div>
                  <div className="h-2 bg-slate-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200 border-dashed">
              <div className="p-3 bg-slate-50 rounded-full mb-3">
                <FiTarget className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No projects found</h3>
              <p className="text-slate-500 text-sm mt-1">Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Link
                  key={project._id}
                  to={`/projects/${project._id}`}
                  className="group bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
                >
                  {/* Image Area */}
                  <div className="aspect-[16/9] bg-slate-100 relative overflow-hidden">
                    {(() => {
                      const firstImage = project.images?.[0]
                      const imageUrl = typeof firstImage === 'string' ? firstImage : firstImage?.url
                      if (imageUrl) {
                        return (
                          <img
                            src={imageUrl}
                            alt={project.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )
                      }
                      return (
                        <div className="w-full h-full flex items-center justify-center bg-slate-50">
                          <FiActivity className="text-slate-300 w-10 h-10" />
                        </div>
                      )
                    })()}
                    
                    {/* Status Pill */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm ${
                        project.status === 'completed' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : project.status === 'ongoing' 
                          ? 'bg-blue-50 text-blue-700 border-blue-100' 
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {project.status || 'planned'}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    {/* Faculty Tag */}
                    <div className="mb-2">
                        <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider bg-primary-50 px-2 py-0.5 rounded border border-primary-100">
                            {project.faculty || 'General'}
                        </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight group-hover:text-primary-700 transition-colors">
                      {project.title}
                    </h3>
                    
                    <p className="text-slate-500 text-sm mb-5 line-clamp-2 leading-relaxed flex-1">
                      {project.shortDescription || project.description}
                    </p>

                    {/* Progress Section */}
                    {project.targetAmount > 0 && (
                      <div className="mb-4 pt-4 border-t border-slate-50">
                        <div className="flex justify-between items-end text-xs text-slate-600 mb-1.5">
                          <span className="font-semibold text-slate-900">{project.progress || 0}% Funded</span>
                          <span className="text-slate-400">Target: {formatINR(project.targetAmount)}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-primary-600 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((normalizeAmount(project.currentAmount) / normalizeAmount(project.targetAmount)) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Footer Link */}
                    <div className={`flex items-center text-sm font-semibold text-slate-900 group-hover:text-primary-600 transition-colors ${project.targetAmount > 0 ? '' : 'pt-4 border-t border-slate-50 mt-auto'}`}>
                      Read More <FiArrowRight className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}