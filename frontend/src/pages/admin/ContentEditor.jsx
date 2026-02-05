import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiEdit, FiSave, FiX } from 'react-icons/fi'

export default function ContentEditor() {
  const [activeTab, setActiveTab] = useState('about')
  const [aboutContent, setAboutContent] = useState({
    heroTitle: '',
    heroDescription: '',
    story: '',
    mission: '',
    vision: '',
    values: []
  })
  const [contactContent, setContactContent] = useState({
    address: '',
    phone1: '',
    phone2: '',
    email1: '',
    email2: '',
    officeHours: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      setLoading(true)
      // Try to fetch from backend, fallback to defaults
      try {
        const { data } = await api.get('/admin/content')
        if (data.about) setAboutContent(data.about)
        if (data.contact) setContactContent(data.contact)
      } catch (error) {
        // Set defaults if API doesn't exist
        setAboutContent({
          heroTitle: 'About Dar Al Hikma Trust',
          heroDescription: 'A beacon of hope and knowledge, dedicated to transforming lives through education, healthcare, and welfare.',
          story: 'Dar Al Hikma Trust was established with a vision to serve humanity and empower communities through sustainable development initiatives. Rooted in Islamic values of compassion, knowledge, and service, we strive to create lasting positive change.',
          mission: 'To empower communities through accessible education, healthcare, and welfare programs.',
          vision: 'A world where every individual has access to quality education, healthcare, and opportunities for growth.',
          values: [
            { title: 'Excellence', description: 'We strive for excellence in all our programs and initiatives.' },
            { title: 'Compassion', description: 'Compassion drives every action we take and every life we touch.' },
            { title: 'Integrity', description: 'We operate with the highest standards of integrity and transparency.' },
            { title: 'Service', description: 'Service to humanity is at the heart of everything we do.' }
          ]
        })
        setContactContent({
          address: 'Hyderabad, Telangana, India',
          phone1: '+91 1234567890',
          phone2: '+91 9876543210',
          email1: 'info@daralhikma.org',
          email2: 'support@daralhikma.org',
          officeHours: 'Monday - Friday: 9:00 AM - 6:00 PM\nSaturday: 10:00 AM - 4:00 PM\nSunday: Closed'
        })
      }
    } catch (error) {
      console.error('Failed to fetch content:', error)
      toast.error('Failed to load content')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAbout = async () => {
    try {
      setSaving(true)
      await api.put('/admin/content/about', aboutContent)
      toast.success('About page updated successfully')
    } catch (error) {
      // If endpoint doesn't exist, save to localStorage as fallback
      localStorage.setItem('aboutContent', JSON.stringify(aboutContent))
      toast.success('About page saved locally')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveContact = async () => {
    try {
      setSaving(true)
      await api.put('/admin/content/contact', contactContent)
      toast.success('Contact page updated successfully')
    } catch (error) {
      // If endpoint doesn't exist, save to localStorage as fallback
      localStorage.setItem('contactContent', JSON.stringify(contactContent))
      toast.success('Contact page saved locally')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-slate-600">Loading content editor...</p>
      </div>
    )
  }

  return (
    <div className="mt-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Content Editor</h1>
        <p className="text-slate-600">Edit About and Contact page content</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 animate-admin-slide-up hover:shadow-md transition-all duration-300" style={{ animationDelay: '0.1s' }}>
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('about')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'about'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-slate-600 hover:text-primary-600'
            }`}
          >
            About Page
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'contact'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-slate-600 hover:text-primary-600'
            }`}
          >
            Contact Page
          </button>
        </div>
      </div>

      {/* About Editor */}
      {activeTab === 'about' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Hero Title</label>
              <input
                type="text"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                value={aboutContent.heroTitle}
                onChange={(e) => setAboutContent({ ...aboutContent, heroTitle: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Hero Description</label>
              <textarea
                rows="3"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                value={aboutContent.heroDescription}
                onChange={(e) => setAboutContent({ ...aboutContent, heroDescription: e.target.value })}
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Our Story</label>
              <textarea
                rows="6"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                value={aboutContent.story}
                onChange={(e) => setAboutContent({ ...aboutContent, story: e.target.value })}
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Mission</label>
              <textarea
                rows="3"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                value={aboutContent.mission}
                onChange={(e) => setAboutContent({ ...aboutContent, mission: e.target.value })}
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Vision</label>
              <textarea
                rows="3"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                value={aboutContent.vision}
                onChange={(e) => setAboutContent({ ...aboutContent, vision: e.target.value })}
              ></textarea>
            </div>
            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                onClick={handleSaveAbout}
                disabled={saving}
                className="px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiSave className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save About Page'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Editor */}
      {activeTab === 'contact' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-admin-slide-up hover:shadow-md transition-all duration-300" style={{ animationDelay: '0.2s' }}>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
              <textarea
                rows="2"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                value={contactContent.address}
                onChange={(e) => setContactContent({ ...contactContent, address: e.target.value })}
              ></textarea>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone 1</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                  value={contactContent.phone1}
                  onChange={(e) => setContactContent({ ...contactContent, phone1: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone 2</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                  value={contactContent.phone2}
                  onChange={(e) => setContactContent({ ...contactContent, phone2: e.target.value })}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email 1</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                  value={contactContent.email1}
                  onChange={(e) => setContactContent({ ...contactContent, email1: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email 2</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                  value={contactContent.email2}
                  onChange={(e) => setContactContent({ ...contactContent, email2: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Office Hours</label>
              <textarea
                rows="4"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                value={contactContent.officeHours}
                onChange={(e) => setContactContent({ ...contactContent, officeHours: e.target.value })}
                placeholder="Monday - Friday: 9:00 AM - 6:00 PM&#10;Saturday: 10:00 AM - 4:00 PM&#10;Sunday: Closed"
              ></textarea>
            </div>
            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                onClick={handleSaveContact}
                disabled={saving}
                className="px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiSave className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Contact Page'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
