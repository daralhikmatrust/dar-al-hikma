import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../../services/api'
import { formatINR, normalizeAmount } from '../../utils/currency'
import { FiDownload, FiPrinter } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { getPaymentTime } from '../../utils/paymentTime'

export default function Donations() {
  const location = useLocation()
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [lastDonationId, setLastDonationId] = useState(null)

  useEffect(() => {
    fetchDonations()
    // Check if we should show receipt modal
    const donationId = location.state?.donationId || localStorage.getItem('lastDonationId')
    const showReceipt = location.state?.showReceipt || localStorage.getItem('donationSuccess') === 'true'
    if (donationId && showReceipt) {
      setLastDonationId(donationId)
      setShowReceiptModal(true)
      localStorage.removeItem('lastDonationId')
      localStorage.removeItem('donationSuccess')
      localStorage.removeItem('donationSuccessTime')
    }
    // Refresh if coming from payment
    if (location.state?.refresh) {
      setTimeout(() => fetchDonations(), 500)
    }
  }, [location])

  // Also listen for donation success events
  useEffect(() => {
    const handleDonationSuccess = () => {
      setTimeout(() => fetchDonations(), 1000)
    }
    window.addEventListener('donationSuccess', handleDonationSuccess)
    return () => window.removeEventListener('donationSuccess', handleDonationSuccess)
  }, [])

  const fetchDonations = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/donations/my-donations')
      // Sort donations by date (newest first)
      const allDonations = data.donations || []
      const sortedDonations = allDonations.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created_at || 0)
        const dateB = new Date(b.createdAt || b.created_at || 0)
        return dateB - dateA
      })
      setDonations(sortedDonations)
      // Calculate total from donations if not provided
      const calculatedTotal = sortedDonations.reduce((sum, d) => sum + normalizeAmount(d.amount), 0)
      setTotal(data.total || calculatedTotal)
    } catch (error) {
      console.error('Failed to fetch donations:', error)
      toast.error('Failed to load donations. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

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
      window.URL.revokeObjectURL(url)
      toast.success('Receipt downloaded')
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
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const printWindow = window.open(url, '_blank', 'noopener,noreferrer')
      if (printWindow) {
        const doPrint = () => {
          try {
            printWindow.focus()
            printWindow.print()
          } catch {
            printWindow.close()
          }
          window.URL.revokeObjectURL(url)
        }
        printWindow.onload = () => setTimeout(doPrint, 600)
        // Fallback: PDF viewers may not fire onload
        setTimeout(doPrint, 2000)
        toast.success('Opening print dialog...')
      } else {
        const iframe = document.createElement('iframe')
        iframe.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:none;z-index:9999'
        iframe.src = url
        document.body.appendChild(iframe)
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus()
            iframe.contentWindow?.print()
          } catch { /* ignore */ }
          setTimeout(() => {
            document.body.removeChild(iframe)
            window.URL.revokeObjectURL(url)
          }, 1500)
        }, 800)
        toast.success('Opening print dialog...')
      }
    } catch (error) {
      console.error('Failed to print receipt:', error)
      toast.error('Failed to print receipt')
    }
  }

  return (
    <div>
      <section className="bg-gradient-to-br from-primary-700 to-primary-800 text-white section-padding">
        <div className="container-custom">
          <h1 className="text-4xl font-bold mb-2">My Donations</h1>
          <p className="text-gray-100">View all your donation history</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          <div className="card mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Contributions</p>
                <p className="text-3xl font-bold text-primary-600">
                  {formatINR(total)}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Donations</p>
                <p className="text-3xl font-bold text-primary-600">
                  {donations.length}
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : donations.length > 0 ? (
            <div className="card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold">Date</th>
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold">Amount</th>
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold">Type</th>
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold">Project</th>
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((donation) => (
                    <tr key={donation._id || donation.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {getPaymentTime(donation).toLocaleString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true
                        })}
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        {formatINR(donation.amount || 0)}
                      </td>
                      <td className="py-3 px-4">{donation.donationType || donation.donation_type || 'General'}</td>
                      <td className="py-3 px-4">
                        {donation.project?.title || donation.project || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          donation.status === 'completed' ? 'bg-green-100 text-green-700' :
                          donation.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {donation.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {donation.status === 'completed' ? (
                          <div className="flex items-center gap-3 flex-wrap">
                            <button
                              onClick={() => downloadReceipt(donation._id || donation.id)}
                              className="text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors text-sm font-semibold"
                              title="Download Receipt"
                            >
                              <FiDownload size={16} /> Download
                            </button>
                            <button
                              onClick={() => printReceipt(donation._id || donation.id)}
                              className="text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors text-sm font-semibold"
                              title="Print Receipt"
                            >
                              <FiPrinter size={16} /> Print
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Not available</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-gray-500 mb-4">No donations yet.</p>
              <a href="/user/donate" className="btn-primary inline-block">
                Make Your First Donation
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Receipt Print Modal */}
      {showReceiptModal && lastDonationId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 animate-scale-in">
            <div className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white shadow-xl">
                <FiPrinter className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-primary-700 mb-4">Donation Successful!</h2>
              <p className="text-gray-600 mb-6">Your donation receipt is ready. Would you like to print or download it?</p>
              <div className="flex flex-wrap gap-3 justify-center items-center">
                <button
                  onClick={() => {
                    printReceipt(lastDonationId)
                    setShowReceiptModal(false)
                  }}
                  className="btn-primary flex items-center justify-center gap-2 px-6 py-3 min-w-[140px]"
                >
                  <FiPrinter className="w-5 h-5" />
                  Print Receipt
                </button>
                <button
                  onClick={() => {
                    downloadReceipt(lastDonationId)
                    setShowReceiptModal(false)
                  }}
                  className="btn-outline flex items-center justify-center gap-2 px-6 py-3 min-w-[140px]"
                >
                  <FiDownload className="w-5 h-5" />
                  Download
                </button>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="btn-outline px-6 py-3 min-w-[100px]"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

