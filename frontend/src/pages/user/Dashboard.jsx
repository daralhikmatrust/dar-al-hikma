import React, { useState, useEffect, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import { formatINR, normalizeAmount } from '../../utils/currency'
import { FiDownload, FiPrinter, FiLogOut, FiUser, FiMail, FiHeart, FiPhone, FiDollarSign, FiTrendingUp, FiCalendar, FiFilter, FiSearch, FiCopy, FiCheck, FiClock, FiCheckCircle, FiXCircle, FiRefreshCw, FiArrowRight, FiFileText, FiEdit2, FiSave, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { INDIAN_STATES, getCitiesForState } from '../../utils/states-countries'
import { getPaymentTime } from '../../utils/paymentTime'

export default function Dashboard() {
  const { user, isAdmin, logout, updateProfile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [donations, setDonations] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [copiedId, setCopiedId] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    profession: '',
    address: ''
  })
  const [updating, setUpdating] = useState(false)
  const [availableCities, setAvailableCities] = useState([])
  const [testimonialForm, setTestimonialForm] = useState({
    name: '',
    role: 'Donor',
    location: '',
    message: ''
  })
  const [testimonialSubmitted, setTestimonialSubmitted] = useState(false)

  useEffect(() => {
    if (editFormData.address?.state && editFormData.address.state !== 'Other') {
      setAvailableCities(getCitiesForState(editFormData.address.state))
    } else {
      setAvailableCities([])
    }
  }, [editFormData.address?.state])

  // Define fetchData before any useEffect that uses it
  const fetchData = useCallback(async () => {
    if (!user?.id && !user?._id) {
      console.log('[Dashboard] No user ID, skipping fetch')
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      console.log(`[Dashboard] Fetching donations for user: ${user?.id || user?._id} (${user?.email})`)
      const [donationsRes, statsRes] = await Promise.all([
        api.get('/donations/my-donations'),
        api.get(`/donors/stats/${user?.id || user?._id}`)
      ])
      const allDonations = donationsRes.data.donations || []
      console.log(`[Dashboard] API returned ${allDonations.length} donations:`, allDonations.map(d => ({
        id: d.id || d._id,
        amount: d.amount,
        status: d.status,
        donorId: d.donorId || d.donor_id,
        donorEmail: d.donorEmail || d.donor_email
      })))
      const sortedDonations = allDonations.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created_at || 0)
        const dateB = new Date(b.createdAt || b.created_at || 0)
        return dateB - dateA
      })
      setDonations(sortedDonations)
      
      // Calculate stats correctly - ONLY count paid/completed transactions for money totals
      // Frontend calculates from actual transaction data (source of truth)
      const paidDonations = allDonations.filter(d => {
        const status = d.status?.toLowerCase()
        return status === 'completed' || status === 'paid'
      })
      const calculatedTotal = paidDonations.reduce((sum, d) => sum + normalizeAmount(d.amount), 0)
      const calculatedCount = allDonations.length // Total count includes all statuses
      
      // Store stats but frontend will recalculate from donations array for consistency
      setStats(statsRes.data.stats || {
        totalAmount: calculatedTotal,
        donationCount: calculatedCount
      })
      console.log(`[Dashboard] Set ${sortedDonations.length} donations, paid: ${paidDonations.length}, total donated: ₹${calculatedTotal}`)
    } catch (error) {
      console.error('[Dashboard] Failed to fetch data:', error)
      console.error('[Dashboard] Error response:', error.response?.data)
      try {
        const donationsRes = await api.get('/donations/my-donations')
        const sortedDonations = (donationsRes.data.donations || []).sort((a, b) => {
          const dateA = new Date(a.createdAt || a.created_at || 0)
          const dateB = new Date(b.createdAt || b.created_at || 0)
          return dateB - dateA
        })
        setDonations(sortedDonations)
        console.log(`[Dashboard] Fallback fetch returned ${sortedDonations.length} donations`)
      } catch (err) {
        console.error('[Dashboard] Failed to fetch donations:', err)
      }
    } finally {
      setLoading(false)
    }
  }, [user?.id, user?._id, user?.email])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (user) {
      let parsedAddress = {}
      try {
        if (typeof user.address === 'string') {
          parsedAddress = JSON.parse(user.address || '{}')
        } else if (user.address && typeof user.address === 'object') {
          parsedAddress = user.address
        }
      } catch (e) {
        console.error('Failed to parse address:', e)
        parsedAddress = {}
      }
      
      setEditFormData({
        name: user.name || '',
        phone: user.phone || '',
        profession: user.profession || '',
        address: parsedAddress
      })
    }
  }, [user])

  // Check for payment success flags only once on mount or when navigating from payment
  useEffect(() => {
    if (location.pathname === '/user/dashboard' || location.pathname === '/dashboard') {
      const shouldRefresh = localStorage.getItem('donationSuccess') === 'true' || 
                           localStorage.getItem('lastDonationId') ||
                           new URLSearchParams(location.search).get('refresh') === 'true'
      if (shouldRefresh) {
        // Clear the refresh flag from URL
        if (location.search.includes('refresh=true')) {
          navigate(location.pathname, { replace: true })
        }
        // Fetch data immediately and again after delay to ensure backend has processed
        fetchData()
        // Also fetch again after a short delay to catch any webhook updates
        const timeoutId = setTimeout(() => {
          fetchData()
        }, 2000)
        // Clear flags after fetching to prevent repeated checks
        localStorage.removeItem('donationSuccess')
        localStorage.removeItem('donationSuccessTime')
        localStorage.removeItem('lastDonationId')
        localStorage.removeItem('lastDonationIdTime')
        return () => clearTimeout(timeoutId)
      }
    }
  }, [location.pathname, location.search, fetchData, navigate])

  // Listen for explicit donation success events (from payment flow)
  useEffect(() => {
    const handleDonationSuccess = () => {
      // Only refresh when explicitly triggered by payment completion
      fetchData()
      // Clear flags after handling
      localStorage.removeItem('donationSuccess')
      localStorage.removeItem('donationSuccessTime')
      localStorage.removeItem('lastDonationId')
      localStorage.removeItem('lastDonationIdTime')
    }
    
    window.addEventListener('donationSuccess', handleDonationSuccess)
    
    return () => {
      window.removeEventListener('donationSuccess', handleDonationSuccess)
    }
  }, [fetchData])

  const downloadReceipt = async (donationId) => {
    try {
      const response = await api.get(`/donations/${donationId}/receipt`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `receipt-${donationId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Receipt downloaded successfully')
    } catch (error) {
      console.error('Failed to download receipt:', error)
      toast.error('Failed to download receipt')
    }
  }

  const printReceipt = async (donationId) => {
    try {
      const response = await api.get(`/donations/${donationId}/receipt`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = url
      document.body.appendChild(iframe)
      iframe.onload = () => {
        iframe.contentWindow.print()
        setTimeout(() => {
          document.body.removeChild(iframe)
          window.URL.revokeObjectURL(url)
        }, 1000)
      }
      toast.success('Opening print dialog')
    } catch (error) {
      console.error('Failed to print receipt:', error)
      toast.error('Failed to print receipt')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }


  const copyTransactionId = (id) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    toast.success('Transaction ID copied!')
    setTimeout(() => setCopiedId(null), 2000)
  }


  const getStatusLabel = (status) => {
    const statusMap = {
      'completed': 'PAID',
      'pending': 'PENDING',
      'failed': 'FAILED',
      'refunded': 'REFUNDED',
      'cancelled': 'CANCELLED'
    }
    return statusMap[status?.toLowerCase()] || status?.toUpperCase() || 'UNKNOWN'
  }

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase()
    if (statusLower === 'completed') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    if (statusLower === 'pending') return 'bg-amber-50 text-amber-700 border-amber-200'
    if (statusLower === 'failed' || statusLower === 'cancelled') return 'bg-rose-50 text-rose-700 border-rose-200'
    if (statusLower === 'refunded') return 'bg-blue-50 text-blue-700 border-blue-200'
    return 'bg-slate-50 text-slate-700 border-slate-200'
  }

  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase()
    if (statusLower === 'completed') return <FiCheckCircle className="w-4 h-4" />
    if (statusLower === 'pending') return <FiClock className="w-4 h-4" />
    return <FiXCircle className="w-4 h-4" />
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    if (user) {
      let parsedAddress = {}
      try {
        if (typeof user.address === 'string') {
          parsedAddress = JSON.parse(user.address || '{}')
        } else if (user.address && typeof user.address === 'object') {
          parsedAddress = user.address
        }
      } catch (e) {
        console.error('Failed to parse address:', e)
        parsedAddress = {}
      }
      
      setEditFormData({
        name: user.name || '',
        phone: user.phone || '',
        profession: user.profession || '',
        address: parsedAddress
      })
    }
  }

  const handleSaveProfile = async () => {
    // Prevent double submission
    if (updating) {
      return
    }
    
    try {
      setUpdating(true)
      await updateProfile(editFormData)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
      // Error toast is already handled by updateProfile in AuthContext
    } finally {
      setUpdating(false)
    }
  }

  const handleInputChange = (field, value) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1]
      setEditFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }))
    } else {
      setEditFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  const filteredDonations = donations.filter(donation => {
    const matchesSearch = searchTerm === '' || 
      (donation.payment_id || donation.paymentId || donation._id || donation.id || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      (donation.donationType || donation.donation_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (donation.amount || '').toString().includes(searchTerm)
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'completed' && donation.status?.toLowerCase() === 'completed') ||
      (statusFilter === 'pending' && (donation.status?.toLowerCase() === 'pending' || donation.status?.toLowerCase() === 'processing')) ||
      (statusFilter === 'failed' && (donation.status?.toLowerCase() === 'failed' || donation.status?.toLowerCase() === 'cancelled')) ||
      (statusFilter === 'refunded' && donation.status?.toLowerCase() === 'refunded')
    
    return matchesSearch && matchesStatus
  })

  /**
   * FINANCIAL CORRECTNESS RULES (STRICT):
   * 
   * 1. Create paidTransactions ONCE - single source of truth for all money calculations
   * 2. TOTAL DONATED (₹) = sum(amount) of paidTransactions
   * 3. COMPLETED (₹) = TOTAL DONATED (must be identical)
   * 4. PAID COUNT = paidTransactions.length
   * 5. PENDING COUNT = transactions with status 'pending' OR 'processing'
   * 6. THIS MONTH (₹) = sum(amount) of paidTransactions in current month
   * 
   * CRITICAL SAFEGUARDS:
   * - Pending transactions NEVER affect money totals
   * - Failed/cancelled transactions NEVER affect money totals
   * - All money calculations derive from the SAME paidTransactions array
   * - No double filtering, no inconsistent checks
   * - Backend transaction status is the ONLY source of truth
   */

  // Helper function to check if status is PAID/COMPLETED (case-insensitive)
  // Backend uses 'completed' status for verified payments
  const isPaid = (status) => {
    const statusLower = status?.toLowerCase()
    return statusLower === 'completed' || statusLower === 'paid'
  }

  // Helper function to check if status is PENDING (case-insensitive)
  const isPending = (status) => {
    const statusLower = status?.toLowerCase()
    return statusLower === 'pending' || statusLower === 'processing' || statusLower === 'created'
  }

  // Helper function to check if transaction is in current calendar month
  const isCurrentMonth = (dateString) => {
    if (!dateString) return false
    try {
      const donationDate = new Date(dateString)
      const now = new Date()
      return donationDate.getMonth() === now.getMonth() && 
             donationDate.getFullYear() === now.getFullYear()
    } catch {
      return false
    }
  }

  // ============================================================
  // STEP 1: Create paidTransactions ONCE - single source of truth
  // ============================================================
  // This array contains ONLY transactions with verified payment status
  // All money calculations MUST derive from this array
  const paidTransactions = donations.filter(d => isPaid(d.status))

  // ============================================================
  // STEP 2: Calculate all stats from paidTransactions
  // ============================================================

  // 1. TOTAL DONATED (₹) - Sum of all paid transactions
  const totalAmount = paidTransactions.reduce((sum, d) => sum + normalizeAmount(d.amount), 0)

  // 2. COMPLETED (₹) - MUST be identical to Total Donated
  // This ensures financial consistency - they represent the same value
  const completedAmount = totalAmount

  // 3. PAID COUNT - Number of paid transactions
  const completedCount = paidTransactions.length

  // 4. PENDING COUNT - Transactions awaiting payment
  const pendingCount = donations.filter(d => isPending(d.status)).length

  // 5. THIS MONTH (₹) - Sum of paid transactions in current month
  const thisMonthAmount = paidTransactions
    .filter(d => isCurrentMonth(d.createdAt || d.created_at))
    .reduce((sum, d) => sum + normalizeAmount(d.amount), 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="section-padding">
          <div className="container-custom">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
              <p className="mt-4 text-slate-600">Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Greeting Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600 opacity-10"></div>
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        ></div>
        
        <div className="container-custom relative z-10">
          <div className="section-padding py-12">
            {/* Top-right refresh button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => {
                  fetchData()
                  toast.success('Refreshing dashboard...')
                }}
                disabled={loading}
                className="px-4 py-2 bg-white/90 backdrop-blur-sm text-primary-600 font-semibold rounded-lg hover:bg-white transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-primary-200"
                title="Refresh dashboard data"
              >
                <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8 items-stretch">
              {/* Greeting Card */}
              <div className="lg:col-span-2 flex">
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/50 transform hover:scale-[1.02] transition-all duration-300 animate-fade-in w-full flex flex-col justify-between">
                  <div>
                    <p className="text-primary-600 font-semibold text-sm mb-2 animate-fade-in">{getGreeting()},</p>
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2 animate-slide-up">
                      {user?.name || 'Valued Donor'}!
                    </h1>
                    <p className="text-slate-600 text-lg animate-fade-in" style={{ animationDelay: '0.1s' }}>
                      {donations.length > 0 
                        ? `You've made ${donations.length} generous contribution${donations.length !== 1 ? 's' : ''} so far. Thank you for your continued support!`
                        : 'Welcome to your dashboard! Ready to make a positive impact?'}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 mt-8">
                    <Link
                      to="/donate"
                      className="px-6 py-3 bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                      <FiHeart className="w-5 h-5" />
                      Make a Donation
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin/dashboard"
                        className="px-6 py-3 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 active:scale-95"
                      >
                        Admin Panel
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Summary Card */}
              <div className="lg:col-span-1 flex">
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/50 w-full flex flex-col animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-indigo-500 flex items-center justify-center shadow-lg animate-pulse">
                        <FiUser className="w-5 h-5 text-white" />
                      </div>
                      <span>Account</span>
                    </h2>
                    {!isEditing && (
                      <button
                        onClick={handleEdit}
                        className="group p-2.5 text-primary-600 hover:text-white hover:bg-primary-600 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-110 active:scale-95"
                        title="Edit Profile"
                      >
                        <FiEdit2 className="w-5 h-5 transition-transform group-hover:rotate-12" />
                      </button>
                    )}
                  </div>
                  
                  {!isEditing ? (
                    <div className="space-y-3">
                      <div className="group flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary-50/50 to-indigo-50/50 hover:from-primary-100 hover:to-indigo-100 transition-all duration-300 transform hover:scale-[1.03] hover:shadow-lg cursor-pointer border-2 border-primary-200/50 hover:border-primary-300 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                          <FiUser className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-500 mb-1 font-medium">Name</p>
                          <p className="text-base font-bold text-slate-900 truncate group-hover:text-primary-700 transition-colors">{user?.name || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="group flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50/50 to-cyan-50/50 hover:from-blue-100 hover:to-cyan-100 transition-all duration-300 transform hover:scale-[1.03] hover:shadow-lg cursor-pointer border-2 border-blue-200/50 hover:border-blue-300 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                          <FiMail className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-500 mb-1 font-medium">Email</p>
                          <p className="text-base font-bold text-slate-900 truncate group-hover:text-blue-700 transition-colors">{user?.email || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="group flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-50/50 to-pink-50/50 hover:from-purple-100 hover:to-pink-100 transition-all duration-300 transform hover:scale-[1.03] hover:shadow-lg cursor-pointer border-2 border-purple-200/50 hover:border-purple-300 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                          <FiUser className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-500 mb-1 font-medium">Account Type</p>
                          <p className="text-base font-bold text-slate-900 group-hover:text-purple-700 transition-colors">{isAdmin ? 'Administrator' : 'Donor'}</p>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t-2 border-slate-200 space-y-2">
                        <button
                          onClick={handleEdit}
                          className="w-full px-4 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-primary-600 via-indigo-600 to-primary-600 rounded-xl hover:from-primary-700 hover:via-indigo-700 hover:to-primary-700 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1.5 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 relative overflow-hidden group"
                        >
                          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                          <FiEdit2 className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform" />
                          <span className="relative z-10">Edit Profile</span>
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-red-500 to-rose-600 rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1.5 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 border-2 border-red-400/50 hover:border-red-500 relative overflow-hidden group"
                        >
                          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                          <FiLogOut className="w-5 h-5 relative z-10 group-hover:-translate-x-1 transition-transform" />
                          <span className="relative z-10">Logout</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-fade-in">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Name *</label>
                        <input
                          type="text"
                          value={editFormData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="w-full px-4 py-3 text-sm border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 hover:border-primary-400"
                          placeholder="Your full name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Email</label>
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="w-full px-4 py-3 text-sm border-2 border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                        />
                        <p className="text-xs text-slate-400 mt-1.5">Email cannot be changed</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Phone</label>
                        <input
                          type="tel"
                          value={editFormData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full px-4 py-3 text-sm border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 hover:border-primary-400"
                          placeholder="+91 1234567890"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Profession</label>
                        <input
                          type="text"
                          value={editFormData.profession}
                          onChange={(e) => handleInputChange('profession', e.target.value)}
                          className="w-full px-4 py-3 text-sm border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 hover:border-primary-400"
                          placeholder="Your profession"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Address</label>
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editFormData.address?.street || ''}
                            onChange={(e) => handleInputChange('address.street', e.target.value)}
                            className="w-full px-4 py-2.5 text-sm border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 hover:border-primary-400"
                            placeholder="Street Address"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <select
                                value={editFormData.address?.state || ''}
                                onChange={(e) => {
                                  const selectedState = e.target.value;
                                  handleInputChange('address.state', selectedState);
                                  if (selectedState !== 'Other') {
                                    handleInputChange('address.city', '');
                                  }
                                }}
                                className="w-full px-4 py-2.5 text-sm border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 hover:border-primary-400 appearance-none cursor-pointer bg-white"
                              >
                                <option value="">Select State</option>
                                {INDIAN_STATES.map((state) => (
                                  <option key={state} value={state}>
                                    {state}
                                  </option>
                                ))}
                              </select>
                              {editFormData.address?.state === 'Other' && (
                                <input
                                  type="text"
                                  className="w-full mt-2 px-4 py-2.5 text-sm border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 hover:border-primary-400"
                                  value={editFormData.address?.district || ''}
                                  onChange={(e) => handleInputChange('address.district', e.target.value)}
                                  placeholder="Enter state name"
                                  required
                                />
                              )}
                            </div>
                            <div>
                              {editFormData.address?.state && editFormData.address.state !== 'Other' ? (
                                <>
                                  <select
                                    value={editFormData.address?.city || ''}
                                    onChange={(e) => {
                                      const selectedCity = e.target.value;
                                      handleInputChange('address.city', selectedCity);
                                      if (selectedCity !== 'Other') {
                                        handleInputChange('address.district', '');
                                      }
                                    }}
                                    className="w-full px-4 py-2.5 text-sm border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 hover:border-primary-400 appearance-none cursor-pointer bg-white"
                                    disabled={!editFormData.address?.state}
                                  >
                                    <option value="">Select City</option>
                                    {availableCities.map((city) => (
                                      <option key={city} value={city}>
                                        {city}
                                      </option>
                                    ))}
                                    {availableCities.length > 0 && (
                                      <option value="Other">Other</option>
                                    )}
                                  </select>
                                  {editFormData.address?.city === 'Other' && (
                                    <input
                                      type="text"
                                      className="w-full mt-2 px-4 py-2.5 text-sm border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 hover:border-primary-400"
                                      value={editFormData.address?.district || ''}
                                      onChange={(e) => handleInputChange('address.district', e.target.value)}
                                      placeholder="Enter city name"
                                      required
                                    />
                                  )}
                                  {editFormData.address?.state && availableCities.length === 0 && (
                                    <input
                                      type="text"
                                      className="w-full mt-2 px-4 py-2.5 text-sm border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 hover:border-primary-400"
                                      value={editFormData.address?.city || ''}
                                      onChange={(e) => handleInputChange('address.city', e.target.value)}
                                      placeholder="Enter city"
                                    />
                                  )}
                                </>
                              ) : (
                                <input
                                  type="text"
                                  value={editFormData.address?.city || ''}
                                  onChange={(e) => handleInputChange('address.city', e.target.value)}
                                  className="w-full px-4 py-2.5 text-sm border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 hover:border-primary-400"
                                  placeholder={editFormData.address?.state === 'Other' ? 'Enter city' : 'Select State First'}
                                  disabled={!editFormData.address?.state}
                                />
                              )}
                            </div>
                          </div>
                          <input
                            type="text"
                            value={editFormData.address?.pincode || ''}
                            onChange={(e) => handleInputChange('address.pincode', e.target.value)}
                            className="w-full px-4 py-2.5 text-sm border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 hover:border-primary-400"
                            placeholder="Pincode"
                          />
                        </div>
                      </div>
                      <div className="pt-4 border-t-2 border-slate-200 flex gap-2">
                        <button
                          onClick={handleSaveProfile}
                          disabled={updating}
                          className="flex-1 px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          <FiSave className="w-4 h-4" />
                          {updating ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={updating}
                          className="px-5 py-3 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-2 border-slate-200 hover:border-slate-300"
                        >
                          <FiX className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Financial Overview */}
      <section className="container-custom -mt-6 relative z-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <span className="text-emerald-100 text-sm font-medium">Total Donated</span>
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <FiDollarSign className="w-6 h-6" />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1">{formatINR(totalAmount)}</p>
            <p className="text-xs text-emerald-100">{completedCount} paid transaction{completedCount !== 1 ? 's' : ''}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-blue-100 text-sm font-medium">Completed</span>
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <FiCheckCircle className="w-6 h-6" />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1">{completedCount}</p>
            <p className="text-xs text-blue-100">Paid transactions</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-amber-100 text-sm font-medium">Pending</span>
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <FiClock className="w-6 h-6" />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1">{pendingCount}</p>
            <p className="text-xs text-amber-100">Awaiting payment</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-purple-100 text-sm font-medium">This Month</span>
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <FiCalendar className="w-6 h-6" />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1">{formatINR(thisMonthAmount)}</p>
            <p className="text-xs text-purple-100">Current month</p>
          </div>
        </div>
      </section>

      {/* Full Page Transaction History */}
      <section className="container-custom mb-12">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <FiFileText className="w-6 h-6 text-primary-600" />
                  Transaction History
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Showing <span className="font-semibold text-primary-600">{filteredDonations.length}</span> of <span className="font-semibold">{donations.length}</span> transaction{donations.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                {/* Refresh button on the left of search */}
                <button
                  onClick={() => {
                    fetchData()
                    toast.success('Refreshing transaction history...')
                  }}
                  disabled={loading}
                  className="p-2.5 bg-white/90 backdrop-blur-sm text-primary-600 font-semibold rounded-lg hover:bg-white transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-primary-200 hover:border-primary-300"
                  title="Refresh transaction history"
                >
                  <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline text-sm">Refresh</span>
                </button>
                <div className="relative flex-1 sm:flex-initial min-w-[200px]">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="relative">
                  <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-10 pr-8 py-2.5 text-sm border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white cursor-pointer transition-all"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Table */}
          {filteredDonations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
                  <tr>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-700 uppercase tracking-wider">Date & Time</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-700 uppercase tracking-wider">Amount</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-700 uppercase tracking-wider">Type</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-700 uppercase tracking-wider">Transaction ID</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDonations.map((donation, index) => {
                    const transactionId = (donation.payment_id || donation.paymentId || donation._id || donation.id || '').toString()
                    const donationKey = donation._id || donation.id
                    return (
                      <tr 
                        key={donationKey}
                        className="hover:bg-gradient-to-r hover:from-primary-50/50 hover:to-indigo-50/50 transition-all duration-200 group"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                          <td className="py-5 px-6">
                            <div className="text-sm font-semibold text-slate-900">
                              {getPaymentTime(donation).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <FiClock className="w-3 h-3" />
                              {getPaymentTime(donation).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: true
                              })}
                            </div>
                          </td>
                        <td className="py-5 px-6">
                          <div className="text-xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
                            {formatINR(donation.amount || 0)}
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="text-sm font-medium text-slate-700">
                            {donation.donationType || donation.donation_type || 'General'}
                          </div>
                          {donation.project?.title && (
                            <div className="text-xs text-slate-500 mt-1">{donation.project.title}</div>
                          )}
                        </td>
                        <td className="py-5 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${getStatusColor(donation.status)}`}>
                            {getStatusIcon(donation.status)}
                            {getStatusLabel(donation.status)}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-2">
                            <code className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">
                              {transactionId.slice(0, 12)}...
                            </code>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                copyTransactionId(transactionId)
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-200 rounded"
                            >
                              {copiedId === transactionId ? (
                                <FiCheck className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <FiCopy className="w-4 h-4 text-slate-600" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-2">
                            {donation.status === 'completed' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  downloadReceipt(donation._id || donation.id)
                                }}
                                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-indigo-600 rounded-lg hover:from-primary-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
                                title="Download Receipt PDF"
                              >
                                <FiDownload className="w-4 h-4" />
                                <span className="hidden sm:inline">Download PDF</span>
                              </button>
                            )}
                            {donation.status === 'pending' && (
                              <span className="text-xs text-slate-500 italic">Awaiting payment</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-16 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <FiSearch className="w-12 h-12 text-primary-600" />
              </div>
              <p className="text-xl font-semibold text-slate-700 mb-2">No transactions found</p>
              <p className="text-sm text-slate-500 mb-8">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'Start making a difference today'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Link
                  to="/donate"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <FiHeart className="w-5 h-5" />
                  Make Your First Donation
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Share Your Experience Section */}
      <section className="container-custom mb-12">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
              <FiHeart className="w-5 h-5 text-primary-600" />
              Share Your Experience
            </h2>
            <p className="text-sm text-slate-600">
              Tell us how Dar Al Hikma has made a difference in your life. Your words encourage others to join and support this work.
            </p>
          </div>
          <div className="p-6">
            {testimonialSubmitted ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <p className="text-sm text-emerald-800 font-semibold">
                  Thank you for sharing! Your testimonial has been sent for review and will appear once approved by the admin.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setTestimonialSubmitted(false)
                    setTestimonialForm({ name: '', role: 'Donor', location: '', message: '' })
                  }}
                  className="mt-3 text-sm text-emerald-700 hover:text-emerald-900 font-medium"
                >
                  Submit another testimonial
                </button>
              </div>
            ) : (
              <form
                className="grid md:grid-cols-2 gap-4"
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!testimonialForm.name.trim() || !testimonialForm.message.trim()) {
                    toast.error('Please fill in your name and message')
                    return
                  }
                  try {
                    await api.post('/testimonials', testimonialForm)
                    setTestimonialForm({ name: '', role: 'Donor', location: '', message: '' })
                    setTestimonialSubmitted(true)
                    toast.success('Testimonial submitted successfully! It will appear once approved.')
                  } catch (err) {
                    toast.error(err.response?.data?.message || 'Failed to submit testimonial')
                  }
                }}
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Your Name *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 text-sm border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    value={testimonialForm.name}
                    onChange={(e) => setTestimonialForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Role *</label>
                  <select
                    className="w-full px-4 py-2.5 text-sm border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all cursor-pointer bg-white"
                    value={testimonialForm.role}
                    onChange={(e) => setTestimonialForm((prev) => ({ ...prev, role: e.target.value }))}
                    required
                  >
                    <option value="Donor">Donor</option>
                    <option value="Volunteer">Volunteer</option>
                    <option value="Student">Student</option>
                    <option value="Parent">Parent</option>
                    <option value="Community Member">Community Member</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">City / State (optional)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 text-sm border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    value={testimonialForm.location}
                    onChange={(e) => setTestimonialForm((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="Enter your city or state"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Your Story *</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-2.5 text-sm border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                    value={testimonialForm.message}
                    onChange={(e) => setTestimonialForm((prev) => ({ ...prev, message: e.target.value }))}
                    placeholder="Share a short experience or reflection..."
                    required
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                  >
                    <FiHeart className="w-4 h-4" />
                    <span>Submit Testimonial</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
