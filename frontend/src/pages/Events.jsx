import { Helmet } from "react-helmet-async";
<Helmet>
  <title>Upcoming Events & Campaigns | Dar Al Hikma Trust</title>
  <meta name="description" content="Join our upcoming charity events, webinars, and community outreach programs. Be a part of the change." />
  <link rel="canonical" href="https://daralhikma.org.in/events" />
</Helmet>

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { FiCalendar, FiClock, FiMapPin, FiArrowRight } from 'react-icons/fi'

function computeStatus(date, time) {
  if (!date) return 'upcoming'
  const now = new Date()
  const dateStr = String(date).split('T')[0]
  let eventStart = new Date(dateStr)
  if (time) {
    const t = String(time).trim().slice(0, 8)
    const parts = t.split(':').map(Number)
    eventStart.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, 0)
  }
  const eventEndOfDay = new Date(dateStr)
  eventEndOfDay.setHours(23, 59, 59, 999)
  if (eventEndOfDay < now) return 'past'
  if (eventStart <= now && now <= eventEndOfDay) return 'ongoing'
  return 'upcoming'
}

export default function Events() {
  const [events, setEvents] = useState([])
  const [assets, setAssets] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [eventsRes, assetsRes] = await Promise.all([
          api.get('/events'),
          api.get('/content/assets').catch(() => ({ data: {} }))
        ])
        setEvents(eventsRes.data.events || [])
        setAssets(assetsRes.data?.assets || {})
      } catch {
        setEvents([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const withStatus = events.map((e) => ({ ...e, status: computeStatus(e.date, e.time) }))
  const upcoming = withStatus.filter((e) => e.status === 'upcoming' || e.status === 'ongoing')
  const past = withStatus.filter((e) => e.status === 'past')
  const featured = upcoming.filter((e) => e.featured).slice(0, 2)
  const upcomingRest = upcoming.filter((e) => !e.featured)
  const eventsPage = assets?.eventsPage || {}
  const heroSubtitle = eventsPage.heroSubtitle || 'Join our workshops, webinars, and community events designed for students and partners pursuing excellence.'

  const getStatusBadge = (status) => {
    if (status === 'ongoing') return { label: 'LIVE', class: 'bg-amber-400 text-slate-900' }
    if (status === 'past') return { label: 'PAST EVENT', class: 'bg-red-100 text-red-800' }
    return { label: 'UPCOMING', class: 'bg-amber-400 text-slate-900' }
  }

  const eventUrl = (e) => `/events/${e.slug || e.id}`

  const EventCard = ({ event, variant = 'default', isPast }) => {
    const badge = getStatusBadge(event.status)
    const tags = Array.isArray(event.tags) ? event.tags : []
    const displayTags = tags.length ? tags : (event.location?.toLowerCase().includes('online') ? ['Online'] : ['Free'])
    return (
      <Link
        to={eventUrl(event)}
        className={`block group rounded-2xl overflow-hidden border bg-white shadow-sm transition-all duration-300 ${
          isPast ? 'opacity-75 hover:opacity-90 border-slate-200 grayscale-[0.3]' : 'hover:shadow-xl hover:-translate-y-1 border-slate-200'
        } ${variant === 'featured' ? 'md:col-span-1' : ''}`}
      >
        <div className="aspect-video bg-slate-200 relative overflow-hidden group">
          {event.bannerImage ? (
            <img
              src={event.bannerImage}
              alt={event.title}
              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isPast ? 'grayscale' : ''}`}
              onError={(e) => { e.target.style.display = 'none' }}
            />
          ) : (
            <div className={`w-full h-full ${isPast ? 'bg-slate-400' : 'bg-gradient-to-br from-primary-400 to-primary-600'}`} />
          )}
          <span className={`absolute top-4 right-4 px-3 py-1 rounded-lg text-xs font-bold ${badge.class}`}>{badge.label}</span>
        </div>
        <div className="p-6 flex flex-col flex-1">
          <div className="flex flex-wrap gap-2 mb-3">
            {displayTags.slice(0, 3).map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-medium">
                {tag}
              </span>
            ))}
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2">{event.title}</h3>
          <p className="text-slate-600 text-sm mb-4 line-clamp-2 flex-1">{event.excerpt || event.description}</p>
          <div className="space-y-2 text-sm text-slate-600">
            {event.date && (
              <div className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-primary-600 flex-shrink-0" />
                <span>{new Date(event.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              </div>
            )}
            {event.time && (
              <div className="flex items-center gap-2">
                <FiClock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>{event.time}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2">
                <FiMapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
            )}
          </div>
          <div className="mt-4">
            {isPast ? (
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-200 text-slate-600 text-sm font-semibold cursor-default">
                Event Completed
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-700 text-white text-sm font-semibold group-hover:bg-primary-800 transition-colors">
                View Details
                <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      
      {/* --- HERO SECTION --- */}
      {/* Changes: Reduced bottom padding (pb-8) to decrease gap */}
      <section className="bg-white pt-24 pb-8 border-b border-slate-200">
        <div className="container-custom px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto">
          <span className="inline-block py-1 px-3 rounded-full bg-primary-50 text-primary-700 text-xs font-bold tracking-widest uppercase mb-4 border border-primary-100">
            Community & Learning
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Events & Admission Sessions
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            {heroSubtitle}
          </p>
        </div>
      </section>

      {/* Featured Events */}
      {/* Changes: Reduced top padding (pt-8) to bring content closer to hero */}
      <section className="pt-8 pb-12 bg-white">
        <div className="container-custom px-4 sm:px-6 lg:px-8">
          {featured.length > 0 && (
             <div className="mb-8 flex items-center gap-2">
                <div className="h-8 w-1 bg-amber-400 rounded-full"></div>
                <h2 className="text-2xl font-bold text-slate-900">Featured Highlights</h2>
             </div>
          )}
          
          {loading ? (
            <div className="grid md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-slate-200 animate-pulse bg-white">
                  <div className="aspect-video bg-slate-200" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-1/4" />
                    <div className="h-6 bg-slate-200 rounded w-3/4" />
                    <div className="h-4 bg-slate-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-12">
              {featured.map((event) => (
                <EventCard key={event.id} event={event} variant="featured" isPast={false} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* Upcoming Events */}
      {/* Removed border-t to make it flow better if directly following hero */}
      <section className="pb-16 bg-slate-50">
        <div className="container-custom px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 pt-8 border-t border-slate-200">
             <h2 className="text-3xl font-bold text-slate-900">Upcoming Schedule</h2>
             <div className="h-1 w-16 bg-primary-600 mx-auto mt-3 rounded-full"></div>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-slate-200 animate-pulse bg-white">
                  <div className="aspect-video bg-slate-200" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-5 bg-slate-200 rounded w-4/5" />
                    <div className="h-4 bg-slate-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : upcomingRest.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingRest.map((event) => (
                <EventCard key={event.id} event={event} isPast={false} />
              ))}
            </div>
          ) : !loading && upcoming.length === 0 && past.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm">
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                 <FiCalendar size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No events announced yet</h3>
              <p className="text-slate-600">Check back soon for upcoming programs and activities.</p>
            </div>
          ) : !loading && upcomingRest.length === 0 && past.length > 0 ? (
            <p className="text-center text-slate-500 italic">No upcoming events scheduled. You can view our past events below.</p>
          ) : null}
        </div>
      </section>

      {/* Past Events */}
      {past.length > 0 && (
        <section className="py-12 bg-white border-t border-slate-200">
          <div className="container-custom px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-slate-400 mb-8 text-center uppercase tracking-wide">Past Events Archive</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80 hover:opacity-100 transition-opacity duration-300">
              {past.map((event) => (
                <EventCard key={event.id} event={event} isPast />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}