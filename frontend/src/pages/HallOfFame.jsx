import { Helmet } from "react-helmet-async"
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { FiAward, FiHeart, FiArrowRight, FiStar, FiUser, FiTrendingUp } from 'react-icons/fi'

export default function HallOfFame() {
  const [donors, setDonors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDonors()
  }, [])

  const fetchDonors = async () => {
    try {
      const { data } = await api.get('/donors/hall-of-fame')
      setDonors(data.donors || [])
    } catch (error) {
      console.error('Failed to fetch donors:', error)
    } finally {
      setLoading(false)
    }
  }

  // Helper for Card Styling based on Rank
  const getRankTheme = (index) => {
    switch (index) {
      case 0: // 1st Place (Gold)
        return {
          banner: 'bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-300',
          ring: 'ring-amber-400',
          badge: 'bg-amber-500 text-white',
          iconColor: 'text-amber-600',
          shadow: 'hover:shadow-amber-100'
        }
      case 1: // 2nd Place (Silver)
        return {
          banner: 'bg-gradient-to-r from-slate-300 via-slate-400 to-slate-300',
          ring: 'ring-slate-300',
          badge: 'bg-slate-500 text-white',
          iconColor: 'text-slate-500',
          shadow: 'hover:shadow-slate-100'
        }
      case 2: // 3rd Place (Bronze)
        return {
          banner: 'bg-gradient-to-r from-orange-300 via-orange-400 to-orange-300',
          ring: 'ring-orange-300',
          badge: 'bg-orange-500 text-white',
          iconColor: 'text-orange-600',
          shadow: 'hover:shadow-orange-100'
        }
      default: // Others (Standard Blue/Slate)
        return {
          banner: 'bg-gradient-to-r from-slate-100 to-slate-200',
          ring: 'ring-white',
          badge: 'bg-slate-800 text-white',
          iconColor: 'text-slate-400',
          shadow: 'hover:shadow-slate-100'
        }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Helmet>
        <title>Hall of Fame | Our Honored Donors &amp; Volunteers - Dar Al Hikma</title>
        <meta name="description" content="Recognizing the extraordinary contributions of our donors and volunteers who make our mission possible." />
        <link rel="canonical" href="https://daralhikma.org.in/hall-of-fame" />
      </Helmet>
      {/* --- HERO SECTION --- */}
      <section className="bg-white pt-24 pb-16 border-b border-slate-200 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px]"></div>
        </div>
        
        {/* Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-slate-900 via-amber-500 to-slate-900"></div>

        <div className="container-custom px-4 sm:px-6 lg:px-8 relative z-10 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 py-2 px-5 rounded-full bg-slate-900 text-amber-400 text-xs font-bold tracking-widest uppercase mb-6 shadow-lg">
            <FiAward className="w-4 h-4" /> Visionary Circle
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Our Hall of <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-700">Fame</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Recognizing the extraordinary individuals whose generosity serves as the foundation of our mission.
          </p>
        </div>
      </section>

      {/* --- DONORS GRID --- */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="container-custom px-4 sm:px-6 lg:px-8">
          
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 animate-pulse">
                  <div className="h-32 bg-slate-200"></div>
                  <div className="px-8 pb-8 -mt-12 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-slate-300 border-4 border-white mb-4"></div>
                    <div className="h-6 bg-slate-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : donors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm text-center px-4">
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                <FiStar className="w-10 h-10 text-amber-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Be the First Honoree</h3>
              <p className="text-slate-500 max-w-md mx-auto mb-8">
                The Hall of Fame awaits its first visionary. Your exceptional contribution can inspire a movement.
              </p>
              <Link 
                to="/donate" 
                className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg"
              >
                <FiHeart className="w-5 h-5 text-red-500 fill-current" />
                <span>Make a Donation</span>
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {donors.map((donor, idx) => {
                const theme = getRankTheme(idx)
                
                return (
                  <div
                    key={donor._id || donor.id}
                    className={`group relative bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${theme.shadow}`}
                  >
                    {/* 1. Colored Banner Header */}
                    <div className={`h-32 w-full ${theme.banner} relative`}>
                        {/* Pattern overlay for texture */}
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                        
                        {/* Rank Badge */}
                        {idx < 3 && (
                            <div className="absolute top-4 right-4">
                                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${theme.badge}`}>
                                    <FiAward /> Rank #{idx + 1}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2. Content Body */}
                    <div className="px-8 pb-8 text-center relative">
                        
                        {/* Floating Avatar */}
                        <div className="relative -mt-12 mb-5 inline-block">
                            <div className={`p-1 rounded-full bg-white shadow-md ring-4 ${theme.ring}`}>
                                {donor.photo ? (
                                    <img
                                        src={donor.photo}
                                        alt={donor.name}
                                        className="w-24 h-24 rounded-full object-cover bg-slate-100"
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                        <FiUser size={40} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Name & Title */}
                        <h3 className="text-2xl font-bold text-slate-900 mb-1 group-hover:text-amber-600 transition-colors">
                            {donor.name}
                        </h3>
                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-6">
                            {donor.profession || 'Philanthropist'}
                        </p>

                        {/* Quote / Bio */}
                        <div className="relative bg-slate-50 rounded-xl p-5 mb-6">
                            <FiStar className={`absolute -top-3 -left-2 w-6 h-6 ${theme.iconColor} fill-current`} />
                            <p className="text-slate-600 italic text-sm leading-relaxed line-clamp-3">
                                "{donor.bio || "A dedicated supporter committed to making a lasting difference in our community through generous contributions."}"
                            </p>
                        </div>

                        {/* Footer Info */}
                        <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <span className={`w-2 h-2 rounded-full ${idx < 3 ? 'bg-amber-500' : 'bg-slate-300'}`}></span>
                            {idx < 3 ? 'Top Contributor' : 'Honored Member'}
                        </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-20 bg-slate-900 text-white border-t border-slate-800">
        <div className="container-custom px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Join the Circle of Visionaries
            </h2>
            <p className="text-lg text-slate-400 mb-10 leading-relaxed">
              Your extraordinary generosity creates a lasting legacy. 
              Make a significant impact today and take your place among our most dedicated supporters.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                to="/donate" 
                className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg hover:-translate-y-1"
              >
                <FiHeart className="w-5 h-5 fill-current" />
                <span>Donate Now</span>
              </Link>
              <Link 
                to="/contact" 
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg text-white border border-slate-700 hover:bg-slate-800 transition-colors"
              >
                <span>Contact Us</span>
                <FiArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}