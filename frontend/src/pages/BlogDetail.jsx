import { Helmet } from "react-helmet-async"
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../services/api'
import { FiCalendar, FiArrowLeft, FiClock, FiTag, FiShare2 } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function BlogDetail() {
  const { slug } = useParams()
  const [blog, setBlog] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true)
        const { data } = await api.get(`/blogs/${slug}`)
        setBlog(data.blog || data)
      } catch (error) {
        toast.error("Article not found")
      } finally {
        setLoading(false)
      }
    }
    fetchBlog()
    window.scrollTo(0, 0)
  }, [slug])

  if (loading) return <LoadingSpinner />
  if (!blog) return <NotFound />

  return (
    <div className="bg-white min-h-screen">
      <Helmet>
        <title>{blog?.title ?? 'Blog'} | Dar Al Hikma Trust</title>
        <meta name="description" content={blog?.excerpt ?? blog?.description?.substring(0, 160) ?? 'Read our latest insights.'} />
        <link rel="canonical" href={`https://daralhikma.org.in/blogs/${slug}`} />
      </Helmet>
      {/* 1. DISCREET FLOATING NAV */}
      <nav className="fixed top-6 left-6 z-50">
        <Link 
          to="/blogs" 
          className="bg-white/90 backdrop-blur-md border border-slate-200 shadow-sm rounded-full p-3 flex items-center justify-center text-slate-900 hover:text-primary-600 hover:scale-110 transition-all"
          title="Back to Insights"
        >
          <FiArrowLeft size={20} />
        </Link>
      </nav>

      <div className="fixed top-6 right-6 z-50">
        <button 
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Link copied");
          }}
          className="bg-white/90 backdrop-blur-md border border-slate-200 shadow-sm rounded-full p-3 flex items-center justify-center text-slate-900 hover:text-primary-600 hover:scale-110 transition-all"
        >
          <FiShare2 size={20} />
        </button>
      </div>

      {/* 2. HERO SECTION - STARTING FROM TOP */}
      <header className="relative w-full pt-20 pb-16 md:pt-32 md:pb-24 px-4 bg-[#F8FAFC] border-b border-slate-100">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center gap-3 mb-6">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
              {blog.category || 'Opinion'}
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight mb-10">
            {blog.title}
          </h1>

          <div className="flex items-center justify-center gap-6 text-slate-500 text-[10px] font-bold uppercase tracking-[0.15em]">
            <div className="flex items-center gap-2">
              <FiCalendar className="text-primary-500" size={14} />
              <span>{new Date(blog.date).toLocaleDateString('en-GB', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <div className="flex items-center gap-2">
              <FiClock className="text-primary-500" size={14} />
              <span>6 min read</span>
            </div>
          </div>
        </div>
      </header>

      {/* 3. FEATURED IMAGE - OVERLAPPING STYLE */}
      <div className="container-custom px-4 -mt-10 md:-mt-14 mb-20">
        <div className="max-w-5xl mx-auto">
          <div className="relative aspect-[21/9] rounded-3xl md:rounded-[3rem] overflow-hidden shadow-2xl border-[6px] md:border-[12px] border-white bg-white">
            <img 
              src={blog.featuredImage} 
              className="w-full h-full object-cover" 
              alt={blog.title} 
            />
          </div>
        </div>
      </div>

      {/* 4. CONTENT AREA */}
      <article className="container-custom px-4 relative">
        <div className="max-w-2xl mx-auto">
          {/* Subtle Author Attribution */}
          <div className="flex items-center gap-3 mb-16 pb-8 border-b border-slate-100">
             <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-sm">
                {blog.author?.charAt(0) || 'D'}
             </div>
             <div className="text-xs">
                <p className="font-bold text-slate-900 leading-tight">Written by {blog.author || 'Dar Al Hikma'}</p>
                <p className="text-slate-400">Contributor</p>
             </div>
          </div>

          {/* Body Content */}
          <div 
            className="prose prose-neutral prose-lg max-w-none
              prose-p:text-slate-600 prose-p:leading-[1.9] prose-p:mb-10 prose-p:text-[1.15rem]
              prose-headings:text-slate-900 prose-headings:font-black prose-headings:tracking-tight prose-headings:mt-16
              prose-strong:text-slate-900 prose-strong:font-bold
              prose-blockquote:not-italic prose-blockquote:text-slate-700 prose-blockquote:border-l-4 prose-blockquote:border-primary-600 prose-blockquote:bg-slate-50 prose-blockquote:p-8 prose-blockquote:rounded-r-3xl
              prose-img:rounded-3xl prose-img:shadow-xl prose-img:my-16
              prose-li:text-slate-600 prose-li:mb-2"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

          {/* Footer Metadata */}
          <div className="mt-24 pt-10 border-t border-slate-100 flex items-center justify-between">
             <div className="flex items-center gap-2">
                <FiTag className="text-primary-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category:</span>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-widest">{blog.category}</span>
             </div>
             
             <Link to="/blogs" className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">
                <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Insights
             </Link>
          </div>
        </div>
      </article>

      {/* 5. MINIMAL NEWSLETTER CTA */}
      <footer className="mt-40 bg-slate-50 py-24">
        <div className="max-w-xl mx-auto px-6 text-center">
           <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 tracking-tight">Stay Informed.</h3>
           <p className="text-slate-500 mb-10 text-sm leading-relaxed">Weekly reflections on community, wisdom, and the impact of our collective actions.</p>
           <form className="flex flex-col sm:flex-row gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
              <input type="email" placeholder="Enter your email" className="flex-1 px-4 py-3 text-sm outline-none bg-transparent" />
              <button className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-primary-600 transition-colors">Subscribe</button>
           </form>
        </div>
      </footer>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div className="h-screen flex items-center justify-center bg-white">
       <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
}

function NotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center text-center px-4 bg-white">
       <h2 className="text-6xl font-black text-slate-100 mb-2 tracking-tighter uppercase">Oops</h2>
       <p className="text-slate-500 mb-8 font-medium">This article has left the building.</p>
       <Link to="/blogs" className="bg-slate-900 text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-transform hover:scale-105 shadow-lg">Return to Insights</Link>
    </div>
  )
}