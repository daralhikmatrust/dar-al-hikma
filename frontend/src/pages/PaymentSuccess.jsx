import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { FiCheckCircle, FiHome, FiHeart, FiPrinter, FiUser, FiDownload, FiLoader } from 'react-icons/fi'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { getPaymentTime } from '../utils/paymentTime'
import { formatAmountByCurrency } from '../utils/currency'

function formatDate(dateString) {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata'
    })
}

export default function PaymentSuccess() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()
    
    const [donation, setDonation] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Get identifiers from URL params (refresh-safe) or location state (fallback)
    const paymentId = searchParams.get('payment_id')
    const orderId = searchParams.get('order_id')
    const donationId = searchParams.get('donation_id')

    useEffect(() => {
        const fetchPayment = async () => {
            try {
                setLoading(true)
                setError(null)

                // Try to fetch from backend using payment_id or order_id
                if (paymentId || orderId) {
                    const params = new URLSearchParams()
                    if (paymentId) params.append('payment_id', paymentId)
                    if (orderId) params.append('order_id', orderId)

                    const { data } = await api.get(`/donations/payment?${params.toString()}`)
                    
                    if (data.success && data.donation) {
                        setDonation(data.donation)
                        // Update URL with donation_id for receipt download
                        if (!donationId && data.donation.id) {
                            const newParams = new URLSearchParams(window.location.search)
                            newParams.set('donation_id', data.donation.id)
                            navigate(`/payment/success?${newParams.toString()}`, { replace: true })
                        }
                        return
                    }
                }

                // Fallback: Try donation_id if available
                if (donationId) {
                    const { data } = await api.get(`/donations/${donationId}`)
                    if (data.success && data.donation) {
                        // Only show if payment is completed
                        if (data.donation.status === 'completed') {
                            setDonation(data.donation)
                            return
                        } else {
                            throw new Error('Payment not completed')
                        }
                    }
                }

                // If no valid payment found
                throw new Error('Payment information not found')
            } catch (err) {
                console.error('Failed to fetch payment:', err)
                setError(err.response?.data?.message || err.message || 'Failed to load payment information')
                
                // If it's a 404 or not found, redirect after delay
                if (err.response?.status === 404 || err.message.includes('not found')) {
                    setTimeout(() => {
                        navigate('/', { replace: true })
                    }, 3000)
                }
            } finally {
                setLoading(false)
            }
        }

        // Only fetch if we have at least one identifier
        if (paymentId || orderId || donationId) {
            fetchPayment()
        } else {
            setError('Payment information not found')
            setLoading(false)
        }
    }, [paymentId, orderId, donationId, navigate])

    const handleDownloadReceipt = async () => {
        if (!donation?.id) {
            toast.error('Receipt ID missing')
            return
        }
        try {
            const response = await api.get(`/donations/${donation.id}/receipt`, {
                responseType: 'blob'
            })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `receipt-${donation.receiptNumber || donation.id}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
            toast.success('Receipt downloaded')
        } catch (error) {
            console.error('Failed to download receipt:', error)
            toast.error(error.response?.data?.message || 'Failed to download receipt')
        }
    }

    const handlePrintReceipt = async () => {
        if (!donation?.id) {
            toast.error('Receipt ID missing')
            return
        }
        try {
            const response = await api.get(`/donations/${donation.id}/receipt`, {
                responseType: 'blob'
            })
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
            const printWindow = window.open(url, '_blank', 'noopener,noreferrer')
            if (printWindow) {
                printWindow.onload = () => {
                    setTimeout(() => {
                        try {
                            printWindow.print()
                            printWindow.onafterprint = () => {
                                printWindow.close()
                                window.URL.revokeObjectURL(url)
                            }
                        } catch {
                            printWindow.close()
                            window.URL.revokeObjectURL(url)
                        }
                    }, 600)
                }
                // Fallback if onload doesn't fire (PDF viewers may not trigger it)
                setTimeout(() => {
                    try {
                        if (printWindow.print) printWindow.print()
                        window.URL.revokeObjectURL(url)
                    } catch { /* ignore */ }
                }, 1800)
                toast.success('Opening print dialog...')
            } else {
                toast.error('Popup blocked. Please download the receipt instead.')
                handleDownloadReceipt()
            }
        } catch (error) {
            console.error('Failed to print receipt:', error)
            toast.error(error.response?.data?.message || 'Failed to print receipt')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center section-padding">
                <div className="text-center">
                    <FiLoader className="w-12 h-12 mx-auto mb-4 animate-spin text-green-600" />
                    <h2 className="text-xl font-semibold text-gray-700">Loading payment information...</h2>
                </div>
            </div>
        )
    }

    if (error || !donation) {
        return (
            <div className="min-h-screen flex items-center justify-center section-padding">
                <div className="text-center max-w-md">
                    <h2 className="text-2xl font-bold mb-4 text-red-600">Payment Information Not Found</h2>
                    <p className="text-gray-600 mb-6">{error || 'Unable to retrieve payment details. Please check your email for the receipt.'}</p>
                    <div className="space-y-3">
                        <Link 
                            to="/" 
                            className="block w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors text-center"
                        >
                            Return Home
                        </Link>
                        {isAuthenticated && (
                            <Link 
                                to="/user/dashboard" 
                                className="block w-full px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors text-center"
                            >
                                View Dashboard
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    // Only show success if payment is completed
    if (donation.status !== 'completed') {
        return (
            <div className="min-h-screen flex items-center justify-center section-padding">
                <div className="text-center max-w-md">
                    <h2 className="text-2xl font-bold mb-4 text-yellow-600">Payment {donation.status}</h2>
                    <p className="text-gray-600 mb-6">
                        Your payment status is: <strong>{donation.status}</strong>. 
                        {donation.status === 'pending' && ' Please wait for payment confirmation.'}
                        {donation.status === 'failed' && ' Please try again or contact support.'}
                    </p>
                    <Link 
                        to="/" 
                        className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors inline-block"
                    >
                        Return Home
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center section-padding py-12">
            <div className="max-w-2xl w-full">
                <div className="card bg-white/95 backdrop-blur border-2 border-green-200 shadow-2xl p-8 md:p-12 animate-scale-in">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white shadow-xl animate-bounce-in">
                        <FiCheckCircle className="w-10 h-10" />
                    </div>

                    <h1 className="text-3xl font-bold text-green-800 mb-2 text-center">
                        Donation Successful!
                    </h1>

                    <p className="text-center text-gray-600 mb-8">
                        Thank you for your generous contribution. Your support helps us make a real difference.
                    </p>

                    {/* Payment Details Card */}
                    <div className="bg-green-50 rounded-xl p-6 mb-6 border border-green-100">
                        <h2 className="text-lg font-semibold text-green-800 mb-4">Payment Details</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Donor Name:</span>
                                <span className="font-semibold">{donation.donorName || 'Anonymous'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Amount Paid:</span>
                                <span className="text-2xl font-bold text-green-700">
                                    {formatAmountByCurrency(donation.amount, donation.currency)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Transaction ID:</span>
                                <span className="font-mono text-sm">{donation.paymentId || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Order ID:</span>
                                <span className="font-mono text-sm">{donation.orderId || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Receipt Number:</span>
                                <span className="font-semibold">{donation.receiptNumber || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Date & Time:</span>
                                <span className="text-sm">
                                  {formatDate(getPaymentTime(donation).toISOString())}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Payment Status:</span>
                                <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 font-semibold text-sm">
                                    {donation.status.toUpperCase()}
                                </span>
                            </div>
                            {donation.donationType && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Donation Type:</span>
                                    <span className="font-semibold">{donation.donationType}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Trust Information */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                        <h3 className="font-semibold text-gray-800 mb-2">Dar Al Hikma Trust</h3>
                        <p className="text-sm text-gray-600">
                            This receipt is valid for tax purposes under Section 80G of the Income Tax Act, 1961.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleDownloadReceipt}
                                className="px-4 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <FiDownload className="w-5 h-5" />
                                Download Receipt
                            </button>
                            <button
                                onClick={handlePrintReceipt}
                                className="px-4 py-3 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <FiPrinter className="w-5 h-5" />
                                Print Receipt
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Link
                                to="/donate"
                                className="px-4 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <FiHeart className="w-4 h-4" />
                                Donate Again
                            </Link>

                            {isAuthenticated ? (
                                <Link
                                    to="/user/dashboard?refresh=true"
                                    className="px-4 py-3 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                                    onClick={() => {
                                        // Ensure refresh flags are set
                                        localStorage.setItem('donationSuccess', 'true')
                                        localStorage.setItem('donationSuccessTime', Date.now().toString())
                                        if (donation?.id || donation?._id) {
                                          localStorage.setItem('lastDonationId', donation.id || donation._id)
                                          localStorage.setItem('lastDonationIdTime', Date.now().toString())
                                        }
                                        // Trigger event for immediate refresh
                                        window.dispatchEvent(new Event('donationSuccess'))
                                    }}
                                >
                                    <FiUser className="w-4 h-4" />
                                    View Dashboard
                                </Link>
                            ) : (
                                <Link
                                    to="/"
                                    className="px-4 py-3 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <FiHome className="w-4 h-4" />
                                    Home
                                </Link>
                            )}
                        </div>
                    </div>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        An acknowledgement email with the receipt has been sent to your inbox.
                    </p>
                </div>
            </div>
        </div>
    )
}
