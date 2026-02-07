import { Helmet } from "react-helmet-async"
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'
import { formatINR, normalizeAmount } from '../utils/currency'
import { loadFacultiesWithFallback } from '../utils/faculties'
import { FiSearch, FiArrowRight, FiTarget, FiFilter, FiActivity, FiLayers, FiCalendar, FiMapPin } from 'react-icons/fi'

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

  useEffect(() => {
    loadFacultiesWithFallback().then((faculties) => {
      const names = faculties.map((f) => f.name).filter(Boolean)
      if (names.length) setFacultyOptions(names)
    })
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
    <div className="min-h-screen bg-[#FBFDFF] font-sans text-slate-900">
      <Helmet>
        <title>Mission Directory | Dar Al Hikma Trust</title>
        <meta name="description" content="Explore our global impact projects." />
      </Helmet>

      {/* --- PREMIUM HERO SECTION --- */}
      <section className="relative bg-slate-900 pt-32 pb-24 overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/10 rounded-full blur-[100px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-600/10 rounded-full blur-[80px] -ml-36 -mb-36" />
        
        <div className="container-custom px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-primary-500/10 text-primary-400 text-[10px] font-black tracking-[0.2em] uppercase mb-6 border border-primary-500/20">
              <FiLayers className="w-3 h-3" /> Impact Directory
            </span>
            <h1 className="text-4xl md:text-7xl font-black text-white mb-6 tracking-tight leading-[1.1]">
              Our <span className="text-primary-500 text-glow">Missions</span> & Initiatives
            </h1>
            <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed max-w-2xl">
              Transparent, field-driven programs designed to create sustainable change in underserved communities.
            </p>
          </motion.div>
        </div>
      </section>

      {/* --- GLASSMOPHISM FILTERS --- */}
      <section className="sticky top-0 z-40 px-6 -mt-8">
        <div className="container-custom">
          <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/40 flex flex-col lg:flex-row gap-4 items-center">
            {/* Search Input */}
            <div className="relative flex-1 w-full group">
              <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                placeholder="Search missions by keyword..."
                className="w-full pl-14 pr-6 py-4 bg-slate-50/50 border-none rounded-2xl focus:ring-2 ring-primary-500/20 outline-none transition-all font-medium text-slate-700"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>

            {/* Select Dropdowns */}
            <div className="flex flex-wrap lg:flex-nowrap gap-4 w-full lg:w-auto">
              <select
                className="flex-1 lg:w-48 px-6 py-4 bg-slate-50/50 border-none rounded-2xl focus:ring-2 ring-primary-500/20 outline-none transition-all font-bold text-sm text-slate-600 appearance-none cursor-pointer"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Statuses</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="planned">Planned</option>
              </select>

              <select
                className="flex-1 lg:w-56 px-6 py-4 bg-slate-50/50 border-none rounded-2xl focus:ring-2 ring-primary-500/20 outline-none transition-all font-bold text-sm text-slate-600 appearance-none cursor-pointer"
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
      </section>

      {/* --- PROJECTS GRID --- */}
      <section className="py-20">
        <div className="container-custom px-6">
          <AnimatePresence mode='wait'>
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-10"
              >
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 p-6 space-y-6">
                    <div className="aspect-[4/3] bg-slate-100 rounded-[2rem] animate-pulse" />
                    <div className="h-6 bg-slate-100 rounded-full w-3/4 animate-pulse" />
                    <div className="h-4 bg-slate-100 rounded-full w-1/2 animate-pulse" />
                  </div>
                ))}
              </motion.div>
            ) : projects.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="text-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200"
              >
                <FiTarget className="w-16 h-16 text-slate-300 mx-auto mb-6" />
                <h3 className="text-2xl font-black text-slate-900">No Missions Found</h3>
                <p className="text-slate-500 font-medium">Try adjusting your filters to find what you're looking for.</p>
              </motion.div>
            ) : (
              <motion.div 
                key="grid"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-14"
              >
                {projects.map((project) => {
                  const progress = project.targetAmount > 0 
                    ? Math.round((normalizeAmount(project.currentAmount) / normalizeAmount(project.targetAmount)) * 100) 
                    : 0;

                  return (
                    <Link
                      key={project._id}
                      to={`/projects/${project._id}`}
                      className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] transition-all duration-500 flex flex-col h-full"
                    >
                      {/* Image Area with Ken Burns Effect */}
                      <div className="aspect-[4/3] rounded-[2rem] m-4 overflow-hidden relative">
                        <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-all z-10" />
                        <img
                          src={typeof project.images?.[0] === 'string' ? project.images[0] : project.images?.[0]?.url || 'https://via.placeholder.com/800'}
                          alt={project.title}
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-[1500ms]"
                        />
                        
                        {/* Dynamic Status Tag */}
                        <div className="absolute top-4 right-4 z-20">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg border border-white/20 ${
                            project.status === 'completed' 
                              ? 'bg-emerald-500/90 text-white' 
                              : project.status === 'ongoing' 
                              ? 'bg-primary-600/90 text-white' 
                              : 'bg-white/90 text-slate-900'
                          }`}>
                            {project.status || 'Planned'}
                          </span>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="p-8 pt-2 flex flex-col flex-1">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-[10px] font-black text-primary-600 uppercase tracking-[0.15em] bg-primary-50 px-3 py-1 rounded-lg">
                            {project.faculty || 'General Mission'}
                          </span>
                        </div>

                        <h3 className="text-2xl font-black text-slate-900 mb-3 leading-[1.2] group-hover:text-primary-700 transition-colors">
                          {project.title}
                        </h3>
                        
                        <p className="text-slate-500 font-medium text-sm mb-8 line-clamp-2 leading-relaxed">
                          {project.shortDescription || project.description}
                        </p>

                        {/* Progress Section */}
                        {project.targetAmount > 0 ? (
                          <div className="mt-auto space-y-4 pt-6 border-t border-slate-50">
                            <div className="flex justify-between items-end">
                              <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Goal Reached</p>
                                <p className="text-xl font-black text-slate-900">{progress}%</p>
                              </div>
                              <div className="text-right space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target</p>
                                <p className="text-sm font-bold text-slate-600">{formatINR(project.targetAmount)}</p>
                              </div>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                              <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: `${Math.min(progress, 100)}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="mt-auto pt-6 border-t border-slate-50 flex items-center gap-4 text-slate-400 font-bold text-xs">
                             <div className="flex items-center gap-1.5"><FiMapPin className="text-primary-500"/> {project.location?.city || 'India'}</div>
                             <div className="flex items-center gap-1.5"><FiCalendar className="text-primary-500"/> {new Date(project.createdAt).getFullYear()}</div>
                          </div>
                        )}

                        {/* Hover Footer */}
                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-50">
                          <span className="text-xs font-black text-slate-900 uppercase tracking-widest group-hover:text-primary-600 transition-colors">View Mission</span>
                          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                             <FiArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  )
}