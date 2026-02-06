// import { useEffect, useMemo, useState } from 'react'
// import api from '../../services/api'
// import toast from 'react-hot-toast'
// import { FiImage, FiPlus, FiSave, FiTrash2, FiUpload } from 'react-icons/fi'

// export default function SiteAssets() {
//   const [loading, setLoading] = useState(true)
//   const [saving, setSaving] = useState(false)
//   const [uploadingQr, setUploadingQr] = useState(false)
//   const [uploadingSlides, setUploadingSlides] = useState(false)

//   const [assets, setAssets] = useState({
//     donationQrUrl: '',
//     homeSlider: [],
//     eventsPage: { heroSubtitle: '', heroImageUrl: '' }
//   })

//   const sliderCount = assets?.homeSlider?.length || 0
//   const hasQr = Boolean(assets?.donationQrUrl)

//   useEffect(() => {
//     fetchAssets()
//   }, [])

//   const fetchAssets = async () => {
//     try {
//       setLoading(true)
//       const { data } = await api.get('/admin/content/assets')
//       if (data?.assets) setAssets(data.assets)
//     } catch (e) {
//       toast.error('Failed to load site assets')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const saveAssets = async (nextAssets) => {
//     try {
//       setSaving(true)
//       const { data } = await api.put('/admin/content/assets', nextAssets)
//       setAssets(data?.assets || nextAssets)
//       toast.success('Saved')
//     } catch (e) {
//       toast.error('Failed to save')
//     } finally {
//       setSaving(false)
//     }
//   }

//   const handleUploadQr = async (file) => {
//     if (!file) return
//     try {
//       setUploadingQr(true)
//       const fd = new FormData()
//       fd.append('file', file)
//       const { data } = await api.post('/admin/content/assets/qr', fd, {
//         headers: { 'Content-Type': 'multipart/form-data' }
//       })
//       if (data?.assets) {
//         setAssets(data.assets)
//         toast.success('QR updated')
//       } else if (data?.url) {
//         const next = { ...assets, donationQrUrl: data.url }
//         setAssets(next)
//         toast.success('QR uploaded')
//       }
//     } catch (e) {
//       toast.error(e.response?.data?.message || 'QR upload failed')
//     } finally {
//       setUploadingQr(false)
//     }
//   }

//   const handleUploadSlides = async (files, { replace } = {}) => {
//     const list = Array.from(files || []).filter(Boolean)
//     if (!list.length) return
//     try {
//       setUploadingSlides(true)
//       const fd = new FormData()
//       list.forEach((f) => fd.append('files', f))
//       const { data } = await api.post(`/admin/content/assets/home-slider?replace=${replace ? 'true' : 'false'}`, fd, {
//         headers: { 'Content-Type': 'multipart/form-data' }
//       })
//       if (data?.assets) {
//         setAssets(data.assets)
//         toast.success('Slider updated')
//       } else {
//         toast.success('Uploaded')
//       }
//     } catch (e) {
//       toast.error(e.response?.data?.message || 'Slider upload failed')
//     } finally {
//       setUploadingSlides(false)
//     }
//   }

//   const removeSlide = (idx) => {
//     const next = {
//       ...assets,
//       homeSlider: assets.homeSlider.filter((_, i) => i !== idx)
//     }
//     setAssets(next)
//   }

//   const setSlideTitle = (idx, title) => {
//     const next = {
//       ...assets,
//       homeSlider: assets.homeSlider.map((s, i) => (i === idx ? { ...s, title } : s))
//     }
//     setAssets(next)
//   }

//   const setSlideLinkUrl = (idx, linkUrl) => {
//     const next = {
//       ...assets,
//       homeSlider: assets.homeSlider.map((s, i) => (i === idx ? { ...s, linkUrl: linkUrl || null } : s))
//     }
//     setAssets(next)
//   }

//   const eventsPage = assets?.eventsPage || { heroSubtitle: '', heroImageUrl: '' }
//   const handleUploadEventsHero = async (file) => {
//     if (!file) return
//     try {
//       setUploadingEventsHero(true)
//       const fd = new FormData()
//       fd.append('file', file)
//       const { data } = await api.post('/admin/content/assets/events-hero', fd, {
//         headers: { 'Content-Type': 'multipart/form-data' }
//       })
//       if (data?.assets) setAssets(data.assets)
//       toast.success('Events hero image uploaded')
//     } catch (e) {
//       toast.error(e.response?.data?.message || 'Upload failed')
//     } finally {
//       setUploadingEventsHero(false)
//     }
//   }

