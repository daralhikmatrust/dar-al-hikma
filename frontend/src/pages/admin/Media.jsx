import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiUpload, FiCheck, FiX, FiTrash2, FiSearch, FiFilter, FiImage, FiVideo } from 'react-icons/fi'

export default function AdminMedia() {
  const [media, setMedia] = useState([])
  const [filteredMedia, setFilteredMedia] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterApproved, setFilterApproved] = useState('')
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    category: 'gallery',
    project: ''
  })
  const [file, setFile] = useState(null)
  const [projects, setProjects] = useState([])
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    fetchMedia()
    fetchProjects()
  }, [])

  useEffect(() => {
    filterMedia()
  }, [searchQuery, filterCategory, filterApproved, media])

  const fetchMedia = async () => {
    try {
      const { data } = await api.get('/media')
      setMedia(data.media || [])
      setFilteredMedia(data.media || [])
    } catch (error) {
      console.error('Failed to fetch media:', error)
      toast.error('Failed to load media')
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects')
      setProjects(data.projects || [])
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  const filterMedia = () => {
    let filtered = [...media]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query)
      )
    }

    // Category filter
    if (filterCategory) {
      filtered = filtered.filter(item => item.category === filterCategory)
    }

    // Approval filter
    if (filterApproved === 'approved') {
      filtered = filtered.filter(item => item.isApproved)
    } else if (filterApproved === 'pending') {
      filtered = filtered.filter(item => !item.isApproved)
    }

    setFilteredMedia(filtered)
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      // Create preview for images
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreview(reader.result)
        }
        reader.readAsDataURL(selectedFile)
      } else {
        setPreview(null)
      }
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      toast.error('Please select a file')
      return
    }

    // Validate file size (20MB for images/docs, 50MB for videos)
    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 20 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error(`File size must be less than ${maxSize / (1024 * 1024)}MB`)
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', uploadData.title)
      formData.append('description', uploadData.description)
      formData.append('category', uploadData.category)
      if (uploadData.project) {
        formData.append('project', uploadData.project)
      }

      await api.post('/media/upload', formData)

      toast.success('Media uploaded successfully')
      setShowUpload(false)
      setFile(null)
      setPreview(null)
      setUploadData({
        title: '',
        description: '',
        category: 'gallery',
        project: ''
      })
      fetchMedia()
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error.response?.data?.message || 'Upload failed. Please check file format and size.')
    } finally {
      setUploading(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      await api.put(`/media/${id}/approve`)
      toast.success('Media approved')
      fetchMedia()
    } catch (error) {
      toast.error('Failed to approve')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this media?')) return
    
    try {
      await api.delete(`/media/${id}`)
      toast.success('Media deleted')
      fetchMedia()
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="mt-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 animate-admin-slide-in">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Media Gallery</h1>
          <p className="text-slate-600">Upload and manage all media files visible to users</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
        >
          <FiUpload className="w-5 h-5" /> Upload Media
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6 animate-admin-slide-up hover:shadow-md transition-all duration-300" style={{ animationDelay: '0.1s' }}>
        <div className="grid md:grid-cols-3 gap-4">
          {/* Search Bar */}
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search media..."
              className="w-full pl-12 pr-10 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <FiX size={18} />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="relative">
            <FiFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={20} />
            <select
              className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 cursor-pointer appearance-none"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="gallery">Gallery</option>
              <option value="project">Project</option>
              <option value="event">Event</option>
              <option value="news">News</option>
            </select>
          </div>

          {/* Approval Filter */}
          <div className="relative">
            <select
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 cursor-pointer appearance-none"
              value={filterApproved}
              onChange={(e) => setFilterApproved(e.target.value)}
            >
              <option value="">All Media</option>
              <option value="approved">Approved Only</option>
              <option value="pending">Pending Approval</option>
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {(searchQuery || filterCategory || filterApproved) && (
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
            {filterCategory && (
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold border border-blue-200 flex items-center gap-2">
                Category: {filterCategory}
                <button onClick={() => setFilterCategory('')} className="hover:text-blue-900">
                  <FiX size={14} />
                </button>
              </span>
            )}
            {filterApproved && (
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold border border-blue-200 flex items-center gap-2">
                {filterApproved === 'approved' ? 'Approved' : 'Pending'}
                <button onClick={() => setFilterApproved('')} className="hover:text-blue-900">
                  <FiX size={14} />
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchQuery('')
                setFilterCategory('')
                setFilterApproved('')
              }}
              className="text-sm text-primary-600 hover:text-primary-700 font-semibold"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200 animate-admin-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-slate-600">Loading media...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMedia.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500 animate-admin-slide-up" style={{ animationDelay: '0.2s' }}>
              {media.length === 0 
                ? 'No media found. Click "Upload Media" to add files.'
                : 'No media match your search criteria.'}
            </div>
          ) : (
            filteredMedia.map((item, index) => (
              <div 
                key={item._id || item.id} 
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-300 group animate-admin-slide-up"
                style={{ animationDelay: `${0.2 + index * 0.05}s` }}
              >
                <div className="aspect-square relative overflow-hidden">
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={item.title || 'Media'}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        // Try to load from different URL format or show placeholder
                        if (item.url && !item.url.includes('placeholder')) {
                          e.target.src = item.url.replace('http://', 'https://') || 'https://via.placeholder.com/400?text=Image+Error'
                        } else {
                          e.target.src = 'https://via.placeholder.com/400?text=Image+Error'
                        }
                      }}
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                      <FiVideo className="text-white text-4xl" />
                    </div>
                  )}
                  {!item.isApproved && (
                    <div className="absolute top-2 left-2 bg-yellow-100 text-yellow-700 border border-yellow-300 px-3 py-1 rounded-lg text-xs font-bold">
                      PENDING
                    </div>
                  )}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDelete(item._id || item.id)}
                      className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                      title="Delete"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm mb-1 truncate text-slate-900">{item.title || 'Untitled'}</h3>
                  <p className="text-xs text-slate-600 mb-2 capitalize">{item.category}</p>
                  {item.project && (
                    <p className="text-xs text-primary-600 mb-2">Project: {item.project.title || 'N/A'}</p>
                  )}
                  <div className="flex gap-2">
                    {!item.isApproved && (
                      <button
                        onClick={() => handleApprove(item._id || item.id)}
                        className="flex-1 bg-green-50 text-green-700 border border-green-300 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors flex items-center justify-center"
                      >
                        <FiCheck className="mr-1" size={14} /> Approve
                      </button>
                    )}
                    {item.isApproved && (
                      <span className="flex-1 bg-green-100 text-green-700 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center">
                        <FiCheck className="mr-1" size={14} /> Approved
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-hidden flex items-center justify-center p-4 lg:p-6">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex-shrink-0 flex items-center justify-between border-b border-slate-200 p-4">
              <h2 className="text-2xl font-bold text-slate-900">Upload Media</h2>
              <button
                onClick={() => {
                  setShowUpload(false)
                  setFile(null)
                  setPreview(null)
                  setUploadData({
                    title: '',
                    description: '',
                    category: 'gallery',
                    project: ''
                  })
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
              <form onSubmit={handleUpload} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    File * (Images/Documents: 20MB, Videos: 50MB)
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*,video/*,application/pdf,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg,.tiff,.ico,.heic,.heif,.mp4,.mov,.avi,.webm,.mkv,.flv,.wmv,.m4v,.3gp,.ogv,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                      required
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      {preview ? (
                        <div className="space-y-4">
                          <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                          <p className="text-sm text-slate-600">{file?.name}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <FiUpload className="mx-auto text-4xl text-slate-400" />
                          <p className="text-slate-600">Click to upload or drag and drop</p>
                          <p className="text-xs text-slate-500">Images: JPG, PNG, WEBP, GIF | Videos: MP4, MOV, AVI</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                    value={uploadData.title}
                    onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                    placeholder="Enter media title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
                    value={uploadData.description}
                    onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                    placeholder="Enter media description"
                  ></textarea>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Category
                    </label>
                    <select
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 cursor-pointer appearance-none"
                      value={uploadData.category}
                      onChange={(e) => setUploadData({ ...uploadData, category: e.target.value })}
                    >
                      <option value="gallery">Gallery</option>
                      <option value="project">Project</option>
                      <option value="event">Event</option>
                      <option value="news">News</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Related Project (Optional)
                    </label>
                    <select
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 cursor-pointer appearance-none"
                      value={uploadData.project}
                      onChange={(e) => setUploadData({ ...uploadData, project: e.target.value })}
                    >
                      <option value="">None</option>
                      {projects.map(project => (
                        <option key={project._id || project.id} value={project._id || project.id}>
                          {project.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUpload(false)
                      setFile(null)
                      setPreview(null)
                      setUploadData({
                        title: '',
                        description: '',
                        category: 'gallery',
                        project: ''
                      })
                    }}
                    className="px-4 py-2.5 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={uploading || !file} 
                    className="px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
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
