import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiPlus, FiEdit, FiTrash2, FiShield, FiMail, FiUser, FiCalendar } from 'react-icons/fi'

export default function Admins() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    profession: ''
  })

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      const { data } = await api.get('/admin/admins')
      setAdmins(data.admins)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch admins')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/admin/admins', formData)
      toast.success('Admin created successfully!')
      setShowModal(false)
      setFormData({ name: '', email: '', password: '', profession: '' })
      fetchAdmins()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create admin')
    }
  }

  const handleDelete = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return
    
    try {
      await api.delete(`/admin/admins/${adminId}`)
      toast.success('Admin deleted successfully')
      fetchAdmins()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete admin')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-slate-600">Loading admins...</p>
      </div>
    )
  }

  return (
    <div className="mt-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Management</h1>
          <p className="text-slate-600">Manage all admin users with full site access</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <FiPlus className="w-5 h-5" /> Add New Admin
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-admin-slide-up hover:shadow-md transition-all duration-300" style={{ animationDelay: '0.1s' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Admin</th>
                <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Email</th>
                <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Role</th>
                <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Profession</th>
                <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Joined</th>
                <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admins.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    No admins found.
                  </td>
                </tr>
              ) : (
                admins.map((admin, index) => (
                  <tr 
                    key={admin.id} 
                    className="hover:bg-slate-50 transition-all duration-200 animate-admin-slide-in"
                    style={{ animationDelay: `${0.2 + index * 0.03}s` }}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                          <FiShield className="text-white text-lg" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{admin.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">{admin.email}</td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                        {admin.role || 'Admin'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">
                      {admin.profession || '-'}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">
                      {new Date(admin.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="py-4 px-6">
                      {admins.length > 1 && (
                        <button
                          onClick={() => handleDelete(admin.id)}
                          className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors text-sm font-semibold flex items-center gap-2"
                          title="Delete Admin"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Admin Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-hidden flex items-center justify-center p-4 lg:p-6">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex-shrink-0 flex items-center justify-between border-b border-slate-200 p-4">
              <h2 className="text-2xl font-bold text-slate-900">Create New Admin</h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setFormData({ name: '', email: '', password: '', profession: '' })
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
              <p className="text-slate-600 p-4 pt-4 pb-0 text-sm">Admins have full access to manage all site content.</p>
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter admin name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="admin@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                    minLength={6}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Profession
                  </label>
                  <select
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 cursor-pointer appearance-none"
                    value={formData.profession}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                  >
                    <option value="">Select Profession</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Manager">Manager</option>
                    <option value="Coordinator">Coordinator</option>
                    <option value="Engineer">Engineer</option>
                    <option value="Doctor">Doctor</option>
                    <option value="Teacher">Teacher</option>
                    <option value="Businessman">Businessman</option>
                    <option value="Consultant">Consultant</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setFormData({ name: '', email: '', password: '', profession: '' })
                    }}
                    className="px-4 py-2.5 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Create Admin
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