//   if (loading) {
//     return (
//       <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
//         <div className="spinner mx-auto mb-4"></div>
//         <p className="text-slate-600">Loading site assets…</p>
//       </div>
//     )
//   }

//   return (
//     <div className="mt-0">
//       <div className="mb-6">
//         <h1 className="text-3xl font-bold text-slate-900 mb-2">Site Assets</h1>
//         <p className="text-slate-600">Manage all site content visible to users</p>
//       </div>

//       {/* Donation QR & Home Slider - horizontal layout */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
//         {/* Donation QR - horizontal card */}
//         <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row gap-6 items-start">
//           <div className="flex-shrink-0 w-full sm:w-48 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center min-h-[200px] overflow-hidden">
//             {hasQr ? (
//               <img src={assets.donationQrUrl} alt="Donation QR" className="max-h-[200px] w-auto object-contain" />
//             ) : (
//               <div className="text-center text-slate-500 p-4">
//                 <p className="font-semibold text-sm">No QR yet</p>
//                 <p className="text-xs mt-1">Upload below</p>
//               </div>
//             )}
//           </div>
//           <div className="flex-1 min-w-0">
//             <div className="flex items-center gap-3 mb-3">
//               <div className="w-10 h-10 rounded-lg bg-slate-700 text-white grid place-items-center">
//                 <FiImage className="w-5 h-5" />
//               </div>
//               <div>
//                 <p className="font-bold text-slate-900">Donation QR</p>
//                 <p className="text-sm text-slate-600">{hasQr ? 'Currently set' : 'Not set yet'}</p>
//               </div>
//             </div>
//             <label className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-sm">
//               <FiUpload className="w-4 h-4" />
//               {uploadingQr ? 'Uploading…' : 'Upload QR'}
//               <input
//                 type="file"
//                 accept="image/*"
//                 className="hidden"
//                 disabled={uploadingQr}
//                 onChange={(e) => handleUploadQr(e.target.files?.[0])}
//               />
//             </label>
//             <p className="text-xs text-slate-500 mt-2">Shown on Donation pages. Max 5MB.</p>
//           </div>
//         </div>

//         {/* Home Slider - horizontal card */}
//         <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row gap-6 items-start">
//           <div className="flex-shrink-0 w-full sm:w-48 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden min-h-[200px] flex items-center justify-center">
//             {sliderCount > 0 ? (
//               <img src={assets.homeSlider[0]?.url} alt="Slider preview" className="w-full h-[200px] object-cover" />
//             ) : (
//               <div className="text-center text-slate-500 p-4">
//                 <p className="font-semibold text-sm">No slides yet</p>
//                 <p className="text-xs mt-1">Add or replace below</p>
//               </div>
//             )}
//           </div>
//           <div className="flex-1 min-w-0">
//             <div className="flex items-center gap-3 mb-3">
//               <div className="w-10 h-10 rounded-lg bg-primary-600 text-white grid place-items-center">
//                 <FiImage className="w-5 h-5" />
//               </div>
//               <div>
//                 <p className="font-bold text-slate-900">Home Slider</p>
//                 <p className="text-sm text-slate-600">{sliderCount} image(s)</p>
//               </div>
//             </div>
//             <div className="flex flex-wrap gap-2">
//               <label className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-sm">
//                 <FiPlus className="w-4 h-4" />
//                 {uploadingSlides ? 'Uploading…' : 'Add'}
//                 <input
//                   type="file"
//                   accept="image/*"
//                   multiple
//                   className="hidden"
//                   disabled={uploadingSlides}
//                   onChange={(e) => handleUploadSlides(e.target.files, { replace: false })}
//                 />
//               </label>
//               <label className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-sm">
//                 <FiUpload className="w-4 h-4" />
//                 Replace all
//                 <input
//                   type="file"
//                   accept="image/*"
//                   multiple
//                   className="hidden"
//                   disabled={uploadingSlides}
//                   onChange={(e) => handleUploadSlides(e.target.files, { replace: true })}
//                 />
//               </label>
//             </div>
//             <p className="text-xs text-slate-500 mt-2">Hero section on Home page.</p>
//           </div>
//         </div>
//       </div>

