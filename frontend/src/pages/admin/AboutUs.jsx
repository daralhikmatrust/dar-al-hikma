import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { FiPlus, FiEdit, FiTrash2, FiX, FiUpload, FiChevronDown, FiChevronRight } from 'react-icons/fi'
const SECTION_LABELS = {
  who_we_are: 'Who We Are',
  why_dar_al_hikma: 'Why Dar Al Hikma',
  council: 'Our Council',
  advisory: 'Advisory Board',
  legal_financial: 'Legal & Financial Team',
  audit: 'Audit'
}

const MEMBER_TYPE_LABELS = {
  council: 'Council Member',
  advisory: 'Advisory Board Member',
  legal_financial: 'Legal & Financial Team Member'
}

export default function AdminAboutUs() {
  const [data, setData] = useState({ sections: {}, members: [], auditReports: [] })
  const [loading, setLoading] = useState(true)
  const [openSection, setOpenSection] = useState('who_we_are')
  const [sectionModal, setSectionModal] = useState(null)
  const [memberModal, setMemberModal] = useState(null)
  const [auditModal, setAuditModal] = useState(null)
  const [sectionForm, setSectionForm] = useState({ sectionType: '', title: '', description: '', content: { hero: {}, blocks: [] } })
  const [memberForm, setMemberForm] = useState({
    id: null, memberType: 'council', name: '', role: '', description: '', photoUrl: '', photoFile: null, displayOrder: 0, visible: true
  })
  const [auditForm, setAuditForm] = useState({
    id: null, title: '', fiscalYear: '', fileUrl: '', fileName: '', file: null, description: '', displayOrder: 0, visible: true
  })

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    try {
      setLoading(true)
      const { data: res } = await api.get('/about-us/admin')
      setData({
        sections: res.sections || {},
        members: res.members || [],
        auditReports: res.auditReports || []
      })
    } catch (e) {
      toast.error('Failed to load About Us content')
      setData({ sections: {}, members: [], auditReports: [] })
    } finally {
      setLoading(false)
    }
  }

  const saveSection = async (e) => {
    e.preventDefault()
    if (!sectionForm.sectionType) return
    try {
      const content = sectionForm.content || {}
      if (sectionForm.sectionType === 'who_we_are' || sectionForm.sectionType === 'why_dar_al_hikma') {
        content.hero = content.hero || {}
        content.blocks = content.blocks || []
      }
      await api.put('/about-us/sections', {
        sectionType: sectionForm.sectionType,
        title: sectionForm.title,
        description: sectionForm.description,
        content
      })
      toast.success('Section saved')
      setSectionModal(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save section')
    }
  }

  const openSectionEdit = (sectionType) => {
    const section = data.sections[sectionType]
    const c = section?.content || {}
    const hero = c.hero || {}
    setSectionForm({
      sectionType,
      title: section?.title || '',
      description: section?.description || '',
      content: {
        hero: {
          style: hero.style || 'split',
          imageUrl: hero.imageUrl || '',
          label: hero.label || '',
          headline: hero.headline || '',
          intro: hero.intro || '',
          ctaText: hero.ctaText || '',
          ctaUrl: hero.ctaUrl || '',
          showScrollIndicator: hero.showScrollIndicator !== false
        },
        blocks: Array.isArray(c.blocks) ? c.blocks.map(b => ({ ...b, linkText: b.linkText || '', linkUrl: b.linkUrl || '' })) : []
      }
    })
    setSectionModal(sectionType)
  }

  const uploadSectionImage = async (file) => {
    const fd = new FormData()
    fd.append('image', file)
    const { data } = await api.post('/about-us/sections/upload-image', fd)
    return data?.url || ''
  }

  const addContentBlock = () => {
    setSectionForm(f => ({
      ...f,
      content: {
        ...f.content,
        blocks: [...(f.content?.blocks || []), { imageUrl: '', headline: '', body: '', imageLeft: true, linkText: '', linkUrl: '' }]
      }
    }))
  }

  const updateBlock = (idx, field, value) => {
    setSectionForm(f => {
      const blocks = [...(f.content?.blocks || [])]
      blocks[idx] = { ...blocks[idx], [field]: value }
      return { ...f, content: { ...f.content, blocks } }
    })
  }

  const removeBlock = (idx) => {
    setSectionForm(f => {
      const blocks = (f.content?.blocks || []).filter((_, i) => i !== idx)
      return { ...f, content: { ...f.content, blocks } }
    })
  }

  const saveMember = async (e) => {
    e.preventDefault()
    if (!memberForm.name.trim()) {
      toast.error('Name is required')
      return
    }
    
    // For new members, require photo; for edits, allow keeping existing
    if (!memberForm.id && !memberForm.photoFile && !memberForm.photoUrl?.trim()) {
      toast.error('Please upload a photo or provide a photo URL')
      return
    }
    
    try {
      const formData = new FormData()
      formData.append('memberType', memberForm.memberType)
      formData.append('name', memberForm.name)
      formData.append('role', memberForm.role || '')
      formData.append('description', memberForm.description || '')
      formData.append('photoUrl', memberForm.photoUrl || '')
      formData.append('displayOrder', memberForm.displayOrder)
      formData.append('visible', memberForm.visible)
      if (memberForm.id) formData.append('id', memberForm.id)
      
      // Photo file takes priority over URL
      if (memberForm.photoFile) {
        formData.append('photo', memberForm.photoFile)
      }

      if (memberForm.id) {
        await api.put(`/about-us/members/${memberForm.id}`, formData)
        toast.success('Member updated successfully')
      } else {
        await api.post('/about-us/members', formData)
        toast.success('Member added successfully')
      }
      setMemberModal(null)
      setMemberForm({ id: null, memberType: 'council', name: '', role: '', description: '', photoUrl: '', photoFile: null, displayOrder: 0, visible: true })
      load()
    } catch (err) {
      console.error('Save member error:', err)
      toast.error(err.response?.data?.message || 'Failed to save member')
    }
  }

  const openMemberEdit = (member) => {
    setMemberForm({
      id: member.id,
      memberType: member.memberType,
      name: member.name || '',
      role: member.role || '',
      description: member.description || '',
      photoUrl: member.photo || '',
      photoFile: null,
      displayOrder: member.displayOrder ?? 0,
      visible: member.visible !== false
    })
    setMemberModal('edit')
  }

  const openMemberNew = (memberType) => {
    setMemberForm({
      id: null,
      memberType,
      name: '',
      role: '',
      description: '',
      photoUrl: '',
      photoFile: null,
      displayOrder: 0,
      visible: true
    })
    setMemberModal('new')
  }

  const deleteMember = async (id) => {
    if (!window.confirm('Remove this member?')) return
    try {
      await api.delete(`/about-us/members/${id}`)
      toast.success('Member removed')
      load()
    } catch (err) {
      toast.error('Failed to delete member')
    }
  }

  const saveAudit = async (e) => {
    e.preventDefault()
    if (!auditForm.title.trim() || !auditForm.fiscalYear.trim()) {
      toast.error('Title and fiscal year are required')
      return
    }
    
    // For new audit reports, require PDF; for edits, allow keeping existing
    if (!auditForm.id && !auditForm.file && !auditForm.fileUrl?.trim()) {
      toast.error('Please upload a PDF file or provide a file URL')
      return
    }
    
    try {
      const formData = new FormData()
      formData.append('title', auditForm.title)
      formData.append('fiscalYear', auditForm.fiscalYear)
      formData.append('fileUrl', auditForm.fileUrl || '')
      formData.append('fileName', auditForm.fileName || '')
      formData.append('description', auditForm.description || '')
      formData.append('displayOrder', auditForm.displayOrder)
      formData.append('visible', auditForm.visible)
      if (auditForm.id) formData.append('id', auditForm.id)
      
      // File upload takes priority over URL
      if (auditForm.file) {
        formData.append('file', auditForm.file)
      }

      if (auditForm.id) {
        await api.put(`/about-us/audit-reports/${auditForm.id}`, formData)
        toast.success('Audit report updated successfully')
      } else {
        await api.post('/about-us/audit-reports', formData)
        toast.success('Audit report added successfully')
      }
      setAuditModal(null)
      setAuditForm({ id: null, title: '', fiscalYear: '', fileUrl: '', fileName: '', file: null, description: '', displayOrder: 0, visible: true })
      load()
    } catch (err) {
      console.error('Save audit error:', err)
      toast.error(err.response?.data?.message || 'Failed to save audit report')
    }
  }

  const openAuditEdit = (report) => {
    setAuditForm({
      id: report.id,
      title: report.title || '',
      fiscalYear: report.fiscalYear || '',
      fileUrl: report.fileUrl || '',
      fileName: report.fileName || '',
      file: null,
      description: report.description || '',
      displayOrder: report.displayOrder ?? 0,
      visible: report.visible !== false
    })
    setAuditModal('edit')
  }

  const openAuditNew = () => {
    setAuditForm({
      id: null,
      title: '',
      fiscalYear: '',
      fileUrl: '',
      fileName: '',
      file: null,
      description: '',
      displayOrder: 0,
      visible: true
    })
    setAuditModal('new')
  }

  const deleteAudit = async (id) => {
    if (!window.confirm('Remove this audit report?')) return
    try {
      await api.delete(`/about-us/audit-reports/${id}`)
      toast.success('Audit report removed')
      load()
    } catch (err) {
      toast.error('Failed to delete audit report')
    }
  }

  const membersByType = (type) => data.members.filter((m) => m.memberType === type).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <p className="text-slate-600">Loading About Us content...</p>
      </div>
    )
  }

  return (
    <div className="mt-0">
      <div className="mb-6 animate-admin-slide-in">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">About Us Management</h1>
        <p className="text-slate-600">Manage all About Us content. Changes reflect immediately on the public website.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a 
            href="/about/who-we-are" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 bg-primary-50 text-primary-700 border border-primary-200 rounded-lg text-sm font-semibold hover:bg-primary-100 transition-colors"
          >
            Preview: Who We Are
          </a>
          <a 
            href="/about/our-council" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 bg-primary-50 text-primary-700 border border-primary-200 rounded-lg text-sm font-semibold hover:bg-primary-100 transition-colors"
          >
            Preview: Our Council
          </a>
          <a 
            href="/about/advisory-board" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 bg-primary-50 text-primary-700 border border-primary-200 rounded-lg text-sm font-semibold hover:bg-primary-100 transition-colors"
          >
            Preview: Advisory Board
          </a>
          <a 
            href="/about/audit" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 bg-primary-50 text-primary-700 border border-primary-200 rounded-lg text-sm font-semibold hover:bg-primary-100 transition-colors"
          >
            Preview: Audit Reports
          </a>
        </div>
      </div>

      <div className="space-y-4">
        {['who_we_are', 'why_dar_al_hikma'].map((key) => {
          const section = data.sections[key]
          const isOpen = openSection === key
          return (
            <div key={key} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <button
                  type="button"
                  onClick={() => setOpenSection(isOpen ? '' : key)}
                  className="flex-1 text-left"
                >
                  <span className="font-semibold text-slate-900">{SECTION_LABELS[key]}</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openSectionEdit(key) }}
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                  >
                    <FiEdit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenSection(isOpen ? '' : key)}
                    className="p-1"
                  >
                    {isOpen ? <FiChevronDown className="w-5 h-5 text-slate-500" /> : <FiChevronRight className="w-5 h-5 text-slate-500" />}
                  </button>
                </div>
              </div>
              {isOpen && (
                <div className="px-4 pb-4 pt-0 border-t border-slate-100">
                  <p className="text-sm text-slate-600 mt-2">{section?.description || 'No content yet. Click Edit to add.'}</p>
                </div>
              )}
            </div>
          )
        })}

        {['council', 'advisory', 'legal_financial'].map((memberType) => {
          const list = membersByType(memberType)
          const isOpen = openSection === memberType
          return (
            <div key={memberType} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <button
                  type="button"
                  onClick={() => setOpenSection(isOpen ? '' : memberType)}
                  className="flex-1 text-left"
                >
                  <span className="font-semibold text-slate-900">{SECTION_LABELS[memberType]}</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openMemberNew(memberType) }}
                    className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
                  >
                    <FiPlus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenSection(isOpen ? '' : memberType)}
                    className="p-1"
                  >
                    {isOpen ? <FiChevronDown className="w-5 h-5 text-slate-500" /> : <FiChevronRight className="w-5 h-5 text-slate-500" />}
                  </button>
                </div>
              </div>
              {isOpen && (
                <div className="px-4 pb-4 border-t border-slate-100">
                  {list.length === 0 ? (
                    <p className="text-sm text-slate-500 py-4">No members. Click + to add.</p>
                  ) : (
                    <ul className="space-y-2 mt-2">
                      {list.map((m) => (
                        <li key={m.id} className="flex items-center justify-between py-3 px-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {m.photo ? (
                              <img 
                                src={m.photo} 
                                alt={m.name} 
                                className="w-12 h-12 rounded-lg object-cover border border-slate-300 flex-shrink-0"
                                onError={(e) => {
                                  e.target.onerror = null
                                  e.target.style.display = 'none'
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
                                <span className="text-slate-500 text-xs">No photo</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900">{m.name}</span>
                                {!m.visible && (
                                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded">
                                    HIDDEN
                                  </span>
                                )}
                              </div>
                              {m.role && <p className="text-sm text-slate-600 truncate">{m.role}</p>}
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button 
                              type="button" 
                              onClick={() => openMemberEdit(m)} 
                              className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 transition-colors"
                              title="Edit member"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => deleteMember(m.id)} 
                              className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                              title="Delete member"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )
        })}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
            <button
              type="button"
              onClick={() => setOpenSection(openSection === 'audit' ? '' : 'audit')}
              className="flex-1 text-left"
            >
              <span className="font-semibold text-slate-900">Audit Reports</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); openAuditNew() }}
                className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
              >
                <FiPlus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpenSection(openSection === 'audit' ? '' : 'audit')}
                className="p-1"
              >
                {openSection === 'audit' ? <FiChevronDown className="w-5 h-5 text-slate-500" /> : <FiChevronRight className="w-5 h-5 text-slate-500" />}
              </button>
            </div>
          </div>
          {openSection === 'audit' && (
            <div className="px-4 pb-4 border-t border-slate-100">
              {data.auditReports.length === 0 ? (
                <p className="text-sm text-slate-500 py-4">No audit reports. Click + to add.</p>
              ) : (
                <ul className="space-y-2 mt-2">
                  {data.auditReports.map((a) => (
                    <li key={a.id} className="flex items-center justify-between py-3 px-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{a.title}</span>
                          {!a.visible && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded">
                              HIDDEN
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">FY {a.fiscalYear}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button 
                          type="button" 
                          onClick={() => openAuditEdit(a)} 
                          className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 transition-colors"
                          title="Edit audit report"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button 
                          type="button" 
                          onClick={() => deleteAudit(a.id)} 
                          className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                          title="Delete audit report"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section edit modal */}
      {sectionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-hidden flex items-center justify-center p-4 lg:p-6">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex-shrink-0 border-b border-slate-200 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Edit {SECTION_LABELS[sectionModal]}</h2>
              <button type="button" onClick={() => setSectionModal(null)} className="p-2 rounded-lg hover:bg-slate-100"><FiX className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
            <form onSubmit={saveSection} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
                <input
                  type="text"
                  value={sectionForm.title}
                  onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {(sectionModal === 'who_we_are' || sectionModal === 'why_dar_al_hikma') ? (
                <>
                  <div className="border-t border-slate-200 pt-6">
                    <h3 className="text-sm font-bold text-slate-800 mb-4">Hero Section</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Hero Style</label>
                        <select
                          value={sectionForm.content?.hero?.style || 'split'}
                          onChange={(e) => setSectionForm(f => ({
                            ...f,
                            content: { ...f.content, hero: { ...f.content?.hero, style: e.target.value } }
                          }))}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="split">Split (image left, text right)</option>
                          <option value="overlay">Overlay (full-width background image with centered text)</option>
                        </select>
                        <p className="text-xs text-slate-500 mt-1">Overlay = dramatic full-width hero like One Medical. Split = side-by-side layout.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Hero Image</label>
                        <div className="flex items-center gap-3">
                          {(sectionForm.content?.hero?.imageUrl) && (
                            <img src={sectionForm.content.hero.imageUrl} alt="Hero" className="w-24 h-24 object-cover rounded-lg border border-slate-200" />
                          )}
                          <label className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl cursor-pointer hover:bg-primary-700 text-sm font-semibold">
                            <FiUpload className="w-4 h-4" />
                            Upload
                            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                              const f = e.target.files?.[0]
                              if (f) {
                                const url = await uploadSectionImage(f)
                                setSectionForm(fm => ({
                                  ...fm,
                                  content: { ...fm.content, hero: { ...fm.content?.hero, imageUrl: url } }
                                }))
                              }
                            }} />
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Hero Label (optional)</label>
                        <input
                          type="text"
                          value={sectionForm.content?.hero?.label || ''}
                          onChange={(e) => setSectionForm(f => ({
                            ...f,
                            content: { ...f.content, hero: { ...f.content?.hero, label: e.target.value } }
                          }))}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                          placeholder="e.g. About us"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Hero Headline</label>
                        <input
                          type="text"
                          value={sectionForm.content?.hero?.headline || sectionForm.title}
                          onChange={(e) => setSectionForm(f => ({
                            ...f,
                            title: e.target.value,
                            content: { ...f.content, hero: { ...f.content?.hero, headline: e.target.value } }
                          }))}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                          placeholder="Main headline"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Intro / Description</label>
                        <textarea
                          rows={4}
                          value={sectionForm.content?.hero?.intro ?? sectionForm.description}
                          onChange={(e) => setSectionForm(f => ({
                            ...f,
                            description: e.target.value,
                            content: { ...f.content, hero: { ...f.content?.hero, intro: e.target.value } }
                          }))}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 resize-none"
                          placeholder="Intro paragraph (shown below hero for overlay style, beside headline for split)"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">CTA Button Text (optional)</label>
                          <input
                            type="text"
                            value={sectionForm.content?.hero?.ctaText || ''}
                            onChange={(e) => setSectionForm(f => ({
                              ...f,
                              content: { ...f.content, hero: { ...f.content?.hero, ctaText: e.target.value } }
                            }))}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                            placeholder="e.g. Learn more"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">CTA Button URL</label>
                          <input
                            type="text"
                            value={sectionForm.content?.hero?.ctaUrl || ''}
                            onChange={(e) => setSectionForm(f => ({
                              ...f,
                              content: { ...f.content, hero: { ...f.content?.hero, ctaUrl: e.target.value } }
                            }))}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                            placeholder="/donate or /contact"
                          />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={sectionForm.content?.hero?.showScrollIndicator !== false}
                          onChange={(e) => setSectionForm(f => ({
                            ...f,
                            content: { ...f.content, hero: { ...f.content?.hero, showScrollIndicator: e.target.checked } }
                          }))}
                          className="rounded border-slate-300"
                        />
                        <span className="font-semibold text-slate-700">Show scroll indicator (chevron) at bottom of hero</span>
                      </label>
                    </div>
                  </div>
                  <div className="border-t border-slate-200 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-slate-800">Content Blocks (alternating image + text)</h3>
                      <button type="button" onClick={addContentBlock} className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700">
                        + Add Block
                      </button>
                    </div>
                    <div className="space-y-6">
                      {(sectionForm.content?.blocks || []).map((block, idx) => (
                        <div key={idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-4">
                          <div className="flex justify-between">
                            <span className="text-sm font-semibold text-slate-700">Block {idx + 1}</span>
                            <button type="button" onClick={() => removeBlock(idx)} className="text-red-600 hover:text-red-700 text-sm font-semibold">Remove</button>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Image (optional)</label>
                            <div className="flex items-center gap-3">
                              {block.imageUrl && <img src={block.imageUrl} alt="" className="w-16 h-16 object-cover rounded-lg border" />}
                              <label className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg cursor-pointer text-sm font-semibold hover:bg-slate-50">
                                <FiUpload className="w-3.5 h-3.5" /> Upload
                                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                  const f = e.target.files?.[0]
                                  if (f) { updateBlock(idx, 'imageUrl', await uploadSectionImage(f)) }
                                }} />
                              </label>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Headline</label>
                            <input
                              type="text"
                              value={block.headline || ''}
                              onChange={(e) => updateBlock(idx, 'headline', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                              placeholder="Block headline"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Body text</label>
                            <textarea
                              rows={3}
                              value={block.body || ''}
                              onChange={(e) => updateBlock(idx, 'body', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none"
                              placeholder="Paragraph content"
                            />
                          </div>
                          {block.imageUrl && (
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={block.imageLeft !== false}
                                onChange={(e) => updateBlock(idx, 'imageLeft', e.target.checked)}
                                className="rounded border-slate-300"
                              />
                              <span className="font-semibold text-slate-700">Image on left</span>
                            </label>
                          )}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Learn more link text</label>
                              <input
                                type="text"
                                value={block.linkText || ''}
                                onChange={(e) => updateBlock(idx, 'linkText', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                placeholder="e.g. Leadership ›"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Link URL</label>
                              <input
                                type="text"
                                value={block.linkUrl || ''}
                                onChange={(e) => updateBlock(idx, 'linkUrl', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                placeholder="/about/our-council"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {(sectionForm.content?.blocks || []).length === 0 && (
                        <p className="text-sm text-slate-500 py-2">No blocks yet. Click &quot;Add Block&quot; to add content sections.</p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Description / Content</label>
                  <textarea
                    rows={6}
                    value={sectionForm.description}
                    onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setSectionModal(null)} className="px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700">Save</button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Member modal */}
      {memberModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-hidden flex items-center justify-center p-4 lg:p-6">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex-shrink-0 border-b border-slate-200 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{memberForm.id ? 'Edit Member' : 'Add Member'}</h2>
              <button type="button" onClick={() => setMemberModal(null)} className="p-2 rounded-lg hover:bg-slate-100"><FiX className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
            <form onSubmit={saveMember} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Type</label>
                <select
                  value={memberForm.memberType}
                  onChange={(e) => setMemberForm({ ...memberForm, memberType: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                >
                  <option value="council">Council</option>
                  <option value="advisory">Advisory Board</option>
                  <option value="legal_financial">Legal & Financial Team</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Role / Title</label>
                <input
                  type="text"
                  value={memberForm.role}
                  onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <textarea
                  rows={4}
                  value={memberForm.description}
                  onChange={(e) => setMemberForm({ ...memberForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Photo *</label>
                <div className="space-y-3">
                  {/* Photo Preview */}
                  {(memberForm.photoFile || memberForm.photoUrl) && (
                    <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <img 
                        src={memberForm.photoFile ? URL.createObjectURL(memberForm.photoFile) : memberForm.photoUrl} 
                        alt="Preview"
                        className="w-20 h-20 rounded-lg object-cover border-2 border-slate-300"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23e2e8f0" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="12" text-anchor="middle" dy=".3em" fill="%2364748b"%3EInvalid%3C/text%3E%3C/svg%3E'
                        }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">Photo ready</p>
                        <p className="text-xs text-slate-600">
                          {memberForm.photoFile ? memberForm.photoFile.name : 'From URL'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMemberForm({ ...memberForm, photoFile: null, photoUrl: '' })}
                        className="px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  
                  {/* Upload Button */}
                  <label className="flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl cursor-pointer hover:bg-primary-700 transition-colors w-full">
                    <FiUpload className="w-5 h-5" />
                    <span className="font-semibold">Upload Photo</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error('Photo must be less than 5MB')
                            return
                          }
                          setMemberForm({ ...memberForm, photoFile: file, photoUrl: '' })
                        }
                      }}
                    />
                  </label>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-300"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-white text-slate-500 font-medium">OR</span>
                    </div>
                  </div>
                  
                  {/* URL Input */}
                  <input
                    type="url"
                    value={memberForm.photoUrl}
                    onChange={(e) => setMemberForm({ ...memberForm, photoUrl: e.target.value, photoFile: null })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Paste image URL (https://...)"
                  />
                  <p className="text-xs text-slate-500">
                    <strong>Required:</strong> Upload a photo or provide an image URL. Max 5MB. JPG, PNG, WEBP
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Display order</label>
                  <input
                    type="number"
                    value={memberForm.displayOrder}
                    onChange={(e) => setMemberForm({ ...memberForm, displayOrder: parseInt(e.target.value, 10) || 0 })}
                    className="w-24 px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={memberForm.visible}
                    onChange={(e) => setMemberForm({ ...memberForm, visible: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded border-slate-300"
                  />
                  <span className="text-sm font-semibold text-slate-700">Visible on user site</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setMemberModal(null)} className="px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700">Save</button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Audit report modal */}
      {auditModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-hidden flex items-center justify-center p-4 lg:p-6">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex-shrink-0 border-b border-slate-200 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{auditForm.id ? 'Edit Audit Report' : 'Add Audit Report'}</h2>
              <button type="button" onClick={() => setAuditModal(null)} className="p-2 rounded-lg hover:bg-slate-100"><FiX className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
            <form onSubmit={saveAudit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Title *</label>
                <input
                  type="text"
                  value={auditForm.title}
                  onChange={(e) => setAuditForm({ ...auditForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Fiscal Year *</label>
                <input
                  type="text"
                  value={auditForm.fiscalYear}
                  onChange={(e) => setAuditForm({ ...auditForm, fiscalYear: e.target.value })}
                  placeholder="e.g. 23-24"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">PDF File *</label>
                <div className="space-y-3">
                  {/* File Preview */}
                  {(auditForm.file || auditForm.fileUrl) && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-red-600 font-bold text-xs">PDF</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">PDF ready</p>
                        <p className="text-xs text-slate-600 truncate">
                          {auditForm.file ? auditForm.file.name : auditForm.fileUrl}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAuditForm({ ...auditForm, file: null, fileUrl: '' })}
                        className="px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  
                  {/* Upload Button */}
                  <label className="flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl cursor-pointer hover:bg-primary-700 transition-colors w-full">
                    <FiUpload className="w-5 h-5" />
                    <span className="font-semibold">Upload PDF</span>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            toast.error('PDF must be less than 10MB')
                            return
                          }
                          setAuditForm({ ...auditForm, file, fileUrl: '' })
                        }
                      }}
                    />
                  </label>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-300"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-white text-slate-500 font-medium">OR</span>
                    </div>
                  </div>
                  
                  {/* URL Input */}
                  <input
                    type="url"
                    value={auditForm.fileUrl}
                    onChange={(e) => setAuditForm({ ...auditForm, fileUrl: e.target.value, file: null })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Paste PDF URL (https://...)"
                  />
                  <p className="text-xs text-slate-500">
                    <strong>Required:</strong> Upload a PDF or provide a PDF URL. Max 10MB.
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <textarea
                  rows={2}
                  value={auditForm.description}
                  onChange={(e) => setAuditForm({ ...auditForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Display order</label>
                  <input
                    type="number"
                    value={auditForm.displayOrder}
                    onChange={(e) => setAuditForm({ ...auditForm, displayOrder: parseInt(e.target.value, 10) || 0 })}
                    className="w-24 px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={auditForm.visible}
                    onChange={(e) => setAuditForm({ ...auditForm, visible: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded border-slate-300"
                  />
                  <span className="text-sm font-semibold text-slate-700">Visible on user site</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setAuditModal(null)} className="px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700">Save</button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
