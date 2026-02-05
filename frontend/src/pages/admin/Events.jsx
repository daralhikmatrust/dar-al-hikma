import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { 
  FiPlus, FiEdit, FiTrash2, FiSearch, FiX, FiEye, FiEyeOff, 
  FiCalendar, FiMapPin, FiClock, FiLink, FiImage, FiVideo, FiCheck, FiType, FiArrowLeft 
} from 'react-icons/fi'

export default function AdminEvents() {
  const [events, setEvents] = useState([])
  const [filteredEvents, setFilteredEvents] = useState([])
  const [loading, setLoading] = useState(true)
  
  // 'showForm' toggles between the List View and the Form View
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Initial Form State
  const initialFormState = {
    title: '',
    excerpt: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    location: '',
    bannerImageUrl: '',
    bannerImageFile: null,
    images: [],
    videoUrl: '',
    urlSlug: '',
    tags: [],
    featured: false,
    visible: true
  }
  
  const [formData, setFormData] = useState(initialFormState)

  const TAG_OPTIONS = ['Free', 'Online', 'In-Person', 'Networking', 'Workshop']

  useEffect(() => {
    loadEvents()
  }, [])

  useEffect(() => {
    filterEvents()
  }, [searchQuery, events])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/events/admin/all')
      setEvents(data.events || [])
      setFilteredEvents(data.events || [])
    } catch (error) {
      console.error('Failed to load events:', error)
      toast.error('Failed to load events')
      setEvents([])
      setFilteredEvents([])
    } finally {
      setLoading(false)
    }
  }

  const filterEvents = () => {
    let filtered = [...events]
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(event =>
        event.title?.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query)
      )
    }
    setFilteredEvents(filtered)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.description.trim() || !formData.date) {
      toast.error('Title, description and date are required')
      return
    }

    try {
      const formDataToSend = new FormData()
      Object.keys(formData).forEach(key => {
        if (key === 'images' || key === 'tags') {
          formDataToSend.append(key, JSON.stringify(formData[key] || []))
        } else if (key === 'bannerImageFile') {
          if (formData.bannerImageFile) formDataToSend.append('bannerImage', formData.bannerImageFile)
        } else {
          formDataToSend.append(key, formData[key] === null ? '' : formData[key])
        }
      })

      if (editingEvent) {
        await api.put(`/events/admin/${editingEvent.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success('Event updated successfully')
      } else {
        await api.post('/events/admin', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success('Event created successfully')
      }
      await loadEvents()
      handleCloseForm()
    } catch (error) {
      console.error('Failed to save event:', error)
      toast.error(error.response?.data?.message || 'Failed to save event')
    }
  }

  const handleEdit = (event) => {
    setEditingEvent(event)
    const dateVal = event.date 
      ? (typeof event.date === 'string' ? event.date.split('T')[0] : event.date) 
      : new Date().toISOString().split('T')[0]
      
    setFormData({
      title: event.title || '',
      excerpt: event.excerpt || '',
      description: event.description || '',
      date: dateVal,
      time: event.time || '',
      location: event.location || '',
      bannerImageUrl: event.bannerImage || '',
      bannerImageFile: null,
      images: event.images || [],
      videoUrl: event.videoUrl || '',
      urlSlug: event.slug || '',
      tags: Array.isArray(event.tags) ? event.tags : [],
      featured: Boolean(event.featured),
      visible: event.visible !== false
    })
    setShowForm(true) // Switch view to form
  }

  const toggleTag = (tag) => {
    const next = formData.tags.includes(tag) 
      ? formData.tags.filter((t) => t !== tag) 
      : [...formData.tags, tag]
    setFormData({ ...formData, tags: next })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event permanently?')) return
    try {
      await api.delete(`/events/admin/${id}`)
      toast.success('Event deleted')
      await loadEvents()
    } catch (error) {
      console.error('Failed to delete event:', error)
      toast.error('Failed to delete event')
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingEvent(null)
    setFormData(initialFormState)
  }

  const toggleVisibility = async (id) => {
    try {
      const event = events.find(e => e.id === id)
      if (!event) return
      await api.put(`/events/admin/${id}/toggle-visibility`, {}, { }).catch(async () => {
          toast.error("Please use the edit form to change visibility")
      })
      const updatedEvents = events.map(e => e.id === id ? {...e, visible: !e.visible} : e)
      setEvents(updatedEvents)
      setFilteredEvents(updatedEvents)
      toast.success('Visibility updated')
    } catch (error) {
      console.error('Failed to update visibility:', error)
    }
  }

  const handleBannerFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size must be less than 10MB')
        return
      }
      setFormData({ ...formData, bannerImageFile: file })
    }
  }

  const getStatusBadge = (status, date) => {
    const eventDate = new Date(date)
    const now = new Date()
    now.setHours(0,0,0,0)
    eventDate.setHours(0,0,0,0)
    
    if (eventDate < now) return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">Past</span>
    if (eventDate.getTime() === now.getTime()) return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200">Today</span>
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-200">Upcoming</span>
  }

  // --- VIEW 1: EVENT LIST ---
  if (!showForm) {
    return (
      <div className="w-full animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Events Management</h1>
            <p className="text-sm text-slate-500 mt-1">Organize and manage your upcoming events</p>
          </div>
          <button
            onClick={() => {
              setEditingEvent(null)
              setFormData(initialFormState)
              setShowForm(true)
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-medium rounded-lg shadow-sm hover:bg-primary-700 transition-all active:scale-95"
          >
            <FiPlus className="w-5 h-5" />
            <span>Create Event</span>
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
          <div className="relative max-w-md">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by title, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-500">Loading events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-16 text-center">
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCalendar className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-slate-900 font-semibold mb-1">No events found</h3>
              <p className="text-slate-500 text-sm mb-6">Get started by creating your first event.</p>
              <button 
                onClick={() => setShowForm(true)} 
                className="text-primary-600 font-medium hover:underline"
              >
                + Create New Event
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Event Details</th>
                    <th className="px-6 py-4 font-semibold">Date & Time</th>
                    <th className="px-6 py-4 font-semibold">Location</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 max-w-xs">
                        <div className="font-medium text-slate-900 truncate" title={event.title}>{event.title || 'Untitled Event'}</div>
                        <div className="text-slate-500 text-xs mt-0.5 truncate">{event.excerpt || 'No description'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-slate-700">
                          <FiCalendar className="text-slate-400" />
                          {event.date ? new Date(event.date).toLocaleDateString('en-GB') : '--'}
                        </div>
                        {event.time && (
                          <div className="flex items-center gap-2 text-slate-500 text-xs mt-1">
                            <FiClock className="text-slate-400" />
                            {event.time}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {event.location || <span className="text-slate-400 italic">No location</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          {getStatusBadge(event.status, event.date)}
                          <span className={`text-[10px] font-semibold uppercase tracking-wide ${event.visible ? 'text-green-600' : 'text-slate-400'}`}>
                            {event.visible ? 'Published' : 'Hidden'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(event)}
                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FiEdit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(event.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
  }

  // --- VIEW 2: FORM (INLINE PAGE) ---
  // This renders instead of the list when showForm is true. No modal css.
  return (
    <div className="w-full max-w-4xl mx-auto animate-in slide-in-from-right-4 duration-300">
      
      {/* Form Header with Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={handleCloseForm}
          className="p-2 rounded-full hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 text-slate-500 transition-all"
        >
          <FiArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {editingEvent ? 'Edit Event' : 'Create New Event'}
          </h1>
          <p className="text-sm text-slate-500">Fill in the details below</p>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section: Basic Info */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Event Title *</label>
            <div className="relative">
              <input 
                type="text" 
                value={formData.title} 
                onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm" 
                placeholder="e.g. Annual Tech Conference 2026"
                required 
              />
              <FiType className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date *</label>
              <div className="relative">
                <input 
                  type="date" 
                  value={formData.date} 
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })} 
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" 
                  required 
                />
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Time</label>
              <div className="relative">
                <input 
                  type="time" 
                  value={formData.time} 
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })} 
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" 
                />
                <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={formData.location} 
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" 
                  placeholder="Venue or Online Link"
                />
                <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">URL Slug <span className="font-normal text-slate-400">(Optional)</span></label>
              <div className="relative">
                <input 
                  type="text" 
                  value={formData.urlSlug} 
                  onChange={(e) => setFormData({ ...formData, urlSlug: e.target.value })} 
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" 
                  placeholder="event-name-slug"
                />
                <FiLink className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Section: Media */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FiImage /> Event Media
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Banner Image</label>
                <input type="file" accept="image/*" onChange={handleBannerFileChange} className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white file:text-primary-700 hover:file:bg-slate-100 mb-3 border border-slate-300 rounded-lg"/>
                <input 
                  type="url" 
                  value={formData.bannerImageUrl} 
                  onChange={(e) => setFormData({ ...formData, bannerImageUrl: e.target.value })} 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" 
                  placeholder="Or Image URL..." 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Video Embed</label>
                <div className="relative">
                  <input 
                    type="url" 
                    value={formData.videoUrl} 
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })} 
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" 
                    placeholder="https://youtube.com/..." 
                  />
                  <FiVideo className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Details */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
            <textarea 
              rows={6} 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none" 
              placeholder="Full details about the event..."
              required 
            />
          </div>

          <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {TAG_OPTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all flex items-center gap-1 ${
                      formData.tags.includes(tag) 
                        ? 'border-primary-500 bg-primary-50 text-primary-700' 
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {formData.tags.includes(tag) && <FiCheck className="w-3 h-3"/>}
                    {tag}
                  </button>
                ))}
              </div>
          </div>

          {/* Section: Toggles */}
          <div className="flex flex-wrap gap-6 pt-2 pb-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={formData.visible} onChange={(e) => setFormData({ ...formData, visible: e.target.checked })} className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500" />
              <span className="text-sm font-medium text-slate-700">Publish Event</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500" />
              <span className="text-sm font-medium text-slate-700">Mark as Featured</span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCloseForm}
              className="px-6 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 text-sm shadow-sm transition-colors"
            >
              {editingEvent ? 'Update Event' : 'Create Event'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}