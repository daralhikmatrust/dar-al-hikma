import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from "react-helmet-async"
import api from '../services/api'
import { formatINR, normalizeAmount } from '../utils/currency'
import { 
  FiMapPin, FiCalendar, FiTarget, FiCheckCircle, 
  FiChevronLeft, FiChevronRight, FiHeart, FiShield, FiInfo, FiTag 
} from 'react-icons/fi'

export default function ProjectDetail() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [slideIndex, setSlideIndex] = useState(0)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const { data } = await api.get(`/projects/${id}`)
        setProject(data.project)
      } catch (error) {
        console.error('Failed to fetch project:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProject()
  }, [id])

  useEffect(() => {
    if (!project?.images || project.images.length <= 1) return
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % project.images.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [project?.images])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-slate-400 font-medium animate-pulse tracking-widest text-xs uppercase">Initialising Mission...</p>
      </div>
    </div>
  )

  if (!project) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
        <FiInfo className="w-10 h-10 text-slate-400" />
      </div>
      <h2 className="text-3xl font-bold text-slate-900 mb-4">Mission Not Found</h2>
      <Link to="/projects" className="bg-primary-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-200">
        Return to Missions
      </Link>
    </div>
  )

  const imageList = (project.images || []).map((img) => (typeof img === 'string' ? { url: img } : img))
  const hasImages = imageList.length > 0
  const nextSlide = () => setSlideIndex((prev) => (prev + 1) % imageList.length)
  const prevSlide = () => setSlideIndex((prev) => (prev - 1 + imageList.length) % imageList.length)

  const progressPercent = project.targetAmount > 0 
    ? Math.min((normalizeAmount(project.currentAmount) / normalizeAmount(project.targetAmount)) * 100, 100) 
    : 0

  return (
    <div className="min-h-screen bg-[#FBFDFF] pb-20">
      <Helmet>
        <title>{project.title} | Dar Al Hikma Trust</title>
      </Helmet>

      {/* --- PROFESSIONAL IMAGE VIEWPORT --- */}
      <section className="relative w-full h-[70vh] sm:h-[85vh] overflow-hidden bg-slate-950">
        {hasImages ? (
          <div className="relative h-full w-full">
            {imageList.map((img, i) => (
              <div
                key={i}
                className={`absolute inset-0 transition-all duration-[1500ms] ease-in-out transform ${
                  i === slideIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                }`}
              >
                <img
                  src={img?.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {/* FIX: Heavy Bottom-to-Top Overlay for Text Legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-black/20" />
              </div>
            ))}
            
            {/* Nav Controls */}
            {imageList.length > 1 && (
              <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-6 sm:px-12 z-30 pointer-events-none">
                <button onClick={prevSlide} className="pointer-events-auto w-12 h-12 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-white hover:bg-white hover:text-primary-600 transition-all flex items-center justify-center shadow-2xl">
                  <FiChevronLeft className="w-6 h-6" />
                </button>
                <button onClick={nextSlide} className="pointer-events-auto w-12 h-12 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-white hover:bg-white hover:text-primary-600 transition-all flex items-center justify-center shadow-2xl">
                  <FiChevronRight className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full w-full bg-slate-900 flex items-center justify-center text-white/5 text-[20vw] font-black">
            MISSION
          </div>
        )}

        {/* --- CONTENT BOX: Positioned for maximum visibility --- */}
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-20 z-20 pb-24 md:pb-32">
          <div className="max-w-7xl mx-auto">
            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-3 mb-8 animate-admin-slide-in">
              <span className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest shadow-2xl">
                <FiTag className="w-3 h-3" /> {project.faculty || 'Humanitarian'}
              </span>
              <span className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-xl text-white text-[10px] font-black uppercase tracking-widest border border-white/20">
                {project.status || 'Active Mission'}
              </span>
            </div>

            {/* FIX: Title with subtle text-shadow for legibility */}
            <h1 
              className="text-4xl md:text-7xl font-black text-white mb-8 leading-[1.05] max-w-5xl tracking-tight"
              style={{ textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}
            >
              {project.title}
            </h1>

            {/* Quick Info Bar */}
            <div className="flex flex-wrap items-center gap-10 text-slate-100 font-bold text-sm tracking-wide">
               <div className="flex items-center gap-3">
                 <FiMapPin className="text-primary-400 w-5 h-5" />
                 {project.location?.city || 'Location Pending'}
               </div>
               <div className="flex items-center gap-3">
                 <FiCalendar className="text-primary-400 w-5 h-5" />
                 {new Date(project.startDate || project.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}
               </div>
               <div className="flex items-center gap-3">
                 <FiShield className="text-emerald-400 w-5 h-5" />
                 Verified Project
               </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 opacity-40">
           <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center p-1">
              <div className="w-1 h-2 bg-white rounded-full animate-bounce" />
           </div>
        </div>
      </section>

      {/* --- BODY --- */}
      <main className="max-w-7xl mx-auto px-6 -mt-16 relative z-40">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-10">
            <div className="bg-white rounded-[3rem] p-10 md:p-16 shadow-2xl shadow-slate-200/50 border border-slate-100">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-200">
                  <FiTarget className="text-white w-6 h-6" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">The Mission Objective</h2>
              </div>
              <div className="prose prose-slate prose-xl max-w-none text-slate-600 leading-[1.8] font-medium whitespace-pre-line">
                {project.description}
              </div>
            </div>

            {/* Roadmap */}
            {project.milestones?.length > 0 && (
              <div className="bg-white rounded-[3rem] p-10 md:p-16 shadow-2xl shadow-slate-200/50 border border-slate-100">
                <h2 className="text-3xl font-black text-slate-900 mb-14 tracking-tight">Implementation Roadmap</h2>
                <div className="space-y-0 relative border-l-2 border-slate-100 ml-4">
                  {project.milestones.map((ms, idx) => (
                    <div key={idx} className="relative pl-12 pb-12 last:pb-0 group">
                      <div className="absolute -left-[1.35rem] top-0 w-10 h-10 rounded-full bg-white border-2 border-slate-100 shadow-sm flex items-center justify-center z-10 group-hover:bg-primary-600 group-hover:border-primary-600 transition-all duration-300">
                        <FiCheckCircle className="text-slate-300 w-5 h-5 group-hover:text-white" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-slate-900 mb-2">{ms.title}</h4>
                        <p className="text-slate-500 font-medium leading-relaxed">{ms.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sticky Donation Sidebar */}
          <aside className="lg:col-span-4 sticky top-28">
            <div className="bg-white rounded-[3rem] shadow-2xl shadow-primary-900/10 border border-slate-100 p-10">
              <div className="space-y-10">
                <div>
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-4xl font-black text-slate-900 tracking-tighter">
                      {formatINR(project.currentAmount || 0)}
                    </span>
                    <span className="text-primary-600 font-black text-xl">{Math.round(progressPercent)}%</span>
                  </div>
                  
                  <div className="w-full bg-slate-100 h-6 rounded-full p-1.5 shadow-inner overflow-hidden mb-4">
                    <div 
                      className="bg-gradient-to-r from-primary-500 to-primary-700 h-full rounded-full transition-all duration-1000 ease-out shadow-lg"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Raised So Far</span>
                    <span>Goal: {formatINR(project.targetAmount)}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <Link
                    to="/donate"
                    state={{ project: project._id }}
                    className="w-full flex items-center justify-center gap-3 bg-primary-600 hover:bg-primary-700 text-white py-6 rounded-2xl font-black text-xl transition-all shadow-xl shadow-primary-200 active:scale-[0.97]"
                  >
                    <FiHeart className="w-6 h-6 fill-white" />
                    Support Mission
                  </Link>
                  <p className="text-center text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                    <FiShield className="text-emerald-500 w-4 h-4" /> 100% Transparency Guaranteed
                  </p>
                </div>

                <div className="bg-slate-50 rounded-[1.5rem] p-6 space-y-4">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-400 uppercase tracking-widest">ID Reference</span>
                    <span className="text-slate-900 font-mono bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
                      #{String(project?._id || '').slice(-6).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-400 uppercase tracking-widest">Status</span>
                    <span className="flex items-center gap-1.5 text-emerald-600 font-black uppercase tracking-tighter">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Mission
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Policy */}
            <div className="mt-8 bg-slate-950 rounded-[2rem] p-8 text-white shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
                    <FiShield className="text-primary-400" />
                 </div>
                 <h4 className="font-black text-sm uppercase tracking-widest">Trust Policy</h4>
              </div>
              <p className="text-slate-400 text-xs leading-[1.7] font-medium">
                We maintain a 100% Zakat & Sadaqah policy. Every penny donated goes directly to the project field. Administrative costs are handled separately by our patrons.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}