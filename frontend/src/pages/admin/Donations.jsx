import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { getPaymentTime } from '../../utils/paymentTime'
import { FiDownload, FiSearch, FiFilter, FiX, FiFileText, FiUser, FiExternalLink, FiAlertCircle } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function AdminDonations() {
  const API_BASE = api.defaults.baseURL
  const [donations, setDonations] = useState([])
  const [filteredDonations, setFilteredDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    donationType: '',
    page: 1
  })

  useEffect(() => {
    fetchDonations()
  }, [filters])

  useEffect(() => {
    filterDonations()
  }, [searchQuery, donations])

  // Check for URL params on mount (e.g., from dashboard link)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const statusParam = urlParams.get('status')
    if (statusParam && statusParam !== filters.status) {
      setFilters(prev => ({ ...prev, status: statusParam, page: 1 }))
    }
  }, [])

  const fetchDonations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.donationType) params.append('donationType', filters.donationType)
      params.append('page', filters.page)
      
      const { data } = await api.get(`/admin/donations?${params.toString()}`)
      setDonations(data.donations || [])
      setFilteredDonations(data.donations || [])
    } catch (error) {
      console.error('Failed to fetch donations:', error)
      toast.error('Failed to load donations')
    } finally {
      setLoading(false)
    }
  }

  const filterDonations = () => {
    if (!searchQuery) {
      setFilteredDonations(donations)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = donations.filter(donation => {
      const donorName = donation.donor?.name || donation.donorName || 'Anonymous'
      const donorEmail = donation.donor?.email || donation.donorEmail || ''
      const amount = donation.amount?.toString() || ''
      const projectTitle = donation.project?.title || ''
      const receiptNumber = donation.receiptNumber || donation.receipt_number || ''
      const paymentId = donation.payment_id || donation.paymentId || donation.razorpay_payment_id || ''
      const orderId = donation.order_id || donation.orderId || donation.razorpay_order_id || ''
      const donationId = donation._id || donation.id || ''
      
      return (
        donorName.toLowerCase().includes(query) ||
        donorEmail.toLowerCase().includes(query) ||
        amount.includes(query) ||
        projectTitle.toLowerCase().includes(query) ||
        receiptNumber.toLowerCase().includes(query) ||
        paymentId.toLowerCase().includes(query) ||
        orderId.toLowerCase().includes(query) ||
        donationId.toLowerCase().includes(query) ||
        donation.donationType?.toLowerCase().includes(query)
      )
    })

    setFilteredDonations(filtered)
  }

  const exportCSV = async () => {
    try {
      const response = await api.get('/admin/donations/export', {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `donations-${new Date().toISOString()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Donations exported successfully')
    } catch (error) {
      console.error('Failed to export:', error)
      toast.error('Failed to export donations')
    }
  }

  const exportPDF = async () => {
    try {
      toast.loading('Generating PDF...', { id: 'pdf-export' })
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF('l', 'mm', 'a4')
      const pageW = pdf.internal.pageSize.getWidth()
      let y = 15

      // Use standard font
      pdf.setFont('helvetica')
      
      // Helper to add text without spacing issues
      const addText = (text, x, yPos, options = {}) => {
        const cleanText = String(text).replace(/\s+/g, ' ').trim()
        pdf.text(cleanText, x, yPos, options)
      }

      // Professional Header with gradient
      pdf.setFillColor(6, 95, 70)
      pdf.rect(0, 0, pageW, 30, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(22)
      pdf.setFont('helvetica', 'bold')
      addText('Donations Report', pageW / 2, 14, { align: 'center' })
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'normal')
      addText(`Dar Al Hikma Trust`, pageW / 2, 20, { align: 'center' })
      addText(`Generated: ${new Date().toLocaleString()}`, pageW / 2, 25, { align: 'center' })
      y = 35

      // Professional Table header
      pdf.setFillColor(236, 253, 245)
      pdf.rect(10, y - 6, pageW - 20, 10, 'F')
      pdf.setDrawColor(6, 95, 70)
      pdf.rect(10, y - 6, pageW - 20, 10, 'S')
      pdf.setFontSize(11)
      pdf.setTextColor(6, 95, 70)
      pdf.setFont('helvetica', 'bold')
      addText('Date', 14, y)
      addText('Donor', 50, y)
      addText('Amount (INR)', 120, y)
      addText('Type', 150, y)
      addText('Status', 180, y)
      pdf.setFont('helvetica', 'normal')
      y += 10

      filteredDonations.slice(0, 30).forEach((donation, idx) => {
        if (y > 180) {
          pdf.addPage()
          y = 15
          // Redraw header on new page
          pdf.setFillColor(236, 253, 245)
          pdf.rect(10, y - 6, pageW - 20, 10, 'F')
          pdf.setDrawColor(6, 95, 70)
          pdf.rect(10, y - 6, pageW - 20, 10, 'S')
          pdf.setFontSize(11)
          pdf.setTextColor(6, 95, 70)
          pdf.setFont('helvetica', 'bold')
          addText('Date', 14, y)
          addText('Donor', 50, y)
          addText('Amount (INR)', 120, y)
          addText('Type', 150, y)
          addText('Status', 180, y)
          pdf.setFont('helvetica', 'normal')
          y += 10
        }
        // Alternate row colors with borders
        if (idx % 2 === 0) {
          pdf.setFillColor(249, 250, 251)
          pdf.rect(10, y - 5, pageW - 20, 7, 'F')
        }
        pdf.setDrawColor(220, 220, 220)
        pdf.rect(10, y - 5, pageW - 20, 7, 'S')
        pdf.setTextColor(31, 41, 55)
        pdf.setFontSize(10)
        addText(
          getPaymentTime(donation).toLocaleDateString('en-IN'),
          14,
          y
        )
        const donorName = (donation.isAnonymous ? 'Anonymous' : (donation.donor?.name || donation.donorName || 'Anonymous')).substring(0, 20)
        addText(donorName, 50, y)
        pdf.setTextColor(6, 95, 70)
        pdf.setFont('helvetica', 'bold')
        const amount = parseFloat(donation.amount || 0)
        addText(
          'INR ' + amount.toLocaleString('en-IN', { maximumFractionDigits: 2 }),
          120,
          y,
          { align: 'right' }
        )
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(31, 41, 55)
        addText((donation.donationType || 'General').substring(0, 15), 150, y)
        const statusColor = donation.status === 'completed' ? [34, 197, 94] : donation.status === 'failed' ? [239, 68, 68] : [234, 179, 8]
        pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2])
        pdf.setFont('helvetica', 'bold')
        addText((donation.status || 'pending').substring(0, 10), 180, y)
        pdf.setFont('helvetica', 'normal')
        y += 7
      })

      // Footer
      y = pdf.internal.pageSize.getHeight() - 10
      pdf.setDrawColor(200, 200, 200)
      pdf.line(14, y, pageW - 14, y)
      pdf.setTextColor(150, 150, 150)
      pdf.setFontSize(8)
      addText('Dar Al Hikma Trust - Donations Report', pageW / 2, y + 5, { align: 'center' })

      pdf.save(`donations-${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('PDF exported successfully!', { id: 'pdf-export' })
    } catch (error) {
      console.error('PDF export error:', error)
      toast.error('Failed to export PDF', { id: 'pdf-export' })
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'completed': { label: 'PAID', class: 'bg-green-100 text-green-700 border-green-300' },
      'pending': { label: 'PENDING', class: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
      'failed': { label: 'FAILED', class: 'bg-red-100 text-red-700 border-red-300' },
      'cancelled': { label: 'CANCELLED', class: 'bg-gray-100 text-gray-700 border-gray-300' },
      'refunded': { label: 'REFUNDED', class: 'bg-orange-100 text-orange-700 border-orange-300' }
    }
    const config = statusMap[status?.toLowerCase()] || statusMap['pending']
    return (
      <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${config.class}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="mt-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 animate-admin-slide-in">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Donations</h1>
          <p className="text-slate-600">View and manage all payment transactions</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button 
            onClick={() => {
              setFilters({ ...filters, status: 'failed', page: 1 })
              setSearchQuery('')
            }}
            className="px-4 py-2.5 border-2 border-red-300 text-red-700 font-semibold rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
          >
            <FiAlertCircle className="w-4 h-4" /> Failed Only
          </button>
          <button 
            onClick={exportCSV} 
            className="px-4 py-2.5 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <FiDownload className="w-4 h-4" /> Export CSV
          </button>
          <button 
            onClick={exportPDF} 
            className="px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <FiDownload className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6 animate-admin-slide-up hover:shadow-md transition-all duration-300" style={{ animationDelay: '0.1s' }}>
        <div className="grid md:grid-cols-4 gap-4">
          {/* Search Bar */}
          <div className="relative md:col-span-2">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, amount, transaction ID, receipt..."
              className="w-full pl-12 pr-10 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 placeholder-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <FiX size={18} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="relative">
            <FiFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
            <select
              className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 cursor-pointer appearance-none"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="relative">
            <select
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-slate-900 cursor-pointer appearance-none"
              value={filters.donationType}
              onChange={(e) => setFilters({ ...filters, donationType: e.target.value, page: 1 })}
            >
              <option value="">All Types</option>
              <option value="General">General</option>
              <option value="Zakat">Zakat</option>
              <option value="Sadaqa">Sadaqa</option>
              <option value="SadaqaJaria">Sadaqa Jaria</option>
              <option value="Project">Project</option>
              <option value="Faculty">Faculty</option>
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {(searchQuery || filters.status || filters.donationType) && (
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
            {filters.status && (
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold border border-blue-200 flex items-center gap-2">
                Status: {filters.status}
                <button onClick={() => setFilters({ ...filters, status: '', page: 1 })} className="hover:text-blue-900">
                  <FiX size={14} />
                </button>
              </span>
            )}
            {filters.donationType && (
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold border border-blue-200 flex items-center gap-2">
                Type: {filters.donationType}
                <button onClick={() => setFilters({ ...filters, donationType: '', page: 1 })} className="hover:text-blue-900">
                  <FiX size={14} />
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchQuery('')
                setFilters({ status: '', donationType: '', page: 1 })
              }}
              className="text-sm text-primary-600 hover:text-primary-700 font-semibold"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-slate-600">Loading donations...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-admin-slide-up hover:shadow-md transition-all duration-300" style={{ animationDelay: '0.2s' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Date & Time</th>
                  <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Donor</th>
                  <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Email</th>
                  <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Amount</th>
                  <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Transaction ID</th>
                  <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Type</th>
                  <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Status</th>
                  <th className="text-left py-3 px-6 text-sm font-bold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDonations.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-500">
                      {donations.length === 0 
                        ? 'No donations found.'
                        : 'No donations match your search criteria.'}
                    </td>
                  </tr>
                ) : (
                  filteredDonations.map((donation, index) => {
                    const paymentId = donation.payment_id || donation.paymentId || donation.razorpay_payment_id || ''
                    const orderId = donation.order_id || donation.orderId || donation.razorpay_order_id || ''
                    const donorId = donation.donor?.id || donation.donor?._id || donation.donor_id || ''
                    const isFailed = donation.status === 'failed' || donation.status === 'cancelled'
                    
                    return (
                      <tr 
                        key={donation._id || donation.id} 
                        className={`hover:bg-slate-50 transition-all duration-200 animate-admin-slide-in ${isFailed ? 'bg-red-50/30' : ''}`}
                        style={{ animationDelay: `${0.3 + index * 0.03}s` }}
                      >
                        <td className="py-4 px-6">
                          <div className="text-sm">
                            {(() => {
                              const paymentTime = getPaymentTime(donation);
                              return (
                                <>
                                  <div className="font-semibold text-slate-900">
                                    {paymentTime.toLocaleDateString('en-IN', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </div>
                                  <div className="text-xs text-slate-500 mt-1">
                                    {paymentTime.toLocaleTimeString('en-IN', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit',
                                      hour12: true
                                    })}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold text-slate-900">
                              {donation.isAnonymous ? (
                                <span className="text-slate-500 italic">Anonymous</span>
                              ) : (
                                donation.donor?.name || donation.donorName || 'Anonymous'
                              )}
                            </div>
                            {!donation.isAnonymous && donorId && (
                              <Link
                                to={`/admin/donors`}
                                className="text-primary-600 hover:text-primary-700"
                                title="View donor details"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // Store donor ID for filtering
                                  sessionStorage.setItem('donorFilter', donorId)
                                }}
                              >
                                <FiUser className="w-4 h-4" />
                              </Link>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-600">
                          {donation.isAnonymous ? '-' : (donation.donor?.email || donation.donorEmail || '-')}
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm font-bold text-slate-900">
                            ₹{parseFloat(donation.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            {paymentId && (
                              <div className="text-xs font-mono text-slate-600" title="Razorpay Payment ID">
                                {paymentId.substring(0, 12)}...
                              </div>
                            )}
                            {orderId && (
                              <div className="text-xs font-mono text-slate-500" title="Razorpay Order ID">
                                {orderId.substring(0, 12)}...
                              </div>
                            )}
                            {!paymentId && !orderId && (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                            {donation.donationType || 'General'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {getStatusBadge(donation.status)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            {donation.status === 'completed' ? (
                              <a
                                href={`${API_BASE}/donations/${donation._id || donation.id}/receipt`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg transition-colors text-sm font-semibold"
                                title="Download Receipt PDF"
                              >
                                <FiFileText className="w-4 h-4" />
                                PDF
                              </a>
                            ) : (
                              <span className="text-sm text-slate-400">—</span>
                            )}
                            {isFailed && (
                              <span className="inline-flex items-center gap-1 text-xs text-red-600" title="Requires attention">
                                <FiAlertCircle className="w-4 h-4" />
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