//       {/* Events Page Hero */}
//       <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
//         <h2 className="text-lg font-bold text-slate-900 mb-4">Events Page Hero</h2>
//         <div className="grid md:grid-cols-2 gap-6">
//           <div>
//             <label className="block text-sm font-semibold text-slate-700 mb-2">Hero Subtitle</label>
//             <textarea
//               rows={2}
//               className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
//               value={eventsPage.heroSubtitle || ''}
//               onChange={(e) =>
//                 setAssets({
//                   ...assets,
//                   eventsPage: { ...eventsPage, heroSubtitle: e.target.value }
//                 })
//               }
//               placeholder="Subtitle shown below the Events & Admission Sessions title"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-semibold text-slate-700 mb-2">Right-side Hero Image</label>
//             <div className="flex items-start gap-4">
//               {eventsPage.heroImageUrl ? (
//                 <img src={eventsPage.heroImageUrl} alt="Events hero" className="w-24 h-24 object-cover rounded-lg border border-slate-200" />
//               ) : (
//                 <div className="w-24 h-24 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">No image</div>
//               )}
//               <label className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 cursor-pointer text-sm">
//                 <FiUpload className="w-4 h-4" />
//                 {uploadingEventsHero ? 'Uploading…' : 'Upload'}
//                 <input type="file" accept="image/*" className="hidden" disabled={uploadingEventsHero} onChange={(e) => handleUploadEventsHero(e.target.files?.[0])} />
//               </label>
//             </div>
//             <p className="text-xs text-slate-500 mt-2">Shown on right side of Events hero banner.</p>
//           </div>
//         </div>
//         <div className="mt-4 flex justify-end">
//           <button type="button" className="px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700" disabled={saving} onClick={() => saveAssets(assets)}>
//             <FiSave className="w-4 h-4 inline mr-2" />
//             {saving ? 'Saving…' : 'Save'}
//           </button>
//         </div>
//       </div>

//       {/* Slider items list (when has slides) */}
//       {sliderCount > 0 && (
//         <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
//           <h2 className="text-lg font-bold text-slate-900 mb-4">Slider items</h2>
//           <div className="space-y-4">
//             {assets.homeSlider.map((s, idx) => (
//               <div key={s.url + idx} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
//                 <div className="flex-shrink-0 w-full sm:w-36 rounded-lg overflow-hidden bg-slate-200 border border-slate-200">
//                   <img src={s.url} alt={`Slide ${idx + 1}`} className="w-full h-28 object-cover" />
//                 </div>
//                 <div className="flex-1 min-w-0 space-y-2">
//                   <input
//                     className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
//                     value={s.title || ''}
//                     onChange={(e) => setSlideTitle(idx, e.target.value)}
//                     placeholder="Heading (optional)"
//                   />
//                   <input
//                     className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
//                     type="text"
//                     value={s.linkUrl || ''}
//                     onChange={(e) => setSlideLinkUrl(idx, e.target.value)}
//                     placeholder="Link URL (optional)"
//                   />
//                   <div className="flex items-center justify-between">
//                     <span className="text-xs text-slate-500 truncate max-w-[200px]">{s.url}</span>
//                     <button
//                       type="button"
//                       className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 font-semibold rounded-lg hover:bg-red-100 text-sm flex items-center gap-1"
//                       onClick={() => removeSlide(idx)}
//                     >
//                       <FiTrash2 className="w-4 h-4" /> Remove
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//             <div className="flex justify-end pt-2">
//               <button
//                 type="button"
//                 className="px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50"
//                 disabled={saving}
//                 onClick={() => saveAssets(assets)}
//               >
//                 <FiSave className="w-4 h-4" />
//                 {saving ? 'Saving…' : 'Save order'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiImage, FiPlus, FiSave, FiTrash2, FiUpload } from 'react-icons/fi'

