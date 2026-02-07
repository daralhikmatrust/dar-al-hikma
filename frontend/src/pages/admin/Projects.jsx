import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { formatINR, normalizeAmount } from '../../utils/currency'
import toast from 'react-hot-toast'
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiFilter, FiX, FiUpload, FiExternalLink, FiTarget } from 'react-icons/fi'
import { INDIAN_STATES, COUNTRIES, getCitiesForState } from '../../utils/states-countries'

export default function AdminProjects() {
  const [projects, setProjects] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterFaculty, setFilterFaculty] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    faculty: '',
    subcategory: '',
    status: 'ongoing',
    targetAmount: '',
    isFeatured: false,
    location: {
      city: '',
      state: '',
      district: '',
      country: 'India'
    },
    photo: null
  })
  const [availableCities, setAvailableCities] = useState([])
  const [photoPreviews, setPhotoPreviews] = useState([])

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    filterProjects()
  }, [searchQuery, filterStatus, filterFaculty, projects])

  useEffect(() => {
    if (formData.location.state) {
      setAvailableCities(getCitiesForState(formData.location.state))
    } else {
      setAvailableCities([])
    }
  }, [formData.location.state])

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects')
      setProjects(data.projects || [])
      setFilteredProjects(data.projects || [])
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const filterProjects = () => {
    let filtered = [...projects]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(project =>
        project.title?.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query) ||
        project.faculty?.toLowerCase().includes(query) ||
        project.location?.city?.toLowerCase().includes(query) ||
        project.location?.state?.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (filterStatus) {
      filtered = filtered.filter(project => project.status === filterStatus)
    }

    // Faculty filter
    if (filterFaculty) {
      filtered = filtered.filter(project => project.faculty === filterFaculty)
    }

    setFilteredProjects(filtered)
  }

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files || [])
    const valid = files.filter((f) => f.size <= 5 * 1024 * 1024)
    if (valid.length < files.length) toast.error('Some files exceed 5MB limit')
    if (valid.length === 0) return
    setFormData((prev) => ({
      ...prev,
      photo: valid[0],
      extraPhotos: [...(prev.extraPhotos || []), ...valid.slice(1)]
    }))
    const loadAll = valid.map((file) =>
      new Promise((resolve) => {
        const r = new FileReader()
        r.onloadend = () => resolve({ file, dataUrl: r.result })
        r.readAsDataURL(file)
      })
    )
    Promise.all(loadAll).then((results) => {
      setPhotoPreviews((prev) => [...prev, ...results])
    })
    e.target.value = ''
  }

  const removePhotoPreview = (idx) => {
    const existingCount = (editingProject?.images || []).length
    if (idx < existingCount) return
    const extraIdx = idx - existingCount
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== idx))
    setFormData((prev) => {
      const extras = prev.extraPhotos || []
      if (extraIdx === 0) {
        return { ...prev, photo: extras[0] || null, extraPhotos: extras.slice(1) }
      }
      return { ...prev, extraPhotos: extras.filter((_, i) => i !== extraIdx - 1) }
    })
  }

  const [submitting, setSubmitting] = useState(false)
  const [categoryOptions, setCategoryOptions] = useState([])

  const DEFAULT_CATEGORIES = [
    { id: 'education', name: 'Education' },
    { id: 'healthcare', name: 'Healthcare' },
    { id: 'livelihood-support', name: 'Livelihood Support' },
    { id: 'relief-fund', name: 'Relief Fund' },
    { id: 'orphan-support', name: 'Orphan Support' },
    { id: 'scholarship', name: 'Scholarship' },
    { id: 'women-empowerment', name: 'Women Empowerment' },
    { id: 'poverty-alleviation', name: 'Poverty Alleviation' },
    { id: 'nikah', name: 'Nikah' },
    { id: 'others', name: 'Others' }
  ]

  const loadCategories = async () => {
    try {
      const { data } = await api.get('/admin/content/faculties')
      const list = data?.faculties || []
      const active = list
        .filter((c) => (c.status || 'active') === 'active')
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      if (active.length) {
        setCategoryOptions(active.map((c) => ({ id: c.id || c.name?.toLowerCase()?.replace(/\s+/g, '-'), name: c.name })))
      } else {
        setCategoryOptions(DEFAULT_CATEGORIES)
      }
    } catch {
      setCategoryOptions(DEFAULT_CATEGORIES)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    const onUpdate = () => loadCategories()
    window.addEventListener('faculties-updated', onUpdate)
    return () => window.removeEventListener('faculties-updated', onUpdate)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Prevent double submission
    if (submitting) {
      return
    }
    
    try {
      setSubmitting(true)
      const submitData = new FormData()
      Object.keys(formData).forEach(key => {
        if (key === 'location') {
          submitData.append('location', JSON.stringify(formData.location))
        } else if (key === 'photo') {
          if (formData.photo) {
            submitData.append('photo', formData.photo)
          }
        } else if (key === 'targetAmount') {
          // Normalize to avoid rounding bugs (e.g. 5000 stays 5000, not 4889.90)
          const val = formData.targetAmount
          if (val !== '' && val != null) {
            submitData.append(key, String(normalizeAmount(val)))
          }
        } else if (key !== 'subcategory') {
          // subcategory will be sent via tags, not as a top-level field
          submitData.append(key, formData[key])
        }
      })

      // Normalised tags: always include category, optional subcategory
      const tags = [
        { type: 'category', value: formData.faculty }
      ]
      if (formData.subcategory) {
        tags.push({ type: 'subcategory', value: formData.subcategory })
      }
      submitData.append('tags', JSON.stringify(tags))

      const projectId = editingProject?._id || editingProject?.id
      if (editingProject) {
        await api.put(`/projects/${projectId}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        const extraPhotos = formData.extraPhotos || []
        for (let i = 0; i < extraPhotos.length; i++) {
          const fd = new FormData()
          fd.append('photo', extraPhotos[i])
          await api.put(`/projects/${projectId}`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        }
        if (extraPhotos.length) toast.success(`Project updated with ${extraPhotos.length + 1} image(s)`)
        else toast.success('Project updated successfully')
      } else {
        const res = await api.post('/projects', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        const newId = res.data?.project?._id || res.data?.project?.id
        const extraPhotos = formData.extraPhotos || []
        for (let i = 0; i < extraPhotos.length; i++) {
          const fd = new FormData()
          fd.append('photo', extraPhotos[i])
          await api.put(`/projects/${newId}`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        }
        if (extraPhotos.length) toast.success(`Project created with ${extraPhotos.length + 1} image(s)`)
        else toast.success('Project created successfully')
      }
      setShowModal(false)
      setEditingProject(null)
      resetForm()
      loadCategories()
      fetchProjects()
    } catch (error) {
      console.error('Save project error:', error)
      toast.error(error.response?.data?.message || 'Failed to save project. Check console for details.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return
    
    try {
      await api.delete(`/projects/${id}`)
      toast.success('Project deleted successfully')
      fetchProjects()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete project')
    }
  }

  const handleEdit = (project) => {
    loadCategories()
    setEditingProject(project)

    // Extract subcategory from tags if present
    let subcategory = ''
    if (Array.isArray(project.tags)) {
      const sub = project.tags.find((t) => t?.type === 'subcategory')
      if (sub && sub.value) subcategory = sub.value
    }

    setFormData({
      title: project.title || '',
      description: project.description || '',
      shortDescription: project.shortDescription || '',
      faculty: project.faculty || '',
      subcategory,
      status: project.status || 'ongoing',
      targetAmount: project.targetAmount || '',
      isFeatured: project.isFeatured || false,
      location: {
        city: project.location?.city || '',
        state: project.location?.state || '',
        district: project.location?.district || '',
        country: project.location?.country || 'India'
      },
      photo: null
    })
    const imgs = (project.images || []).map((img) => (typeof img === 'string' ? { url: img } : img))
    setPhotoPreviews(imgs.map((img) => ({ dataUrl: img?.url })))
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      shortDescription: '',
      faculty: '',
      subcategory: '',
      status: 'ongoing',
      targetAmount: '',
      isFeatured: false,
      location: {
        city: '',
        state: '',
        district: '',
        country: 'India'
      },
      photo: null,
      extraPhotos: []
    })
    setPhotoPreviews([])
    setAvailableCities([])
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'completed': { label: 'COMPLETED', class: 'bg-green-100 text-green-700 border-green-300' },
      'ongoing': { label: 'ONGOING', class: 'bg-blue-100 text-blue-700 border-blue-300' },
      'planned': { label: 'PLANNED', class: 'bg-yellow-100 text-yellow-700 border-yellow-300' }
    }
    const config = statusMap[status?.toLowerCase()] || statusMap['planned']
    return (
      <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${config.class}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="mt-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 animate-admin-slide-in">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FiTarget className="w-8 h-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-slate-900">Project Management</h1>
          </div>
          <p className="text-slate-600">Create, edit, and manage all projects. Changes sync with the public project detail page.</p>
        </div>
        <button
          onClick={() => {
            loadCategories()
            setEditingProject(null)
            resetForm()
            setShowModal(true)
          }}
          className="px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <FiPlus className="w-5 h-5" /> Add New Project
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6 animate-admin-slide-up hover:shadow-md transition-all duration-300" style={{ animationDelay: '0.1s' }}>
        <div className="grid md:grid-cols-3 gap-4">
          {/* Search Bar */}
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 z-10" size={20} />
            <input
              type="text"
              placeholder="Search projects..."
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

        {/* Status Filter */}
          <div className="relative">
            <FiFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
            <select
              className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 cursor-pointer appearance-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="planned">Planned</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>

        {/* Category Filter */}
          <div className="relative">
            <select
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 cursor-pointer appearance-none"
              value={filterFaculty}
              onChange={(e) => setFilterFaculty(e.target.value)}
            >
              <option value="">Select Category</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {(searchQuery || filterStatus || filterFaculty) && (
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <span className="text-sm text-slate-600 font-semibold">Active filters:</span>
            {searchQuery && (
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold border border-blue-200 flex items-center gap-2">
                Search: {searchQuery}
                <button onClick={() => setSearchQuery('')} className="hover:text-blue-900">
                  <FiX size={14} />
                </button>
              </span>
            )}
            {filterStatus && (
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold border border-blue-200 flex items-center gap-2">
                Status: {filterStatus}
                <button onClick={() => setFilterStatus('')} className="hover:text-blue-900">
                  <FiX size={14} />
                </button>
              </span>
            )}
            {filterFaculty && (
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold border border-blue-200 flex items-center gap-2">
                Faculty: {filterFaculty}
                <button onClick={() => setFilterFaculty('')} className="hover:text-blue-900">
                  <FiX size={14} />
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchQuery('')
                setFilterStatus('')
                setFilterFaculty('')
              }}
              className="text-sm text-primary-600 hover:text-primary-700 font-semibold"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-slate-600">Loading projects...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-admin-slide-up hover:shadow-md transition-all duration-300" style={{ animationDelay: '0.2s' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Title</th>
                  <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Category</th>
                  <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Status</th>
                  <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Progress</th>
                  <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Location</th>
                  <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-500">
                      {projects.length === 0 
                        ? 'No projects found. Click "Add New Project" to create one.'
                        : 'No projects match your search criteria.'}
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((project, index) => {
                    const target = normalizeAmount(project.targetAmount || 0)
                    const current = normalizeAmount(project.currentAmount || 0)
                    const progress = target > 0
                      ? Math.min(Math.round((current / target) * 1000) / 10, 100)
                      : (project.progress || 0)
                    const projectUrl = `/projects/${project._id || project.id}`
                    return (
                      <tr 
                        key={project._id || project.id} 
                        className="hover:bg-slate-50 transition-all duration-200 animate-admin-slide-in"
                        style={{ animationDelay: `${0.3 + index * 0.03}s` }}
                      >
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-slate-900">{project.title}</span>
                            <a
                              href={projectUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 w-fit"
                            >
                              <FiExternalLink className="w-3.5 h-3.5" /> View project
                            </a>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                            {project.faculty}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {getStatusBadge(project.status)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-200 rounded-full h-2 min-w-[80px]">
                                <div 
                                  className="bg-primary-600 h-2 rounded-full transition-all"
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm font-semibold text-slate-700 min-w-[3rem] text-right">
                                {progress.toFixed(1)}%
                              </span>
                            </div>
                            {target > 0 && (
                              <div className="text-xs text-slate-500">
                                {formatINR(current)} / {formatINR(target)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-600">
                          {project.location?.city && `${project.location.city}, `}
                          {project.location?.state || 'N/A'}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-wrap gap-2">
                            <a
                              href={projectUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-sm font-semibold flex items-center gap-1"
                              title="View on site"
                            >
                              <FiExternalLink className="w-4 h-4" />
                              View
                            </a>
                            <button
                              onClick={() => handleEdit(project)}
                              className="px-3 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg transition-colors text-sm font-semibold flex items-center gap-1"
                              title="Edit Project"
                            >
                              <FiEdit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(project._id || project.id)}
                              className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors text-sm font-semibold flex items-center gap-1"
                              title="Delete Project"
                            >
                              <FiTrash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal - scroll inside only */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-hidden flex items-center justify-center p-4 lg:p-6">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex-shrink-0 p-6 border-b border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-slate-900">
                  {editingProject ? 'Edit Project' : 'Create New Project'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingProject(null)
                    resetForm()
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  <FiX size={24} />
                </button>
              </div>
              <p className="text-slate-600 text-sm">Projects you create here will be visible to all users on the website.</p>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Project Images (multiple)
                  </label>
                  <div className="flex flex-wrap gap-4 mb-3">
                    {photoPreviews.map((p, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={p.dataUrl || p}
                          alt={`Preview ${idx + 1}`}
                          className="w-24 h-24 rounded-lg object-cover border-2 border-slate-300"
                        />
                        {idx >= (editingProject?.images?.length || 0) && (
                          <button
                            type="button"
                            onClick={() => removePhotoPreview(idx)}
                            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <FiX className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <label className="cursor-pointer inline-block">
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors font-semibold">
                      <FiUpload className="w-4 h-4" />
                      <span>Add Photo(s)</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-slate-500 mt-1">Max 5MB each. JPG, PNG, WEBP. Select multiple for slider.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter project title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Short Description
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    placeholder="Brief description (shown in listings)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    rows="4"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detailed project description..."
                    required
                  ></textarea>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Category *
                    </label>
                    <select
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 cursor-pointer appearance-none"
                      value={formData.faculty}
                      onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                      required
                    >
                      <option value="">Select Category</option>
                      {categoryOptions.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">This is the main category the project belongs to.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Subcategory (optional)
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                      value={formData.subcategory}
                      onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                      placeholder="e.g., Engineering, Medical, School Support"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Status *
                    </label>
                    <select
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 cursor-pointer appearance-none"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      required
                    >
                      <option value="planned">Planned</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Target Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                    placeholder="Enter target amount"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Country *
                    </label>
                    <select
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 cursor-pointer appearance-none"
                      value={formData.location.country}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: { ...formData.location, country: e.target.value, state: '', city: '' }
                      })}
                      required
                    >
                      {COUNTRIES.map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                  {formData.location.country === 'India' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        State
                      </label>
                      <select
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 cursor-pointer appearance-none"
                        value={formData.location.state}
                        onChange={(e) => {
                          const selectedState = e.target.value;
                          setFormData({
                            ...formData,
                            location: { 
                              ...formData.location, 
                              state: selectedState, 
                              city: selectedState === 'Other' ? formData.location.city : ''
                            }
                          });
                          if (selectedState !== 'Other') {
                            setAvailableCities(getCitiesForState(selectedState));
                          }
                        }}
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                      {formData.location.state === 'Other' && (
                        <input
                          type="text"
                          className="w-full mt-3 px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                          value={formData.location.district || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            location: { 
                              ...formData.location, 
                              district: e.target.value,
                              state: 'Other'
                            }
                          })}
                          placeholder="Enter your state name"
                          required
                        />
                      )}
                    </div>
                  )}
                </div>
                {formData.location.state && formData.location.state !== 'Other' && availableCities.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      City
                    </label>
                    <select
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 cursor-pointer appearance-none"
                      value={formData.location.city}
                      onChange={(e) => {
                        const selectedCity = e.target.value;
                        setFormData({
                          ...formData,
                          location: { 
                            ...formData.location, 
                            city: selectedCity,
                            district: selectedCity === 'Other' ? formData.location.district : ''
                          }
                        });
                      }}
                    >
                      <option value="">Select City</option>
                      {availableCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                      <option value="Other">Other (Specify below)</option>
                    </select>
                    {formData.location.city === 'Other' && (
                      <input
                        type="text"
                        className="w-full mt-3 px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                        value={formData.location.district || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          location: { 
                            ...formData.location, 
                            district: e.target.value,
                            city: 'Other'
                          }
                        })}
                        placeholder="Enter your city name"
                        required
                      />
                    )}
                  </div>
                )}
                {(!formData.location.state || formData.location.state === 'Other' || availableCities.length === 0) && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                      value={formData.location.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: { ...formData.location, city: e.target.value }
                      })}
                      placeholder="Enter city name"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    District
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                    value={formData.location.district}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: { ...formData.location, district: e.target.value }
                    })}
                    placeholder="Enter district name"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="featured"
                    className="w-5 h-5 text-primary-600 rounded border-slate-300 focus:ring-2 focus:ring-primary-500 cursor-pointer"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  />
                  <label htmlFor="featured" className="ml-3 text-slate-700 font-semibold cursor-pointer">
                    Mark as Featured Project
                  </label>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingProject(null)
                      resetForm()
                    }}
                    className="px-4 py-2.5 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    {editingProject ? 'Update Project' : 'Create Project'}
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
