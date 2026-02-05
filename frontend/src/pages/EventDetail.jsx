import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion' // Required for smooth slider
import api from '../services/api'
import { 
  FiCalendar, FiClock, FiMapPin, FiVideo, 
  FiArrowLeft, FiShare2, FiCheckCircle, FiExternalLink,
  FiChevronLeft, FiChevronRight 
} from 'react-icons/fi'

export default function EventDetail() {
  const { slug } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true)
        const { data } = await api.get(`/events/${slug}`)
        setEvent(data.event)
      } catch (err) {
        setError('Event not found')
      } finally {
        setLoading(false)
      }
    }
    fetchEvent()
  }, [slug])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
    </div>
  )

  if (error || !event) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <h2 className="text-2xl font-bold mb-4">Event not found</h2>
      <Link to="/events" className="text-primary-600 hover:underline">← Back to all events</Link>
    </div>
  )

  const isPast = event.status === 'past'
  
  // Combine Banner and Gallery Images for the slider
  const sliderImages = [event.bannerImage, ...(event.images || [])].filter(Boolean)

  const nextSlide = () => setCurrentSlide((prev) => (prev === sliderImages.length - 1 ? 0 : prev + 1))
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? sliderImages.length - 1 : prev - 1))

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* 1. INTERACTIVE IMAGE SLIDER HERO */}
      <section className="relative h-[65vh] min-h-[500px] w-full overflow-hidden bg-slate-900 group">
        <AnimatePresence mode="wait">
          <motion.img 
            key={currentSlide}
            src={sliderImages[currentSlide]} 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="absolute inset-0 w-full h-full object-cover" 
          />
        </AnimatePresence>
        
        {/* Navigation Arrows (Visible on hover) */}
        {sliderImages.length > 1 && (
          <>
            <button 
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary-600"
            >
              <FiChevronLeft size={24} />
            </button>
            <button 
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary-600"
            >
              <FiChevronRight size={24} />
            </button>
          </>
        )}

        {/* Slider Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent z-10" />
        
        {/* Slider Indicators (Dots) */}
        <div className="absolute bottom-32 left-0 right-0 z-30 flex justify-center gap-2">
          {sliderImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentSlide ? 'w-8 bg-primary-500' : 'w-2 bg-white/50 hover:bg-white'
              }`}
            />
          ))}
        </div>

        <div className="absolute inset-0 flex flex-col justify-end z-20">
          <div className="container-custom px-4 sm:px-6 lg:px-8 pb-12">
            <Link to="/events" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors group">
              <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Events
            </Link>
            
            <div className="flex flex-wrap gap-3 mb-4">
              {event.tags?.map(tag => (
                <span key={tag} className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider border border-white/30">
                  {tag}
                </span>
              ))}
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                isPast ? 'bg-red-500 text-white' : 'bg-amber-400 text-slate-900'
              }`}>
                {event.status}
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 max-w-4xl leading-tight drop-shadow-lg">
              {event.title}
            </h1>
          </div>
        </div>
      </section>

      {/* 2. MAIN CONTENT GRID */}
      <div className="container-custom px-4 sm:px-6 lg:px-8 -mt-16 relative z-40">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* LEFT: CONTENT & MEDIA */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Info Bar */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
              <div className="flex items-center gap-3 border-r border-slate-50 last:border-0">
                <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
                  <FiCalendar size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Date</p>
                  <p className="text-sm font-bold text-slate-800">{new Date(event.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 border-r border-slate-50 last:border-0">
                <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
                  <FiClock size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Time</p>
                  <p className="text-sm font-bold text-slate-800">{event.time || 'TBA'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 col-span-2 md:col-span-1">
                <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
                  <FiMapPin size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Location</p>
                  <p className="text-sm font-bold text-slate-800 line-clamp-1">{event.location}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">About the Event</h2>
              <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
                {event.description}
              </div>
            </div>

            {/* Video Player Section */}
            {event.videoUrl && (
              <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-6 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-white">
                    <FiVideo className="text-primary-400" />
                    <span className="font-bold">Event Presentation / Recording</span>
                  </div>
                  <FiShare2 className="text-slate-400 cursor-pointer hover:text-white" />
                </div>
                <div className="aspect-video">
                  <iframe
                    className="w-full h-full"
                    src={event.videoUrl.replace("watch?v=", "embed/")}
                    title="Event Video"
                    frameBorder="0"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: STICKY SIDEBAR */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-primary-100">
                {!isPast ? (
                  <>
                    <div className="mb-6">
                      <p className="text-xs font-bold text-primary-600 uppercase mb-1">Status</p>
                      <h3 className="text-2xl font-extrabold text-slate-900">Registration Open</h3>
                    </div>
                    <div className="space-y-3">
                      <Link 
                        to="/contact" 
                        className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-primary-600 text-white font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-200"
                      >
                        Register Now
                      </Link>
                      <button className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border-2 border-slate-100 text-slate-700 font-bold hover:bg-slate-50 transition-all">
                        Add to Calendar
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <FiCheckCircle className="mx-auto text-slate-400 mb-3" size={40} />
                    <h3 className="text-xl font-bold text-slate-800">Event Concluded</h3>
                    <p className="text-sm text-slate-500 mt-2">This event took place on {new Date(event.date).toLocaleDateString()}</p>
                  </div>
                )}
                
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-4">Support This Program</p>
                  <Link to="/donate" className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 group hover:bg-primary-50 transition-all">
                    <span className="text-sm font-bold text-slate-700 group-hover:text-primary-700">Donate to our cause</span>
                    <FiExternalLink className="text-slate-400 group-hover:text-primary-400" />
                  </Link>
                </div>
              </div>

              <div className="bg-slate-900 rounded-3xl p-6 text-white overflow-hidden relative">
                <div className="relative z-10">
                  <h4 className="font-bold mb-2">Invite Others</h4>
                  <p className="text-xs text-white/60 mb-4">Share this event with your community.</p>
                  <button className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"><FiShare2 size={18}/></button>
                </div>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary-500/20 rounded-full blur-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}