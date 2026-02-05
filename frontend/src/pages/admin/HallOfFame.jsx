import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiPlus, FiEdit, FiTrash2, FiAward, FiSearch, FiX, FiUpload, FiImage } from 'react-icons/fi'

export default function AdminHallOfFame() {
  const [members, setMembers] = useState([])
  const [filteredMembers, setFilteredMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    profession: '',
    bio: '',
    amount: '',
    photo: null,
    photoUrl: ''
  })
  const [photoPreview, setPhotoPreview] = useState(null)

  useEffect(() => {
    fetchMembers()
  }, [])

  useEffect(() => {
    filterMembers()
  }, [searchQuery, members])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/admin/hall-of-fame')
      setMembers(data.members || [])
      setFilteredMembers(data.members || [])
    } catch (error) {
      console.error('Failed to fetch Hall of Fame members:', error)
      toast.error('Failed to load Hall of Fame members')
      setMembers([])
      setFilteredMembers([])
    } finally {
      setLoading(false)
    }
  }

  const filterMembers = () => {
    if (!searchQuery) {
      setFilteredMembers(members)
      return
    }
    const query = searchQuery.toLowerCase()
    const filtered = members.filter(member =>
      member.name?.toLowerCase().includes(query) ||
      member.profession?.toLowerCase().includes(query) ||
      member.bio?.toLowerCase().includes(query)
    )
    setFilteredMembers(filtered)
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Photo size must be less than 5MB')
        return
      }
      setFormData({ ...formData, photo: file })
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const submitData = new FormData()
      submitData.append('name', formData.name)
      submitData.append('profession', formData.profession)
      submitData.append('bio', formData.bio)
      if (formData.amount) {
        submitData.append('amount', formData.amount)
      }
      if (formData.photo) {
        submitData.append('photo', formData.photo)
      } else if (photoPreview && photoPreview.startsWith('data:')) {
        // Convert base64 to blob if needed
        submitData.append('photoBase64', photoPreview)
      }

      if (editingMember) {
        await api.put(`/admin/hall-of-fame/${editingMember.id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success('Hall of Fame member updated successfully')
      } else {
        await api.post('/admin/hall-of-fame', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success('Hall of Fame member added successfully')
      }
      setShowModal(false)
      setEditingMember(null)
      resetForm()
      fetchMembers()
    } catch (error) {
      console.error('Save error:', error)
      toast.error(error.response?.data?.message || 'Failed to save member')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this member from Hall of Fame?')) return
    
    try {
      await api.delete(`/admin/hall-of-fame/${id}`)
      toast.success('Member removed from Hall of Fame')
      fetchMembers()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove member')
    }
  }

  const handleClearAll = async () => {
    if (!window.confirm('⚠️ WARNING: This will delete ALL Hall of Fame members. This action cannot be undone. Are you absolutely sure?')) return
    
    try {
      await api.delete('/admin/hall-of-fame')
      toast.success('All Hall of Fame members cleared')
      fetchMembers()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to clear members')
    }
  }

  const handleEdit = (member) => {
    setEditingMember(member)
    setFormData({
      name: member.name || '',
      profession: member.profession || '',
      bio: member.bio || '',
      amount: member.amount || member.totalDonations || '',
      photo: null,
      photoUrl: member.photo || ''
    })
    setPhotoPreview(member.photo || null)
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      profession: '',
      bio: '',
      amount: '',
      photo: null,
      photoUrl: ''
    })
    setPhotoPreview(null)
  }

  return (
    <div className="mt-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 animate-admin-slide-in">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Hall of Fame Management</h1>
          <p className="text-slate-600">Manage Hall of Fame members displayed to the public. Only admin-added members are shown.</p>
        </div>
        <div className="flex gap-3">
          {members.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-4 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              title="Clear all members (use with caution)"
            >
              <FiTrash2 className="w-5 h-5" /> Clear All
            </button>
          )}
          <button
            onClick={() => {
              setShowModal(true)
              setEditingMember(null)
              resetForm()
            }}
            className="px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <FiPlus className="w-5 h-5" /> Add Member
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, profession, or bio..."
            className="w-full pl-12 pr-10 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <FiX size={18} />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-slate-600">Loading Hall of Fame members...</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500">
              {members.length === 0 
                ? 'No Hall of Fame members yet. Click "Add Member" to get started.'
                : 'No members match your search criteria.'}
            </div>
          ) : (
            filteredMembers.map((member, index) => (
              <div
                key={member._id || member.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300 animate-admin-slide-up"
                style={{ animationDelay: `${0.2 + index * 0.05}s` }}
              >
                <div className="relative mb-4">
                  {member.photo ? (
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-gold-400 shadow-xl"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gradient-to-br from-primary-500 to-gold-500 rounded-full flex items-center justify-center mx-auto shadow-xl">
                      <span className="text-white text-4xl font-bold">
                        {member.name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  <div className="absolute top-0 right-0 bg-primary-600 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                    <FiAward className="w-3 h-3" /> Top Donor
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1 text-center">{member.name}</h3>
                <p className="text-slate-600 text-center mb-2 text-sm">{member.profession || 'Supporter'}</p>
                {member.bio && (
                  <p className="text-sm text-slate-500 text-center mb-4 line-clamp-2">{member.bio}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(member)}
                    className="flex-1 px-3 py-2 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors text-sm flex items-center justify-center gap-1"
                  >
                    <FiEdit className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(member._id || member.id)}
                    className="flex-1 px-3 py-2 bg-red-50 text-red-700 border border-red-300 font-semibold rounded-lg hover:bg-red-100 transition-colors text-sm flex items-center justify-center gap-1"
                  >
                    <FiTrash2 className="w-4 h-4" /> Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add/Edit Modal - matches Add Category: fixed height, internal scroll, footer always visible */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-hidden flex items-center justify-center p-4 lg:p-6">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex-shrink-0 flex items-center justify-between border-b border-slate-200 p-6">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingMember ? 'Edit Hall of Fame Member' : 'Add Hall of Fame Member'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  setEditingMember(null)
                  resetForm()
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <FiX size={22} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Photo
                  </label>
                  <div className="flex items-center gap-4">
                    {photoPreview && (
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-24 h-24 rounded-full object-cover border-2 border-slate-300"
                      />
                    )}
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors font-semibold">
                        <FiUpload className="w-4 h-4" />
                        <span>{photoPreview ? 'Change Photo' : 'Upload Photo'}</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Max 5MB. JPG, PNG, WEBP</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Profession *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                    value={formData.profession}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                    placeholder="e.g., Businessman, Doctor, Engineer"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Bio / Description
                  </label>
                  <textarea
                    rows="4"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Brief description or achievement..."
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Amount (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="Enter amount"
                  />
                </div>
            </div>
            <div className="flex-shrink-0 flex justify-end gap-3 p-6 border-t border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  setEditingMember(null)
                  resetForm()
                }}
                className="px-4 py-2.5 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 text-sm shadow-sm"
              >
                {editingMember ? 'Update Member' : 'Add Member'}
              </button>
            </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