export default function SiteAssets() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingQr, setUploadingQr] = useState(false)
  const [uploadingSlides, setUploadingSlides] = useState(false)
  // 🔥 FIX: Added the missing state variable
  const [uploadingEventsHero, setUploadingEventsHero] = useState(false)

  const [assets, setAssets] = useState({
    donationQrUrl: '',
    homeSlider: [],
    eventsPage: { heroSubtitle: '', heroImageUrl: '' }
  })

  // 🚀 PERFORMANCE FIX: Warm up the Render backend immediately when this page loads
  useEffect(() => {
    const warmUp = async () => {
      try {
        await api.get('/health')
        console.log("Backend warmed up")
      } catch (e) {
        console.log("Warm up ping failed")
      }
    }
    warmUp()
    fetchAssets()
  }, [])

  const sliderCount = assets?.homeSlider?.length || 0
  const hasQr = Boolean(assets?.donationQrUrl)

  const fetchAssets = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/admin/content/assets')
      if (data?.assets) setAssets(data.assets)
    } catch (e) {
      toast.error('Failed to load site assets')
    } finally {
      setLoading(false)
    }
  }

  const saveAssets = async (nextAssets) => {
    try {
      setSaving(true)
      const { data } = await api.put('/admin/content/assets', nextAssets)
      setAssets(data?.assets || nextAssets)
      toast.success('Saved')
    } catch (e) {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleUploadQr = async (file) => {
    if (!file) return
    try {
      setUploadingQr(true)
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await api.post('/admin/content/assets/qr', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (data?.assets) {
        setAssets(data.assets)
        toast.success('QR updated')
      } else if (data?.url) {
        const next = { ...assets, donationQrUrl: data.url }
        setAssets(next)
        toast.success('QR uploaded')
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'QR upload failed')
    } finally {
      setUploadingQr(false)
    }
  }

  const handleUploadSlides = async (files, { replace } = {}) => {
    const list = Array.from(files || []).filter(Boolean)
    if (!list.length) return
    try {
      setUploadingSlides(true)
      const fd = new FormData()
      list.forEach((f) => fd.append('files', f))
      const { data } = await api.post(`/admin/content/assets/home-slider?replace=${replace ? 'true' : 'false'}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (data?.assets) {
        setAssets(data.assets)
        toast.success('Slider updated')
      } else {
        toast.success('Uploaded')
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Slider upload failed')
    } finally {
      setUploadingSlides(false)
    }
  }

  const removeSlide = (idx) => {
    const next = {
      ...assets,
      homeSlider: assets.homeSlider.filter((_, i) => i !== idx)
    }
    setAssets(next)
  }

  const setSlideTitle = (idx, title) => {
    const next = {
      ...assets,
      homeSlider: assets.homeSlider.map((s, i) => (i === idx ? { ...s, title } : s))
    }
    setAssets(next)
  }

  const setSlideLinkUrl = (idx, linkUrl) => {
    const next = {
      ...assets,
      homeSlider: assets.homeSlider.map((s, i) => (i === idx ? { ...s, linkUrl: linkUrl || null } : s))
    }
    setAssets(next)
  }

  const eventsPage = assets?.eventsPage || { heroSubtitle: '', heroImageUrl: '' }
  
  const handleUploadEventsHero = async (file) => {
    if (!file) return
    try {
      setUploadingEventsHero(true) // 🔥 Now works because state is defined above
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await api.post('/admin/content/assets/events-hero', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (data?.assets) setAssets(data.assets)
      toast.success('Events hero image uploaded')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Upload failed')
    } finally {
      setUploadingEventsHero(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-slate-600">Loading site assets…</p>
      </div>
    )
  }

  return (
    <div className="mt-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Site Assets</h1>
        <p className="text-slate-600">Manage all site content visible to users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Donation QR */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row gap-6 items-start">
          <div className="flex-shrink-0 w-full sm:w-48 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center min-h-[200px] overflow-hidden">
            {hasQr ? (
              <img src={assets.donationQrUrl} alt="Donation QR" className="max-h-[200px] w-auto object-contain" />
            ) : (
              <div className="text-center text-slate-500 p-4">
                <p className="font-semibold text-sm">No QR yet</p>
                <p className="text-xs mt-1">Upload below</p>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-slate-700 text-white grid place-items-center">
                <FiImage className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Donation QR</p>
                <p className="text-sm text-slate-600">{hasQr ? 'Currently set' : 'Not set yet'}</p>
              </div>
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-sm">
              <FiUpload className="w-4 h-4" />
              {uploadingQr ? 'Uploading…' : 'Upload QR'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingQr}
                onChange={(e) => handleUploadQr(e.target.files?.[0])}
              />
            </label>
            <p className="text-xs text-slate-500 mt-2">Shown on Donation pages. Max 5MB.</p>
          </div>
        </div>

        {/* Home Slider */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row gap-6 items-start">
          <div className="flex-shrink-0 w-full sm:w-48 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden min-h-[200px] flex items-center justify-center">
            {sliderCount > 0 ? (
              <img src={assets.homeSlider[0]?.url} alt="Slider preview" className="w-full h-[200px] object-cover" />
            ) : (
              <div className="text-center text-slate-500 p-4">
                <p className="font-semibold text-sm">No slides yet</p>
                <p className="text-xs mt-1">Add or replace below</p>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary-600 text-white grid place-items-center">
                <FiImage className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Home Slider</p>
                <p className="text-sm text-slate-600">{sliderCount} image(s)</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-sm">
                <FiPlus className="w-4 h-4" />
                {uploadingSlides ? 'Uploading…' : 'Add'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={uploadingSlides}
                  onChange={(e) => handleUploadSlides(e.target.files, { replace: false })}
                />
              </label>
              <label className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-sm">
                <FiUpload className="w-4 h-4" />
                Replace all
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={uploadingSlides}
                  onChange={(e) => handleUploadSlides(e.target.files, { replace: true })}
                />
              </label>
            </div>
            <p className="text-xs text-slate-500 mt-2">Hero section on Home page.</p>
          </div>
        </div>
      </div>

      {/* Events Page Hero */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Events Page Hero</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Hero Subtitle</label>
            <textarea
              rows={2}
              className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              value={eventsPage.heroSubtitle || ''}
              onChange={(e) =>
                setAssets({
                  ...assets,
                  eventsPage: { ...eventsPage, heroSubtitle: e.target.value }
                })
              }
              placeholder="Subtitle shown below the Events & Admission Sessions title"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Right-side Hero Image</label>
            <div className="flex items-start gap-4">
              {eventsPage.heroImageUrl ? (
                <img src={eventsPage.heroImageUrl} alt="Events hero" className="w-24 h-24 object-cover rounded-lg border border-slate-200" />
              ) : (
                <div className="w-24 h-24 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">No image</div>
              )}
              <label className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 cursor-pointer text-sm">
                <FiUpload className="w-4 h-4" />
                {uploadingEventsHero ? 'Uploading…' : 'Upload'}
                <input type="file" accept="image/*" className="hidden" disabled={uploadingEventsHero} onChange={(e) => handleUploadEventsHero(e.target.files?.[0])} />
              </label>
            </div>
            <p className="text-xs text-slate-500 mt-2">Shown on right side of Events hero banner.</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button type="button" className="px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700" disabled={saving} onClick={() => saveAssets(assets)}>
            <FiSave className="w-4 h-4 inline mr-2" />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Slider items list */}
      {sliderCount > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Slider items</h2>
          <div className="space-y-4">
            {assets.homeSlider.map((s, idx) => (
              <div key={s.url + idx} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="flex-shrink-0 w-full sm:w-36 rounded-lg overflow-hidden bg-slate-200 border border-slate-200">
                  <img src={s.url} alt={`Slide ${idx + 1}`} className="w-full h-28 object-cover" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <input
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    value={s.title || ''}
                    onChange={(e) => setSlideTitle(idx, e.target.value)}
                    placeholder="Heading (optional)"
                  />
                  <input
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    type="text"
                    value={s.linkUrl || ''}
                    onChange={(e) => setSlideLinkUrl(idx, e.target.value)}
                    placeholder="Link URL (optional)"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 truncate max-w-[200px]">{s.url}</span>
                    <button
                      type="button"
                      className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 font-semibold rounded-lg hover:bg-red-100 text-sm flex items-center gap-1"
                      onClick={() => removeSlide(idx)}
                    >
                      <FiTrash2 className="w-4 h-4" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                className="px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                disabled={saving}
                onClick={() => saveAssets(assets)}
              >
                <FiSave className="w-4 h-4" />
                {saving ? 'Saving…' : 'Save order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}