import { Link, useNavigate } from 'react-router-dom'
import { 
  FiArrowRight, FiHeart, FiBook, FiUsers, FiChevronLeft, FiChevronRight, 
  FiTarget, FiAward, FiTrendingUp, FiCheckCircle, FiShield, FiGlobe, 
  FiTwitter, FiFacebook, FiInstagram, FiYoutube, FiMapPin, FiPhone, FiMail, FiStar ,FiHome
} from 'react-icons/fi'
import api from '../services/api'
import { useEffect, useState } from 'react'
import { getStoredFaculties, loadFacultiesWithFallback } from '../utils/faculties'

export default function Home() {
  const [stats, setStats] = useState(null)
  const [assets, setAssets] = useState(null)
  const [slideIdx, setSlideIdx] = useState(0)
  const [approvedTestimonials, setApprovedTestimonials] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    fetchStats()
    fetchAssets()
    fetchTestimonials()
  }, [])

  const fetchTestimonials = async () => {
    try {
      const { data } = await api.get('/testimonials')
      setApprovedTestimonials(data.testimonials || [])
    } catch {
      setApprovedTestimonials([])
    }
  }

  const fetchStats = async () => {
    try {
      await api.get('/projects').catch(() => null)
      try {
        const donationsRes = await api.get('/admin/dashboard')
        if (donationsRes?.data?.stats) {
          setStats(donationsRes.data.stats)
        }
      } catch (adminError) { /* Fallback */ }
    } catch (error) {
      setStats(null)
    }
  }

  const fetchAssets = async () => {
    try {
      const { data } = await api.get('/content/assets')
      if (data?.assets) setAssets(data.assets)
    } catch { /* ignore */ }
  }

  const slides = assets?.homeSlider?.length ? assets.homeSlider : []

  useEffect(() => {
    if (!slides.length) return
    const t = setInterval(() => {
      setSlideIdx((i) => (i + 1) % slides.length)
    }, 5000)
    return () => clearInterval(t)
  }, [slides.length])

  const handleSlideClick = (slide) => {
    const linkUrl = slide?.linkUrl?.trim()
    if (linkUrl) {
      if (linkUrl.startsWith('http://') || linkUrl.startsWith('https://')) {
        window.open(linkUrl, '_blank', 'noopener,noreferrer')
      } else {
        navigate(linkUrl)
      }
    }
  }

  return (
    <div className="font-sans text-slate-900 bg-white selection:bg-primary-100">
      
      {/* --- HERO SECTION --- */}
      <section className="relative pt-2 pb-16 lg:pt-2 lg:pb-24 bg-white overflow-x-hidden">
        {/* Abstract Backgrounds */}
        <div className="absolute top-0 right-0 -z-10 w-[800px] h-[800px] bg-gradient-to-b from-primary-50 to-white rounded-full blur-3xl opacity-60 translate-x-1/3 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-gradient-to-t from-slate-50 to-white rounded-full blur-3xl opacity-60 -translate-x-1/3 translate-y-1/4"></div>

        <div className="container-custom px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1fr,1.3fr] gap-8 lg:gap-16 items-center">
            
            {/* Left Content */}
            <div className="max-w-xl animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-slate-900 text-white text-xs font-bold tracking-widest uppercase mb-6 shadow-md">
                <FiShield className="w-3.5 h-3.5 text-emerald-400" />
                Registered Non-Profit
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
                Empowering <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">Humanity.</span>
              </h1>
              
              <p className="text-lg text-slate-600 leading-relaxed mb-8 font-medium">
                Dar Al Hikma Trust bridges the gap between privilege and need. We build schools, fund medical treatments, and provide relief to those who need it most.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  to="/donate"
                  className="inline-flex justify-center items-center gap-3 px-8 py-4 rounded-full bg-slate-900 text-white font-bold text-lg shadow-xl shadow-slate-900/20 hover:bg-slate-800 hover:-translate-y-1 transition-all duration-300"
                >
                  <FiHeart className="w-5 h-5 text-red-500 fill-current" />
                  <span>Donate Now</span>
                </Link>
                <Link
                  to="/projects"
                  className="inline-flex justify-center items-center gap-3 px-8 py-4 rounded-full bg-white border border-slate-200 text-slate-700 font-bold text-lg hover:border-primary-600 hover:text-primary-600 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <span>View Impact</span>
                  <FiArrowRight className="w-5 h-5" />
                </Link>
              </div>

              <div className="flex items-center gap-6 text-sm font-bold text-slate-500">
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-emerald-500" /> Transparent
                </div>
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-emerald-500" /> Tax Deductible
                </div>
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-emerald-500" /> Verified
                </div>
              </div>
            </div>

            {/* Right Side - Slider (Restored Original Logic) */}
            <div className="relative w-full rounded-2xl lg:rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-200 border-4 border-white bg-slate-100 min-h-[280px] h-[320px] sm:h-[400px] lg:h-[550px]">
              {slides.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100 animate-pulse">
                  <div className="w-full h-full bg-slate-200 animate-pulse" />
                </div>
              ) : slides.map((s, i) => (
                <SlideImage
                  key={s.url + i}
                  url={s.url}
                  linkUrl={s.linkUrl}
                  active={i === slideIdx}
                  title={s.title}
                  onSlideClick={() => handleSlideClick(s)}
                />
              ))}

              {/* Slider Controls */}
              {slides.length > 0 && (
                <>
                  <div className="absolute bottom-6 right-6 flex gap-2 z-30">
                    <button
                      type="button"
                      className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 grid place-items-center text-white hover:bg-white hover:text-slate-900 transition-all"
                      onClick={() => setSlideIdx((i) => (i - 1 + slides.length) % slides.length)}
                    >
                      <FiChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 grid place-items-center text-white hover:bg-white hover:text-slate-900 transition-all"
                      onClick={() => setSlideIdx((i) => (i + 1) % slides.length)}
                    >
                      <FiChevronRight size={20} />
                    </button>
                  </div>
                  
                  {/* Progress Line */}
                  <div className="absolute bottom-0 left-0 h-1 bg-primary-600 transition-all duration-300 z-30" style={{ width: `${((slideIdx + 1) / slides.length) * 100}%` }}></div>
                </>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* --- STATS STRIP --- */}
      {stats && (
        <section className="bg-slate-900 text-white py-16 relative overflow-x-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
          <div className="container-custom px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-800 text-center">
              <div className="p-4 group">
                <div className="mb-2 text-primary-400 group-hover:scale-110 transition-transform duration-300 inline-block"><FiTrendingUp size={32} /></div>
                <div className="text-4xl lg:text-5xl font-extrabold mb-1 tracking-tight">{stats.totalDonations?.toLocaleString('en-IN', { notation: 'compact' }) || '0'}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Funds Raised (INR)</div>
              </div>
              <div className="p-4 group">
                <div className="mb-2 text-blue-400 group-hover:scale-110 transition-transform duration-300 inline-block"><FiUsers size={32} /></div>
                <div className="text-4xl lg:text-5xl font-extrabold mb-1 tracking-tight">{stats.donorCount || 0}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Unique Donors</div>
              </div>
              <div className="p-4 group">
                <div className="mb-2 text-emerald-400 group-hover:scale-110 transition-transform duration-300 inline-block"><FiTarget size={32} /></div>
                <div className="text-4xl lg:text-5xl font-extrabold mb-1 tracking-tight">{stats.projectStats?.reduce((sum, p) => sum + p.count, 0) || 0}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Projects Funded</div>
              </div>
              <div className="p-4 border-r-0 group">
                <div className="mb-2 text-amber-400 group-hover:scale-110 transition-transform duration-300 inline-block"><FiAward size={32} /></div>
                <div className="text-4xl lg:text-5xl font-extrabold mb-1 tracking-tight">{stats.hallOfFameCount || 0}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hall of Fame</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* --- FOUNDATION & VALUES --- */}
      <section className="py-24 bg-slate-50">
        <div className="container-custom px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-primary-600 font-bold tracking-widest uppercase text-xs mb-3 block">Who We Are</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6">Built on Unshakable Values</h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              We operate with a singular purpose: to serve humanity with integrity, compassion, and excellence.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-[2rem] shadow-lg shadow-slate-200/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-slate-100">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 mb-6">
                <FiTarget size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Our Mission</h3>
              <p className="text-slate-600 leading-relaxed">
                To empower underprivileged communities by providing access to quality education, healthcare, and sustainable livelihood opportunities.
              </p>
            </div>

            <div className="bg-white p-10 rounded-[2rem] shadow-lg shadow-slate-200/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-slate-100">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-6">
                <FiGlobe size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Our Vision</h3>
              <p className="text-slate-600 leading-relaxed">
                A world where every individual, regardless of background, has the resources and opportunity to live a dignified and fulfilling life.
              </p>
            </div>

            <div className="bg-white p-10 rounded-[2rem] shadow-lg shadow-slate-200/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-slate-100">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                <FiShield size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Our Integrity</h3>
              <p className="text-slate-600 leading-relaxed">
                We operate with 100% transparency. Every donation is tracked, and every project is vetted to ensure maximum impact for your contribution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- CATEGORIES --- */}
      <CategoriesSection />

      {/* --- FEATURED PROJECTS (Dark Premium Theme) --- */}
      <section className="py-24 bg-slate-900 text-white relative">
        <div className="container-custom px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-2xl">
              <span className="text-emerald-400 font-bold tracking-widest uppercase text-sm mb-3 block">Urgent Needs</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">Featured Projects</h2>
              <p className="text-slate-400 text-lg">
                Directly support causes that need immediate attention. Your contribution goes straight to the field.
              </p>
            </div>
            <Link to="/projects" className="group flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 transition-all backdrop-blur-sm">
              <span className="font-semibold">View All Projects</span>
              <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <FeaturedProjects />
        </div>
      </section>

      {/* --- TESTIMONIALS (Interactive) --- */}
      {approvedTestimonials.length > 0 && (
        <section className="py-24 bg-white relative border-b border-slate-200">
          <div className="container-custom px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="text-primary-600 font-bold tracking-widest uppercase text-sm mb-3 block">Community Voices</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">What People Say</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {approvedTestimonials.slice(0, 3).map((t) => (
                <div key={t.id} className="group bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-default">
                  <div className="flex items-center justify-between mb-6">
                     <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                           <FiStar key={i} className="w-4 h-4 text-amber-400 fill-current" />
                        ))}
                     </div>
                     <FiCheckCircle className="text-emerald-500 w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-slate-700 leading-relaxed mb-8 italic font-medium relative">
                    <span className="text-4xl text-primary-200 absolute -top-4 -left-2 font-serif -z-10 opacity-50">“</span>
                    {t.message}
                  </p>
                  <div className="flex items-center gap-4 pt-6 border-t border-slate-200/60">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center font-bold text-slate-600 text-lg shadow-inner ring-2 ring-white">
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">{t.name}</h4>
                      <p className="text-xs text-primary-600 font-bold uppercase tracking-wide">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      

    </div>
  )
}

/* --- SUB COMPONENTS --- */

function SlideImage({ url, linkUrl, active, title, onSlideClick }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div className={['absolute inset-0 transition-all duration-1000 ease-in-out', active ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 z-0'].join(' ')}>
      {!loaded && <div className="absolute inset-0 bg-slate-200 animate-pulse z-0" />}
      <img src={url} alt="" className={`absolute inset-0 w-full h-full object-cover bg-center transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${linkUrl?.trim() ? 'cursor-pointer' : ''}`} onLoad={() => setLoaded(true)} onError={() => setLoaded(true)} />
      {linkUrl?.trim() && <div className="absolute inset-0 z-20 cursor-pointer" onClick={onSlideClick} />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
      {title && <div className="absolute bottom-8 left-0 right-0 z-30 text-center px-4 pointer-events-none"><h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 drop-shadow-2xl">{title}</h2></div>}
    </div>
  )
}

const CATEGORY_ICONS = { Education: FiBook, Healthcare: FiHeart, 'Livelihood Support': FiHome, 'Relief & Welfare': FiUsers }
const CATEGORY_COLORS = ['from-blue-500 to-indigo-600', 'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-600', 'from-rose-500 to-pink-600']

function CategoriesSection() {
  const [categories, setCategories] = useState([])
  useEffect(() => {
    const load = async () => {
      const stored = getStoredFaculties()
      if (stored.length > 0) {
        setCategories(stored)
        return
      }
      const fromApi = await loadFacultiesWithFallback()
      setCategories(fromApi)
    }
    load()
  }, [])

  useEffect(() => {
    const onUpdate = () => setCategories(getStoredFaculties())
    window.addEventListener('faculties-updated', onUpdate)
    return () => window.removeEventListener('faculties-updated', onUpdate)
  }, [])

  if (categories.length === 0) return null

  return (
    <section className="py-24 bg-white border-y border-slate-100">
      <div className="container-custom px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Our Key Focus Areas</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">We organize our efforts into key pillars to maximize impact and ensure sustainable growth.</p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((cat, idx) => {
            const Icon = CATEGORY_ICONS[cat.name] || FiBook
            const colorClass = CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
            
            return (
              <Link
                key={cat.id}
                to={`/faculties?category=${encodeURIComponent(cat.name)}`}
                className="group p-8 rounded-[2rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white shadow-xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{cat.name}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                  {cat.description || `Supporting ${cat.name.toLowerCase()} initiatives.`}
                </p>
                <span className="mt-auto text-primary-600 font-bold text-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                  Explore <FiArrowRight />
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function FeaturedProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/projects?featured=true&limit=3')
        setProjects(data.projects || [])
      } catch (e) { console.error(e) } 
      finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-400">Loading projects...</div>
  if (projects.length === 0) return null

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {projects.map((project) => (
        <div key={project._id} className="group bg-slate-800 rounded-[2rem] overflow-hidden border border-slate-700 shadow-xl hover:shadow-2xl hover:shadow-emerald-900/20 transition-all duration-500 flex flex-col h-full transform hover:-translate-y-2">
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <img 
              src={project.images?.[0] ? (typeof project.images[0] === 'string' ? project.images[0] : project.images[0].url) : ''} 
              alt={project.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100 bg-slate-700"
            />
            <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-slate-700 shadow-lg">
              {project.faculty || 'General'}
            </div>
          </div>

          {/* Content */}
          <div className="p-8 flex flex-col flex-1">
            <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-emerald-400 transition-colors">
              {project.title}
            </h3>
            <p className="text-slate-400 text-sm line-clamp-3 mb-6 flex-1 leading-relaxed">
              {project.shortDescription || project.description}
            </p>
            
            {/* Progress Bar */}
            {project.targetAmount > 0 && (
               <div className="mb-6 bg-slate-700/50 p-4 rounded-xl border border-slate-700/50">
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                     <span>Raised: ₹{project.currentAmount || 0}</span>
                     <span>Goal: ₹{project.targetAmount}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-600 rounded-full overflow-hidden">
                     <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ width: `${Math.min(((project.currentAmount||0)/project.targetAmount)*100, 100)}%` }}></div>
                  </div>
               </div>
            )}

            <div className="flex gap-4 mt-auto pt-4 border-t border-slate-700">
              <Link to={`/projects/${project._id}`} className="flex-1 py-3.5 rounded-xl border border-slate-600 text-slate-300 font-bold text-sm text-center hover:bg-slate-700 hover:text-white transition-all">
                Details
              </Link>
              <Link to={`/donate?project=${project._id}`} className="flex-1 py-3.5 rounded-xl bg-emerald-600 text-white font-bold text-sm text-center hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/50">
                Donate
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}