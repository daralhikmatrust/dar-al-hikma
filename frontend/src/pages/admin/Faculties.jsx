import { useState, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import { FiPlus, FiEdit, FiTrash2, FiBook, FiHeart, FiHome, FiUsers, FiX, FiSearch } from 'react-icons/fi'

const DEFAULT_CATEGORIES = [
  'Education',
  'Healthcare',
  'Livelihood Support',
  'Relief Fund',
  'Orphan Support',
  'Scholarship',
  'Women Empowerment',
  'Poverty Alleviation',
  'Nikah',
  'Others'
]

const CATEGORY_ICONS = {
  Education: FiBook,
  Healthcare: FiHeart,
  'Livelihood Support': FiHome,
  'Relief Fund': FiUsers,
  'Orphan Support': FiUsers,
  Scholarship: FiBook,
  'Women Empowerment': FiUsers,
  'Poverty Alleviation': FiUsers,
  Nikah: FiHeart,
  Others: FiBook
}

const COLOR_CLASSES = [
  'from-primary-500 to-primary-600',
  'from-emerald-500 to-emerald-600',
  'from-sky-500 to-sky-600',
  'from-rose-500 to-rose-600',
  'from-amber-500 to-amber-600',
  'from-indigo-500 to-indigo-600'
]

const STATUS_OPTIONS = ['active', 'inactive']

export default function AdminFaculties() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    status: 'active',
    sortOrder: 0
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = () => {
    try {
      const stored = localStorage.getItem('faculties')
      let data = []
      if (stored) {
        data = JSON.parse(stored)
      } else {
        // Seed defaults matching user-facing Category menu
        data = DEFAULT_CATEGORIES.map((name, index) => ({
          id: name.toLowerCase().replace(/\s+/g, '-'),
          name,
          description: `${name} related projects and causes.`,
          icon: name,
          color: COLOR_CLASSES[index % COLOR_CLASSES.length],
          status: 'active',
          sortOrder: index
        }))
        localStorage.setItem('faculties', JSON.stringify(data))
      }
      setCategories(data)
    } catch {
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const saveCategories = (next) => {
    localStorage.setItem('faculties', JSON.stringify(next))
    setCategories(next)
    window.dispatchEvent(new CustomEvent('faculties-updated'))
  }

  const handleOpenNew = () => {
    setEditingCategory(null)
    setFormData({
      name: '',
      description: '',
      slug: '',
      status: 'active',
      sortOrder: categories.length
    })
    setShowModal(true)
  }

  const handleEdit = (cat) => {
    setEditingCategory(cat)
    setFormData({
      name: cat.name,
      description: cat.description || '',
      slug: cat.slug || cat.id,
      status: cat.status || 'active',
      sortOrder: typeof cat.sortOrder === 'number' ? cat.sortOrder : 0
    })
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return
    const next = categories.filter((c) => c.id !== id)
    saveCategories(next)
    toast.success('Category deleted')
  }

  const handleToggleStatus = (id) => {
    const next = categories.map((c) =>
      c.id === id ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' } : c
    )
    saveCategories(next)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const baseSlug = (formData.slug || formData.name).toLowerCase().trim().replace(/\s+/g, '-')
    if (!baseSlug) {
      toast.error('Category name is required')
      return
    }

    if (editingCategory) {
      const next = categories.map((c) =>
        c.id === editingCategory.id
          ? {
              ...c,
              name: formData.name,
              description: formData.description,
              slug: baseSlug,
              status: formData.status,
              sortOrder: formData.sortOrder
            }
          : c
      )
      saveCategories(next)
      toast.success('Category updated')
    } else {
      const color = COLOR_CLASSES[(categories.length || 0) % COLOR_CLASSES.length]
      const Icon = CATEGORY_ICONS[formData.name] ? formData.name : 'Education'
      const newCat = {
        id: baseSlug,
        name: formData.name,
        description: formData.description,
        slug: baseSlug,
        icon: Icon,
        color,
        status: formData.status,
        sortOrder: formData.sortOrder
      }
      const next = [...categories, newCat]
      saveCategories(next)
      toast.success('Category created')
    }

    setShowModal(false)
    setEditingCategory(null)
  }

  const sortedFiltered = useMemo(() => {
    return [...categories]
      .filter((c) => {
        if (statusFilter !== 'all' && (c.status || 'active') !== statusFilter) return false
        if (!search) return true
        const q = search.toLowerCase()
        return (
          c.name?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.slug?.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  }, [categories, search, statusFilter])

  if (loading) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-slate-600">Loading categories...</p>
      </div>
    )
  }

  return (
    <div className="mt-0 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-admin-slide-in">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Categories</h1>
          <p className="text-slate-600 text-sm">
            Manage all giving categories that appear in the user site and project classification.
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          className="px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <FiPlus className="w-5 h-5" />
          Add Category
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between animate-admin-slide-up">
        <div className="flex items-center gap-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              className="pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-[220px]"
              placeholder="Search by name, slug, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </div>
        <p className="text-xs text-slate-500">
          Categories are used by the user site navigation and when classifying projects.
        </p>
      </div>

      {/* Categories grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sortedFiltered.map((cat, index) => {
          const IconComp = CATEGORY_ICONS[cat.icon] || FiBook
          const colorClass = cat.color || COLOR_CLASSES[index % COLOR_CLASSES.length]
          const isInactive = (cat.status || 'active') === 'inactive'
          return (
            <div
              key={cat.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
            >
              <div className="p-5 flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-lg`}
                >
                  <IconComp className="text-white w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-slate-900 truncate">
                      {cat.name}
                    </h3>
                    {isInactive && (
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate mb-1">Slug: {cat.slug || cat.id}</p>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {cat.description}
                  </p>
                </div>
              </div>
              <div className="px-5 pb-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span>Order #{cat.sortOrder ?? 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(cat.id)}
                    className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50"
                  >
                    {isInactive ? 'Mark Active' : 'Mark Inactive'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEdit(cat)}
                    className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50"
                    title="Edit category"
                  >
                    <FiEdit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(cat.id)}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                    title="Delete category"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {sortedFiltered.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 col-span-full">
            No categories match your filters.
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-hidden flex items-center justify-center p-4 lg:p-6">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex-shrink-0 p-6 border-b border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-slate-900">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingCategory(null)
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  <FiX size={22} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g. Education"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Slug (URL key)
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="education"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Used in URLs and filters. Leave blank to auto-generate.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Status
                    </label>
                    <select
                      className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s === 'active' ? 'Active' : 'Inactive'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    placeholder="Short description to explain what fits under this category."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-32 px-3 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, sortOrder: Number(e.target.value) || 0 })
                    }
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Lower numbers appear first in lists and dropdowns.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingCategory(null)
                    }}
                    className="px-4 py-2.5 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 text-sm shadow-sm"
                  >
                    {editingCategory ? 'Update Category' : 'Create Category'}
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
