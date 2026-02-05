import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { FiEye, FiEyeOff, FiTrash2, FiSearch, FiX } from 'react-icons/fi'

export default function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    let list = [...testimonials]
    if (statusFilter) list = list.filter((t) => t.status === statusFilter)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (t) =>
          t.name?.toLowerCase().includes(q) ||
          t.message?.toLowerCase().includes(q) ||
          t.role?.toLowerCase().includes(q) ||
          t.location?.toLowerCase().includes(q)
      )
    }
    setFiltered(list)
  }, [testimonials, statusFilter, searchQuery])

  const load = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/testimonials/admin/all')
      setTestimonials(data.testimonials || [])
      setFiltered(data.testimonials || [])
    } catch (err) {
      toast.error('Failed to load testimonials')
      setTestimonials([])
      setFiltered([])
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/testimonials/admin/${id}/status`, { status })
      toast.success('Status updated')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update')
    }
  }

  const deleteOne = async (id) => {
    if (!window.confirm('Delete this testimonial permanently?')) return
    try {
      await api.delete(`/testimonials/admin/${id}`)
      toast.success('Testimonial deleted')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete')
    }
  }

  const statusBadge = (status) => {
    const map = {
      approved: 'bg-green-100 text-green-700 border-green-300',
      pending: 'bg-amber-100 text-amber-700 border-amber-300',
      rejected: 'bg-red-100 text-red-700 border-red-300',
      hidden: 'bg-slate-100 text-slate-700 border-slate-300'
    }
    return (
      <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${map[status] || map.pending}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="mt-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Testimonials</h1>
        <p className="text-slate-600">Approve, reject, hide or remove testimonials. Only approved testimonials appear on the user site.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, message, role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-slate-600">Loading testimonials...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-600">No testimonials match your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((t) => (
              <div key={t.id} className="p-4 md:p-6 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-semibold text-slate-900">{t.name}</span>
                    {t.role && <span className="text-slate-600 text-sm">— {t.role}</span>}
                    {t.location && <span className="text-slate-500 text-sm">• {t.location}</span>}
                    {statusBadge(t.status)}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">{t.message}</p>
                </div>
                <div className="flex flex-wrap gap-2 flex-shrink-0">
                  {t.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => updateStatus(t.id, 'approved')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 text-sm font-semibold"
                    >
                      <FiEye className="w-4 h-4" /> Approve
                    </button>
                  )}
                  {t.status === 'approved' && (
                    <button
                      type="button"
                      onClick={() => updateStatus(t.id, 'hidden')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-sm font-semibold"
                    >
                      <FiEyeOff className="w-4 h-4" /> Hide
                    </button>
                  )}
                  {t.status !== 'rejected' && t.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => updateStatus(t.id, 'rejected')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 text-sm font-semibold"
                    >
                      Reject
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteOne(t.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold"
                  >
                    <FiTrash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
