import { useState, useEffect } from 'react'
import api from '../services/api'
import { FiImage, FiVideo, FiFile, FiX, FiDownload, FiGrid, FiZoomIn } from 'react-icons/fi'

export default function Gallery() {
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    fetchMedia()
  }, [selectedCategory])

  const fetchMedia = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('approved', 'true')
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }
      
      const { data } = await api.get(`/media?${params.toString()}`)
      setMedia(data.media)
    } catch (error) {
      console.error('Failed to fetch media:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    { value: 'all', label: 'All Media' },
    { value: 'gallery', label: 'Photos' },
    { value: 'project', label: 'Projects' },
    { value: 'event', label: 'Events' },
    { value: 'news', label: 'News' }
  ]

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* --- HERO SECTION --- */}
      <section className="bg-white pt-24 pb-12 border-b border-slate-200 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-40 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]"></div>
        </div>

        <div className="container-custom px-4 sm:px-6 lg:px-8 relative z-10 text-center max-w-4xl mx-auto">
          <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-primary-50 text-primary-700 text-xs font-bold tracking-widest uppercase mb-5 border border-primary-100">
            <FiGrid className="w-3 h-3" /> Visual Stories
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Our Impact in <span className="text-primary-600">Action</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto">
            Explore moments of change, community gatherings, and the progress of our initiatives through photos and videos.
          </p>
        </div>
      </section>

      {/* --- FILTERS & GALLERY --- */}
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="container-custom px-4 sm:px-6 lg:px-8">
          
          {/* Category Tabs */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto max-w-full">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                    selectedCategory === cat.value
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Gallery Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="aspect-[4/3] bg-white border border-slate-200 rounded-2xl animate-pulse shadow-sm"></div>
              ))}
            </div>
          ) : media.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
                <FiImage className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No media found</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                We couldn't find any items in this category. Try switching filters or check back later.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {media.map((item) => (
                <div
                  key={item._id || item.id}
                  className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-white border border-slate-200 cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
                  onClick={() => setSelectedItem(item)}
                >
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={item.title || 'Gallery image'}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400?text=Image+Error'
                      }}
                      loading="lazy"
                    />
                  ) : item.type === 'video' ? (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center relative group-hover:bg-slate-800 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                         <FiVideo className="text-white text-2xl ml-1" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-white text-xs font-medium truncate">{item.title || 'Video'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center p-6 text-center group-hover:bg-white transition-colors">
                      <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <FiFile className="text-2xl" />
                      </div>
                      <p className="text-sm font-bold text-slate-900 line-clamp-2 leading-tight">
                        {item.title || 'Document'}
                      </p>
                      <span className="text-xs text-slate-500 mt-2 font-medium uppercase tracking-wide">Download</span>
                    </div>
                  )}
                  
                  {/* Hover Overlay Icon */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white transform scale-75 group-hover:scale-100 transition-transform">
                       <FiZoomIn size={24} />
                    </div>
                  </div>

                  {/* Type Badge */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                    <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                      {item.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* --- LIGHTBOX MODAL --- */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm absolute top-0 left-0 right-0 z-10">
              <div className="flex-1 min-w-0 mr-4">
                 <h3 className="text-white font-bold text-lg truncate">{selectedItem.title || 'Media Viewer'}</h3>
                 {selectedItem.description && <p className="text-slate-400 text-xs truncate">{selectedItem.description}</p>}
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Media Content */}
            <div className="flex-1 bg-black flex items-center justify-center overflow-hidden relative">
              {selectedItem.type === 'image' ? (
                <img
                  src={selectedItem.url}
                  alt={selectedItem.title}
                  className="w-full h-full object-contain max-h-[80vh]"
                />
              ) : selectedItem.type === 'video' ? (
                <video
                  src={selectedItem.url}
                  controls
                  autoPlay
                  className="w-full h-full max-h-[80vh] object-contain"
                />
              ) : (
                <div className="p-12 text-center bg-white rounded-xl max-w-sm">
                  <div className="w-20 h-20 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiFile size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{selectedItem.title || 'Document'}</h3>
                  <p className="text-slate-500 mb-8 text-sm">This file cannot be previewed directly.</p>
                  <a
                    href={selectedItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors w-full justify-center"
                  >
                    <FiDownload /> Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}