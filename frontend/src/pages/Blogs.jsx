import { Helmet } from "react-helmet-async";
<Helmet>
  <title>Latest Blogs & Insights | Dar Al Hikma Trust</title>
  <meta name="description" content="Read the latest articles on charity, Islamic welfare, and community development from the Dar Al Hikma team." />
  <link rel="canonical" href="https://daralhikma.org.in/blogs" />
</Helmet>

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import api from '../services/api'
import { FiSearch, FiArrowRight } from 'react-icons/fi'

export default function Blogs() {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true)
        const { data } = await api.get('/blogs')
        setBlogs(data.blogs || [])
      } catch {
        setBlogs([])
      } finally {
        setLoading(false)
      }
    }
    fetchBlogs()
  }, [])

  const filteredBlogs = searchQuery.trim()
    ? blogs.filter(
        (b) =>
          b.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.content?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : blogs

  return (
    <div>
      {/* Hero Section with Search */}
      <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="container-custom px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-sm font-semibold text-primary-600 tracking-wide uppercase mb-2">Blog</p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Discover our latest news
            </h1>
            <p className="text-lg text-slate-600 mb-8">
              Reflections, stories, and updates from Dar Al Hikma Trust. Stay informed about our impact and initiatives.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
              <div className="relative flex-1">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-slate-900 placeholder-slate-400"
                />
              </div>
              <button
                type="button"
                className="px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
              >
                <FiSearch className="w-5 h-5" />
                Find Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content: Full Width 3-Column Grid */}
      <section className="py-12 md:py-16 lg:py-20 bg-white">
        <div className="container-custom px-4 sm:px-6 lg:px-8">
          <div className="w-full">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8">
              {searchQuery ? `Search results for "${searchQuery}"` : 'Latest Articles'}
            </h2>
            
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="rounded-2xl overflow-hidden border border-slate-200 animate-pulse">
                    <div className="aspect-video bg-slate-200" />
                    <div className="p-6 space-y-3">
                      <div className="h-4 bg-slate-200 rounded w-1/4" />
                      <div className="h-6 bg-slate-200 rounded w-3/4" />
                      <div className="h-4 bg-slate-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredBlogs.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-2">No articles found</h3>
                <p className="text-slate-600 max-w-md mx-auto">
                  {searchQuery ? 'Try a different search term.' : 'New articles will appear here once published.'}
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {filteredBlogs.map((post) => (
                  <Link
                    key={post.id}
                    to={`/blogs/${post.url || post.id}`}
                    className="group block rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="aspect-video bg-gradient-to-br from-primary-400 to-primary-600 relative overflow-hidden">
                      {post.featuredImage ? (
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-200 animate-pulse" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      {post.category && (
                        <span className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-white/90 text-slate-800 text-xs font-semibold">
                          {post.category}
                        </span>
                      )}
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 drop-shadow-lg">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-white/90 text-sm line-clamp-2 drop-shadow">
                            {post.excerpt}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="p-6">
                      <span className="inline-flex items-center gap-2 text-primary-600 font-semibold text-sm group-hover:gap-3 transition-all">
                        Read more
                        <FiArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}