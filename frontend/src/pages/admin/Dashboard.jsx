import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { formatINR, normalizeAmount } from '../../utils/currency'
import { useAuth } from '../../contexts/AuthContext'
import { getPaymentTime } from '../../utils/paymentTime'
import { 
  FiDownload, 
  FiDollarSign, 
  FiUsers, 
  FiCheckCircle, 
  FiXCircle, 
  FiClock,
  FiFileText,
  FiAlertCircle,
  FiArrowRight,
  FiShield,
  FiTrash2,
  FiEye,
  FiEyeOff
} from 'react-icons/fi'
export default function AdminDashboard() {
  const API_BASE = api.defaults.baseURL
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [testimonials, setTestimonials] = useState([])

  useEffect(() => {
    fetchStats()
    fetchTestimonials()
  }, [])

  const fetchTestimonials = async () => {
    try {
      const { data } = await api.get('/testimonials/admin/all')
      setTestimonials(data.testimonials || [])
    } catch {
      setTestimonials([])
    }
  }

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/dashboard')
      setStats(data.stats)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (amount) => {
    const num = normalizeAmount(amount || 0)
    if (num >= 10000000) return formatINR(num / 10000000) + ' Cr'
    if (num >= 100000) return formatINR(num / 100000) + ' L'
    return formatINR(num)
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'completed': { label: 'PAID', class: 'bg-green-100 text-green-700 border-green-300' },
      'pending': { label: 'PENDING', class: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
      'failed': { label: 'FAILED', class: 'bg-red-100 text-red-700 border-red-300' },
      'cancelled': { label: 'CANCELLED', class: 'bg-gray-100 text-gray-700 border-gray-300' },
      'refunded': { label: 'REFUNDED', class: 'bg-orange-100 text-orange-700 border-orange-300' }
    }
    const config = statusMap[status?.toLowerCase()] || statusMap['pending']
    return (
      <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${config.class}`}>
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-slate-600">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="mt-0">
      {/* Header */}
      <div className="mb-6 animate-admin-slide-in">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
        <p className="text-slate-600">Control center for Dar Al Hikma Trust operations</p>
      </div>

      {/* Admin Account Panel */}
      <div className="bg-gradient-to-br from-white via-slate-50/50 to-white rounded-xl shadow-md border-2 border-slate-200 p-6 mb-6 animate-admin-slide-up hover:shadow-xl hover:-translate-y-1 transition-all duration-300" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg transform transition-all duration-300 hover:scale-110 hover:rotate-3">
              <FiShield className="text-white text-xl" />
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1 font-medium">Logged in as</p>
              <p className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">{user?.name || user?.email}</p>
              <p className="text-sm text-slate-600">{user?.email}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 rounded-lg text-sm font-bold border border-primary-200 shadow-sm">
              <FiShield className="w-4 h-4" />
              Administrator
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-white via-primary-50/30 to-white rounded-xl shadow-md border-2 border-primary-100 p-6 animate-admin-slide-up hover:shadow-xl hover:-translate-y-2 hover:border-primary-200 transition-all duration-300 group" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Total Donations</p>
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <FiDollarSign className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold bg-gradient-to-r from-primary-700 to-primary-600 bg-clip-text text-transparent mb-1">{formatAmount(stats?.totalDonations)}</p>
          <p className="text-xs text-slate-600 font-medium">{stats?.totalDonationCount || 0} transactions</p>
        </div>

        <div className="bg-gradient-to-br from-white via-blue-50/30 to-white rounded-xl shadow-md border-2 border-blue-100 p-6 animate-admin-slide-up hover:shadow-xl hover:-translate-y-2 hover:border-blue-200 transition-all duration-300 group" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Total Donors</p>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <FiUsers className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent mb-1">
            {stats?.totalDonorCount || stats?.totalUniqueDonors || (stats?.registeredDonorCount || 0) + (stats?.anonymousDonorCount || 0)}
          </p>
          <p className="text-xs text-slate-600 font-medium">Unique contributors</p>
        </div>

        <div className="bg-gradient-to-br from-white via-green-50/30 to-white rounded-xl shadow-md border-2 border-green-100 p-6 animate-admin-slide-up hover:shadow-xl hover:-translate-y-2 hover:border-green-200 transition-all duration-300 group" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Completed</p>
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <FiCheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent mb-1">
            {stats?.recentDonations?.filter(d => d.status === 'completed').length || 0}
          </p>
          <p className="text-xs text-slate-600 font-medium">Successful payments</p>
        </div>

        <div className="bg-gradient-to-br from-white via-red-50/30 to-white rounded-xl shadow-md border-2 border-red-100 p-6 animate-admin-slide-up hover:shadow-xl hover:-translate-y-2 hover:border-red-200 transition-all duration-300 group" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Failed</p>
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <FiXCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold bg-gradient-to-r from-red-700 to-red-600 bg-clip-text text-transparent mb-1">
            {stats?.recentDonations?.filter(d => d.status === 'failed').length || 0}
          </p>
          <p className="text-xs text-slate-600 font-medium">Requires attention</p>
        </div>
      </div>

      {/* Transaction Management */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 animate-admin-slide-up hover:shadow-md transition-all duration-300" style={{ animationDelay: '0.6s' }}>
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Transaction Management</h2>
            <p className="text-sm text-slate-600">View and verify all payment transactions</p>
          </div>
          <Link
            to="/admin/donations"
            className="flex items-center gap-2 px-4 py-2 text-primary-600 hover:text-primary-700 font-semibold hover:bg-primary-50 rounded-lg transition-colors"
          >
            View All
            <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Date & Time</th>
                <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Donor</th>
                <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Amount</th>
                <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Status</th>
                <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.recentDonations?.slice(0, 10).map((donation, index) => (
                <tr 
                  key={donation._id || donation.id} 
                  className="hover:bg-slate-50 transition-all duration-200 animate-admin-slide-in"
                  style={{ animationDelay: `${1.0 + index * 0.05}s` }}
                >
                  <td className="py-4 px-6">
                    <div className="text-sm">
                      {(() => {
                        const paymentTime = getPaymentTime(donation);
                        return (
                          <>
                            <div className="font-semibold text-slate-900">
                              {paymentTime.toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              {paymentTime.toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: true
                              })}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm font-semibold text-slate-900">
                      {donation.isAnonymous ? (
                        <span className="text-slate-500 italic">Anonymous</span>
                      ) : (
                        donation.donor?.name || donation.donorName || 'Anonymous'
                      )}
                    </div>
                    {!donation.isAnonymous && (donation.donor?.email || donation.donorEmail) && (
                      <div className="text-xs text-slate-500 mt-1">
                        {donation.donor?.email || donation.donorEmail}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm font-bold text-slate-900">
                      {formatINR(donation.amount || 0)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {donation.donationType || donation.donation_type || 'General'}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {getStatusBadge(donation.status)}
                  </td>
                  <td className="py-4 px-6">
                    {donation.status === 'completed' ? (
                      <a
                        href={`${API_BASE}/donations/${donation._id || donation.id}/receipt`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg transition-colors text-sm font-semibold"
                        title="Download Receipt PDF"
                      >
                        <FiFileText className="w-4 h-4" />
                        PDF
                      </a>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {(!stats?.recentDonations || stats.recentDonations.length === 0) && (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Testimonials moderation (API) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 animate-admin-slide-up hover:shadow-md transition-all duration-300" style={{ animationDelay: '0.7s' }}>
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Testimonials</h2>
            <p className="text-sm text-slate-600">
              Approve, reject, hide or remove testimonials submitted from the site.
            </p>
          </div>
        </div>
        <div className="p-6 space-y-4 max-h-80 overflow-y-auto">
          {testimonials.length === 0 ? (
            <p className="text-sm text-slate-500">No testimonials submitted yet.</p>
          ) : (
            testimonials.map((t) => (
              <div
                key={t.id}
                className="flex items-start justify-between gap-4 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase font-semibold text-slate-500 mb-1">
                    {t.status === 'approved' ? 'Approved' : t.status === 'pending' ? 'Pending' : t.status === 'rejected' ? 'Rejected' : 'Hidden'}
                  </p>
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {t.name} <span className="text-slate-500 font-normal">— {t.role}</span>
                    {t.location && <span className="text-slate-400"> • {t.location}</span>}
                  </p>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{t.message}</p>
                </div>
                <div className="flex flex-col gap-2 ml-2">
                  {t.status !== 'approved' && (
                    <button
                      type="button"
                      className="p-2 rounded-lg border border-emerald-500 text-emerald-600 hover:bg-emerald-50 flex items-center gap-1 text-xs font-semibold"
                      onClick={async () => {
                        try {
                          await api.put(`/testimonials/admin/${t.id}/status`, { status: 'approved' })
                          fetchTestimonials()
                        } catch (err) {
                          toast.error(err.response?.data?.message || 'Failed to update')
                        }
                      }}
                      title="Approve and show on site"
                    >
                      <FiEye className="w-3 h-3" />
                      <span>Approve</span>
                    </button>
                  )}
                  {t.status === 'approved' && (
                    <button
                      type="button"
                      className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 flex items-center gap-1 text-xs font-semibold"
                      onClick={async () => {
                        try {
                          await api.put(`/testimonials/admin/${t.id}/status`, { status: 'hidden' })
                          fetchTestimonials()
                        } catch (err) {
                          toast.error(err.response?.data?.message || 'Failed to update')
                        }
                      }}
                      title="Hide from public"
                    >
                      <FiEyeOff className="w-3 h-3" />
                      <span>Hide</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1 text-xs font-semibold"
                    onClick={async () => {
                      if (!window.confirm('Delete this testimonial permanently?')) return
                      try {
                        await api.delete(`/testimonials/admin/${t.id}`)
                        fetchTestimonials()
                      } catch (err) {
                        toast.error(err.response?.data?.message || 'Failed to delete')
                      }
                    }}
                    title="Delete testimonial"
                  >
                    <FiTrash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          to="/admin/donations"
          className="bg-gradient-to-br from-white via-primary-50/20 to-white rounded-xl shadow-md border-2 border-primary-100 p-6 hover:shadow-xl hover:border-primary-300 hover:-translate-y-2 transition-all duration-300 group animate-admin-slide-up"
          style={{ animationDelay: '0.7s' }}
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <FiDollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 mb-1">All Donations</h3>
              <p className="text-sm text-slate-600">View and manage all transactions</p>
            </div>
            <FiArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all duration-300" />
          </div>
        </Link>

        <Link
          to="/admin/donors"
          className="bg-gradient-to-br from-white via-blue-50/20 to-white rounded-xl shadow-md border-2 border-blue-100 p-6 hover:shadow-xl hover:border-blue-300 hover:-translate-y-2 transition-all duration-300 group animate-admin-slide-up"
          style={{ animationDelay: '0.8s' }}
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <FiUsers className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 mb-1">User Management</h3>
              <p className="text-sm text-slate-600">View and manage all donors</p>
            </div>
            <FiArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
          </div>
        </Link>

        <Link
          to="/admin/donations?status=failed"
          className="bg-gradient-to-br from-white via-red-50/20 to-white rounded-xl shadow-md border-2 border-red-100 p-6 hover:shadow-xl hover:border-red-300 hover:-translate-y-2 transition-all duration-300 group animate-admin-slide-up"
          style={{ animationDelay: '0.9s' }}
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <FiAlertCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 mb-1">Failed Transactions</h3>
              <p className="text-sm text-slate-600">
                {stats?.recentDonations?.filter(d => d.status === 'failed').length || 0} require review
              </p>
            </div>
            <FiArrowRight className="w-5 h-5 text-slate-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all duration-300" />
          </div>
        </Link>
      </div>
    </div>
  )
}

