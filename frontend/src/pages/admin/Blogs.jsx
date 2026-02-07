import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { 
  FiPlus, FiEdit, FiTrash2, FiSearch, FiX, FiEye, FiEyeOff, 
  FiCalendar, FiUser, FiUpload, FiArrowLeft, FiType, FiImage, FiVideo, FiGlobe, FiLink 
} from 'react-icons/fi'

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState([])
  const [filteredBlogs, setFilteredBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  
  // View State: Toggles between List and Form
  const [showForm, setShowForm] = useState(false)
  const [editingBlog, setEditingBlog] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  
  // Initial Form State
  const initialFormState = {
    title: '',
    excerpt: '',
    content: '',
    author: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    featuredImageUrl: '',
    featuredImageFile: null,
    images: [],
    videoUrl: '',
    status: 'draft',
    seoTitle: '',
    seoDescription: '',
    url: ''
  }

  const [formData, setFormData] = useState(initialFormState)
  const [categoryOptions, setCategoryOptions] = useState([])

  useEffect(() => {
    loadBlogs()
  }, [])

  // Load Categories from API (Faculties)
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/admin/content/faculties')
        const list = data?.faculties || []
        const active = list
          .filter((c) => (c.status || 'active') === 'active')
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        setCategoryOptions(active.map((c) => ({ id: c.id, name: c.name })))
      } catch {
        setCategoryOptions([])
      }
    }
    load()
  }, [])

  useEffect(() => {
    filterBlogs()
  }, [searchQuery, blogs])

  const loadBlogs = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/blogs/admin/all')
      setBlogs(data.blogs || [])
      setFilteredBlogs(data.blogs || [])
    } catch (error) {
      console.error('Failed to load blogs:', error)
      toast.error('Failed to load blogs')
      setBlogs([])
      setFilteredBlogs([])
    } finally {
      setLoading(false)
    }
  }

  const filterBlogs = () => {
    let filtered = [...blogs]
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(blog =>
        blog.title?.toLowerCase().includes(query) ||
        blog.excerpt?.toLowerCase().includes(query) ||
        blog.author?.toLowerCase().includes(query) ||
        blog.category?.toLowerCase().includes(query)
      )
    }
    setFilteredBlogs(filtered)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required')
      return
    }

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('excerpt', formData.excerpt || '')
      formDataToSend.append('content', formData.content)
      formDataToSend.append('author', formData.author || '')
      formDataToSend.append('category', formData.category || '')
      formDataToSend.append('date', formData.date)
      formDataToSend.append('featuredImageUrl', formData.featuredImageUrl || '')
      formDataToSend.append('images', JSON.stringify(formData.images || []))
      formDataToSend.append('videoUrl', formData.videoUrl || '')
      formDataToSend.append('status', formData.status)
      formDataToSend.append('seoTitle', formData.seoTitle || '')
      formDataToSend.append('seoDescription', formData.seoDescription || '')
      formDataToSend.append('url', formData.url || '')

      if (formData.featuredImageFile) {
        formDataToSend.append('featuredImage', formData.featuredImageFile)
      }

      if (editingBlog) {
        await api.put(`/blogs/admin/${editingBlog.id}`, formDataToSend)
        toast.success('Blog updated successfully')
      } else {
        await api.post('/blogs/admin', formDataToSend)
        toast.success('Blog created successfully')
      }

      await loadBlogs()
      handleCloseForm()
    } catch (error) {
      console.error('Failed to save blog:', error)
      toast.error(error.response?.data?.message || 'Failed to save blog')
    }
  }

  const handleEdit = (blog) => {
    setEditingBlog(blog)
    setFormData({
      title: blog.title || '',
      excerpt: blog.excerpt || '',
      content: blog.content || '',
      author: blog.author || '',
      category: blog.category || '',
      date: blog.date ? blog.date.split('T')[0] : new Date().toISOString().split('T')[0],
      featuredImageUrl: blog.featuredImage || '',
      featuredImageFile: null,
      images: blog.images || [],
      videoUrl: blog.videoUrl || '',
      status: blog.status || 'draft',
      seoTitle: blog.seoTitle || '',
      seoDescription: blog.seoDescription || '',
      url: blog.url || ''
    })
    setShowForm(true) // Switch to Form View
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this blog permanently?')) return
    try {
      await api.delete(`/blogs/admin/${id}`)
      toast.success('Blog deleted')
      await loadBlogs()
    } catch (error) {
      console.error('Failed to delete blog:', error)
      toast.error('Failed to delete blog')
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingBlog(null)
    setFormData(initialFormState)
  }

  const toggleStatus = async (id) => {
    try {
      const blog = blogs.find(b => b.id === id)
      if (!blog) return

      const newStatus = blog.status === 'published' ? 'draft' : 'published'
      const formDataToSend = new FormData()
      
      Object.keys(blog).forEach(key => {
        if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'createdBy') {
           if (key === 'featuredImage') {
             formDataToSend.append('featuredImageUrl', blog.featuredImage || '')
           } else if (key === 'images') {
             formDataToSend.append('images', JSON.stringify(blog.images || []))
           } else {
             formDataToSend.append(key, blog[key] || '')
           }
        }
      })
      formDataToSend.append('status', newStatus)

      await api.put(`/blogs/admin/${id}`, formDataToSend)
      toast.success(`Blog ${newStatus === 'published' ? 'published' : 'moved to draft'}`)
      await loadBlogs()
    } catch (error) {
      console.error('Failed to update status:', error)
      toast.error('Failed to update status')
    }
  }

  const handleImageFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size must be less than 10MB')
        return
      }
      setFormData({ ...formData, featuredImageFile: file })
    }
  }

  // --- VIEW 1: BLOG LIST ---
  if (!showForm) {
    return (
      <div className="w-full animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Blogs Management</h1>
            <p className="text-sm text-slate-500 mt-1">Create, edit, and manage blog posts</p>
          </div>
          <button
            onClick={() => {
              setEditingBlog(null)
              setFormData(initialFormState)
              setShowForm(true)
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            <FiPlus className="w-5 h-5" />
            <span>New Blog</span>
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="relative max-w-md">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search blogs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-slate-600">Loading blogs...</p>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-600 mb-4">No blogs found</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
              >
                <FiPlus className="w-5 h-5" />
                <span>Create First Blog</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Title</th>
                    <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Author</th>
                    <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Category</th>
                    <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Date</th>
                    <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Status</th>
                    <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBlogs.map((blog) => (
                    <tr key={blog.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900">{blog.title || 'Untitled'}</div>
                        {blog.excerpt && (
                          <div className="text-xs text-slate-500 mt-1 line-clamp-1">{blog.excerpt}</div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-700">{blog.author || '—'}</td>
                      <td className="py-4 px-6">
                        {blog.category && (
                          <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-lg text-xs font-semibold">
                            {blog.category}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">
                        {blog.date ? new Date(blog.date).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                            blog.status === 'published'
                              ? 'bg-green-100 text-green-700 border-green-300'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          {blog.status === 'published' ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleStatus(blog.id)}
                            className={`p-2 rounded-lg border text-xs font-semibold ${
                              blog.status === 'published'
                                ? 'border-slate-300 text-slate-600 hover:bg-slate-100'
                                : 'border-green-500 text-green-600 hover:bg-green-50'
                            }`}
                            title={blog.status === 'published' ? 'Unpublish' : 'Publish'}
                          >
                            {blog.status === 'published' ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleEdit(blog)}
                            className="p-2 rounded-lg border border-primary-200 text-primary-600 hover:bg-primary-50 text-xs font-semibold"
                            title="Edit"
                          >
                            <FiEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(blog.id)}
                            className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
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
  return (
    <div className="w-full max-w-4xl mx-auto animate-in slide-in-from-right-4 duration-300">
      
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={handleCloseForm}
          className="p-2 rounded-full hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 text-slate-500 transition-all"
        >
          <FiArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {editingBlog ? 'Edit Blog' : 'New Blog'}
          </h1>
          <p className="text-sm text-slate-500">Draft your content below</p>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section: Basic Info */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Blog Title *</label>
            <div className="relative">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                placeholder="Enter an engaging title"
                required
              />
              <FiType className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
             <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Author</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  placeholder="Writer Name"
                />
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white cursor-pointer text-sm"
              >
                <option value="">Select Category</option>
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Publish Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
             <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">URL Slug</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  placeholder="blog-post-url-slug"
                />
                <FiGlobe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Section: Status */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'draft' })}
                className={`px-5 py-2 rounded-lg font-semibold text-sm border transition-all ${
                  formData.status === 'draft'
                    ? 'border-slate-400 bg-slate-100 text-slate-800 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                }`}
              >
                Draft
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'published' })}
                className={`px-5 py-2 rounded-lg font-semibold text-sm border transition-all ${
                  formData.status === 'published'
                    ? 'border-green-500 bg-green-50 text-green-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                }`}
              >
                Published
              </button>
            </div>
          </div>

          {/* Section: Content */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Excerpt</label>
            <textarea
              rows={2}
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm"
              placeholder="Short summary for the blog card..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Content *</label>
            <textarea
              rows={12}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm leading-relaxed"
              placeholder="Write your full blog post here..."
              required
            />
          </div>

          {/* Section: Media */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FiImage /> Blog Media
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Featured Image</label>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white file:text-primary-700 hover:file:bg-slate-100 border border-slate-300 rounded-lg"
                  />
                  
                  <div className="relative">
                    <input
                      type="url"
                      value={formData.featuredImageUrl}
                      onChange={(e) => setFormData({ ...formData, featuredImageUrl: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Or Image URL..."
                    />
                    <FiLink className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>

                  {(formData.featuredImageUrl || formData.featuredImageFile) && (
                    <div className="rounded-lg overflow-hidden border border-slate-200 aspect-video max-h-40 bg-white">
                      {formData.featuredImageFile ? (
                        <img src={URL.createObjectURL(formData.featuredImageFile)} alt="Preview" className="w-full h-full object-cover" />
                      ) : formData.featuredImageUrl ? (
                        <img src={formData.featuredImageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none' }} />
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Video Embed</label>
                <div className="relative">
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="YouTube/Vimeo URL..."
                  />
                  <FiVideo className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Section: SEO */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FiSearch /> SEO Settings
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Meta Title</label>
                <input
                  type="text"
                  value={formData.seoTitle}
                  onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  placeholder="Title for search engines"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Meta Description</label>
                <textarea
                  rows={3}
                  value={formData.seoDescription}
                  onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                  placeholder="Description for search results"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCloseForm}
              className="px-6 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadingImage}
              className="px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 text-sm shadow-sm transition-colors"
            >
              {editingBlog ? 'Update Blog' : 'Create Blog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}