<Helmet>
  <title>Donate Now | Support a Cause - Dar Al Hikma Trust</title>
  <meta name="description" content="Make a secure online donation to support education, healthcare, and emergency relief programs. Your Sadaqah and Zakat change lives." />
  <link rel="canonical" href="https://daralhikma.org.in/donate" />
</Helmet>

import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import { formatINR, normalizeAmount } from '../../utils/currency'
import toast from 'react-hot-toast'
import { FiUser, FiHeart } from 'react-icons/fi'
import { INDIAN_STATES, getCitiesForState } from '../../utils/states-countries'
// Razorpay script will be loaded dynamically

export default function Donate() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const DEFAULT_FACULTIES = ['Engineering', 'Medical', 'Education', 'Welfare']
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'INR',
    donationType: 'General',
    project: location.state?.project || '',
    faculty: '',
    notes: '',
    isAnonymous: false
  })
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      city: '',
      state: '',
      district: '',
      pincode: ''
    }
  })
  const [projects, setProjects] = useState([])
  const [faculties, setFaculties] = useState(DEFAULT_FACULTIES)
  const [loading, setLoading] = useState(false)
  // Payment method is always Razorpay (Stripe removed)
  const [assets, setAssets] = useState(null)
  const [availableCities, setAvailableCities] = useState([])

  useEffect(() => {
    fetchProjects()
    fetchAssets()
    // Pre-fill guest info if user is logged in
    if (isAuthenticated && user) {
      setGuestInfo({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || { city: '', state: '', district: '', pincode: '' }
      })
      // Set available cities if state is already set
      if (user.address?.state) {
        setAvailableCities(getCitiesForState(user.address.state))
      }
    }
  }, [isAuthenticated, user])

  // Load faculties from admin configuration (localStorage), fallback to defaults
  useEffect(() => {
    try {
      const storedFaculties = localStorage.getItem('faculties')
      if (storedFaculties) {
        const parsed = JSON.parse(storedFaculties)
        const names = parsed.map((f) => f.name).filter(Boolean)
        if (names.length) {
          setFaculties(names)
        }
      }
    } catch {
      // ignore and keep defaults
    }
  }, [])

  useEffect(() => {
    // Update available cities when state changes
    if (guestInfo.address.state) {
      setAvailableCities(getCitiesForState(guestInfo.address.state))
    } else {
      setAvailableCities([])
    }
  }, [guestInfo.address.state])

  const fetchAssets = async () => {
    try {
      const { data } = await api.get('/content/assets')
      if (data?.assets) setAssets(data.assets)
    } catch {
      // ignore
    }
  }

  const fetchProjects = async () => {
    try {
      // Load all projects so all admin-added projects are available for selection
      const { data } = await api.get('/projects')
      setProjects(data.projects)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  const handleRazorpayPayment = async () => {
    // Prevent double submission
    if (loading) {
      return
    }
    
    try {
      setLoading(true)

      // Validate guest info when not anonymous (required for all users)
      if (!formData.isAnonymous) {
        if (!guestInfo.name || !guestInfo.email) {
          toast.error('Please provide your name and email, or select anonymous donation')
          setLoading(false)
          return
        }
        // Validate all required fields when not anonymous
        if (!guestInfo.name.trim() || !guestInfo.email.trim()) {
          toast.error('Name and email are required for non-anonymous donations')
          setLoading(false)
          return
        }
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(guestInfo.email)) {
          toast.error('Please enter a valid email address')
          setLoading(false)
          return
        }
        // Validate state if "Other" is selected
        if (guestInfo.address.state === 'Other' && !guestInfo.address.district) {
          toast.error('Please enter your state name in the "Other" field')
          setLoading(false)
          return
        }
      }

      // Create order
      const orderPayload = {
        amount: normalizeAmount(formData.amount),
        currency: formData.currency,
        donationType: formData.donationType,
        project: formData.project || null,
        faculty: formData.faculty || null,
        notes: formData.notes,
        isAnonymous: formData.isAnonymous
      }

      // For anonymous donations, use minimal info (guest)
      if (formData.isAnonymous && !isAuthenticated) {
        orderPayload.donorInfo = {
          name: 'Anonymous',
          email: guestInfo.email || 'anonymous@daralhiqma.org',
          phone: '',
          address: {}
        }
      }

      // Add guest info when not anonymous (for both authenticated and non-authenticated users)
      if (!formData.isAnonymous) {
        // Handle "Other" state - use district field as state name
        const donorInfoToSend = { ...guestInfo }
        if (guestInfo.address.state === 'Other' && guestInfo.address.district) {
          donorInfoToSend.address = {
            ...guestInfo.address,
            state: guestInfo.address.district, // Use district as state name for "Other"
            district: guestInfo.address.district
          }
        }
        orderPayload.donorInfo = donorInfoToSend
      }

      const { data: orderData } = await api.post('/donations/razorpay/order', orderPayload)

      // Load Razorpay script dynamically
      if (!window.Razorpay) {
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.async = true
        await new Promise((resolve, reject) => {
          script.onload = resolve
          script.onerror = reject
          document.body.appendChild(script)
        })
      }

      // Use key from backend or env as fallback
      const razorpayKey = orderData.key || import.meta.env.VITE_RAZORPAY_KEY_ID

      const options = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'DarAlHiqma',
        description: `${formData.donationType} Donation`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            // We only need to send the signatures now, backend has the rest from Order Step
            const verifyPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            }

            const { data: verifyData } = await api.post('/donations/razorpay/verify', verifyPayload)
            toast.success('Donation successful! Receipt sent to your email.')

            // Store donation ID for receipt printing
            const donationId = verifyData?.donation?.id || verifyData?.donation?._id || verifyData?.donationId || orderData.donationId
            const paymentId = response.razorpay_payment_id
            const orderId = response.razorpay_order_id

            if (donationId) {
              const timestamp = Date.now().toString()
              localStorage.setItem('lastDonationId', donationId)
              localStorage.setItem('lastDonationIdTime', timestamp)
              localStorage.setItem('donationSuccess', 'true')
              localStorage.setItem('donationSuccessTime', timestamp)
              // Trigger a custom event to refresh dashboard
              window.dispatchEvent(new Event('donationSuccess'))
            }

            if (isAuthenticated) {
              // Trigger refresh event for dashboard (single event is sufficient)
              window.dispatchEvent(new Event('donationSuccess'))
            }

            // Navigate to success page with URL params (refresh-safe)
            const params = new URLSearchParams()
            if (paymentId) params.append('payment_id', paymentId)
            if (orderId) params.append('order_id', orderId)
            if (donationId) params.append('donation_id', donationId)

            navigate(`/payment/success?${params.toString()}`, { replace: true })
          } catch (error) {
            console.error('Payment verification error:', error)
            toast.error(error.response?.data?.message || 'Payment verification failed')
            setLoading(false)
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false)
            toast('Payment cancelled')
          }
        },
        prefill: {
          name: formData.isAnonymous ? '' : ((isAuthenticated && user?.name) || guestInfo.name),
          email: formData.isAnonymous ? '' : ((isAuthenticated && user?.email) || guestInfo.email),
          contact: formData.isAnonymous ? '' : ((isAuthenticated && user?.phone) || guestInfo.phone)
        },
        theme: {
          color: '#1a472a'
        }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error('Payment initiation error:', error)
      toast.error(error.response?.data?.message || 'Payment initiation failed. Please try again.')
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.amount || normalizeAmount(formData.amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    // Always use Razorpay (Stripe removed)
    await handleRazorpayPayment()
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        <div className="container-custom px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Make a Donation
            </h1>
            <p className="text-xl md:text-2xl text-white/90 leading-relaxed mb-4">
              Your contribution makes a meaningful difference in transforming lives and building stronger communities.
            </p>
            {!isAuthenticated && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                <span className="text-sm font-medium text-white">Guest donations welcome - no account required</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Donation Form */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-white to-slate-50">
        <div className="container-custom px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-200 shadow-lg">
            {!isAuthenticated && (
              <div className="mb-8 p-5 bg-blue-50 rounded-2xl border-2 border-blue-200">
                <h3 className="font-bold text-blue-900 mb-2 text-lg">Guest Donation</h3>
                <p className="text-sm text-blue-700">You can donate without creating an account. Simply provide your details below.</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* QR Code Section */}
              <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-6 md:p-8 border-2 border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Scan & Pay via UPI</h3>
                    <p className="text-sm text-slate-600">Quick payment using any UPI app</p>
                  </div>
                  <div className="px-4 py-2 bg-primary-600 text-white rounded-full text-xs font-bold uppercase">
                    QR Code
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="w-64 h-64 bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-4 flex items-center justify-center overflow-hidden">
                    <img
                      src={
                        assets?.donationQrUrl ||
                        'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=your-upi-id@paytm&pn=DarAlHiqma&am=&cu=INR&tn=Donation'
                      }
                      alt="Donation QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <p className="mt-4 text-center text-sm text-slate-600">
                  Or use the secure Razorpay payment button below
                </p>
              </div>

              {/* Anonymous Donation Option */}
              <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg flex-shrink-0">
                      <FiUser className="text-white text-xl" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-1 text-lg">Anonymous Donation</h3>
                      <p className="text-sm text-slate-600">Your name will not appear on public pages</p>
                    </div>
                  </div>
                  <label className="inline-flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="w-6 h-6 text-primary-600 rounded border-2 border-slate-300 focus:ring-2 focus:ring-primary-500"
                      checked={formData.isAnonymous}
                      onChange={(e) => {
                        const isChecked = e.target.checked
                        setFormData({ ...formData, isAnonymous: isChecked })
                        if (isChecked) {
                          setGuestInfo({
                            name: '',
                            email: '',
                            phone: '',
                            address: { city: '', state: '', district: '', pincode: '' }
                          })
                        } else {
                          if (isAuthenticated && user) {
                            setGuestInfo({
                              name: user.name || '',
                              email: user.email || '',
                              phone: user.phone || '',
                              address: user.address || { city: '', state: '', district: '', pincode: '' }
                            })
                          }
                        }
                      }}
                    />
                    <span className="text-sm font-semibold text-slate-700">Enable</span>
                  </label>
                </div>
              </div>

              {/* Guest Information - Show when not anonymous */}
              {!formData.isAnonymous && (
                <>
                  <div className="border-t border-slate-200 pt-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                        <FiUser className="text-white text-xl" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">Your Information</h3>
                        <p className="text-sm text-slate-600 mt-1">
                          {isAuthenticated 
                            ? 'Your account information is pre-filled. You can update it if needed.' 
                            : 'Please provide your details. All fields marked with * are required.'}
                        </p>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          className="input-field border-2"
                          value={guestInfo.name}
                          onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                          required
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          className="input-field border-2"
                          value={guestInfo.email}
                          onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                          required
                          placeholder="your.email@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          className="input-field border-2"
                          value={guestInfo.phone}
                          onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                          placeholder="Enter your phone number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          State
                        </label>
                        <select
                          className="input-field border-2 appearance-none cursor-pointer"
                          value={guestInfo.address.state}
                          onChange={(e) => {
                            const selectedState = e.target.value
                            setGuestInfo({
                              ...guestInfo,
                              address: { ...guestInfo.address, state: selectedState, city: '', district: '' }
                            })
                          }}
                        >
                          <option value="">Select State</option>
                          {INDIAN_STATES.map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                          <option value="Other">Other (Specify below)</option>
                        </select>
                        {guestInfo.address.state === 'Other' && (
                          <input
                            type="text"
                            className="input-field border-2 mt-3"
                            value={guestInfo.address.district || ''}
                            onChange={(e) => setGuestInfo({
                              ...guestInfo,
                              address: { ...guestInfo.address, district: e.target.value }
                            })}
                            placeholder="Enter your state name"
                            required
                          />
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          City
                        </label>
                        {guestInfo.address.state === 'Other' ? (
                          <input
                            type="text"
                            className="input-field border-2"
                            value={guestInfo.address.city}
                            onChange={(e) => setGuestInfo({
                              ...guestInfo,
                              address: { ...guestInfo.address, city: e.target.value }
                            })}
                            placeholder="Enter your city/district"
                            required
                          />
                        ) : (
                          <>
                            <select
                              className="input-field border-2 appearance-none cursor-pointer"
                              value={guestInfo.address.city}
                              onChange={(e) => {
                                const selectedCity = e.target.value
                                setGuestInfo({
                                  ...guestInfo,
                                  address: { 
                                    ...guestInfo.address, 
                                    city: selectedCity,
                                    // For "Other", keep the typed value in district
                                    district: selectedCity === 'Other' ? guestInfo.address.district : ''
                                  }
                                })
                              }}
                              disabled={!guestInfo.address.state}
                            >
                              <option value="">
                                {guestInfo.address.state ? 'Select City' : 'Select State First'}
                              </option>
                              {availableCities.map((city) => (
                                <option key={city} value={city}>
                                  {city}
                                </option>
                              ))}
                              {availableCities.length > 0 && (
                                <option value="Other">Other (Specify below)</option>
                              )}
                            </select>
                            {guestInfo.address.city === 'Other' && (
                              <input
                                type="text"
                                className="input-field border-2 mt-3"
                                value={guestInfo.address.district || ''}
                                onChange={(e) =>
                                  setGuestInfo({
                                    ...guestInfo,
                                    address: {
                                      ...guestInfo.address,
                                      district: e.target.value,
                                      city: 'Other'
                                    }
                                  })
                                }
                                placeholder="Enter your city name"
                                required
                              />
                            )}
                            {guestInfo.address.state && availableCities.length === 0 && (
                              <input
                                type="text"
                                className="input-field border-2 mt-3"
                                value={guestInfo.address.city}
                                onChange={(e) =>
                                  setGuestInfo({
                                    ...guestInfo,
                                    address: {
                                      ...guestInfo.address,
                                      city: e.target.value
                                    }
                                  })
                                }
                                placeholder="Enter your city"
                              />
                            )}
                          </>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Pincode
                        </label>
                        <input
                          type="text"
                          className="input-field border-2"
                          value={guestInfo.address.pincode}
                          onChange={(e) => setGuestInfo({
                            ...guestInfo,
                            address: { ...guestInfo.address, pincode: e.target.value }
                          })}
                          placeholder="Enter your pincode"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Donation Amount */}
              <div className="bg-gradient-to-br from-primary-50 to-white rounded-2xl p-6 md:p-8 border-2 border-primary-200 shadow-lg">
                <label className="block text-xl font-bold text-slate-900 mb-4">
                  Donation Amount *
                </label>
                <div className="flex max-w-md">
                  <span className="inline-flex items-center px-6 py-4 text-xl border-2 border-r-0 border-primary-300 rounded-l-xl bg-primary-100 text-primary-700 font-bold">
                    {formData.currency === 'INR' ? '₹' : '$'}
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9.]*"
                    className="input-field rounded-l-none text-xl py-4 border-2 border-primary-300 focus:border-primary-500 font-semibold"
                    value={formData.amount}
                    onInput={(e) => {
                      // Only allow numbers and single decimal point
                      let value = e.target.value.replace(/[^0-9.]/g, '')
                      // Prevent multiple decimal points
                      const parts = value.split('.')
                      if (parts.length > 2) {
                        value = parts[0] + '.' + parts.slice(1).join('')
                      }
                      // Prevent more than 2 decimal places
                      if (parts.length === 2 && parts[1].length > 2) {
                        value = parts[0] + '.' + parts[1].substring(0, 2)
                      }
                      setFormData({ ...formData, amount: value })
                    }}
                    onKeyDown={(e) => {
                      // Block all non-numeric keys except control keys
                      const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']
                      const isNumber = /[0-9]/.test(e.key)
                      const isDecimal = e.key === '.' && !formData.amount.includes('.')
                      const isControl = allowedKeys.includes(e.key) || (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase()))

                      if (!isNumber && !isDecimal && !isControl) {
                        e.preventDefault()
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault()
                      const pastedText = e.clipboardData.getData('text')
                      const numbersOnly = pastedText.replace(/[^0-9.]/g, '')
                      const parts = numbersOnly.split('.')
                      let finalValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numbersOnly
                      if (parts.length === 2 && parts[1].length > 2) {
                        finalValue = parts[0] + '.' + parts[1].substring(0, 2)
                      }
                      setFormData({ ...formData, amount: finalValue })
                    }}
                    placeholder="0.00"
                    required
                  />
                </div>
                <p className="text-sm text-slate-600 mt-3">Enter the amount you wish to donate</p>
              </div>

              {/* Currency & Donation Type */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Currency
                  </label>
                  <select
                    className="input-field border-2"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  >
                    <option value="INR">INR (Indian Rupee)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="GBP">GBP (British Pound)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Donation Type *
                  </label>
                  <select
                    className="input-field border-2"
                    value={formData.donationType}
                    onChange={(e) => setFormData({ ...formData, donationType: e.target.value })}
                    required
                  >
                    <option value="General">General Donation</option>
                    <option value="Zakat">Zakat</option>
                    <option value="Sadaqa">Sadaqa</option>
                    <option value="SadaqaJaria">Sadaqa Jaria</option>
                    <option value="Project">Project Specific</option>
                    <option value="Faculty">Category Specific</option>
                  </select>
                </div>
              </div>

              {/* Project Selection */}
              {(formData.donationType === 'Project' || formData.donationType === 'General') && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Select Project (Optional)
                  </label>
                  <select
                    className="input-field border-2"
                    value={formData.project}
                    onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                  >
                    <option value="">No specific project</option>
                    {projects.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.title} - {project.faculty}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Category Selection (previously Faculty) */}
              {(formData.donationType === 'Faculty' || formData.donationType === 'General') && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Select Category (Optional)
                  </label>
                  <select
                    className="input-field border-2"
                    value={formData.faculty}
                    onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                  >
                    <option value="">No specific category</option>
                    {faculties.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows="4"
                  className="input-field border-2 resize-none"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any special instructions or messages for your donation..."
                ></textarea>
              </div>

              {/* Security & Trust Section */}
              <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-6 border-2 border-green-200">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center shadow-lg flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 mb-2 text-lg">Secure Payment via Razorpay</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Your payment is processed securely through Razorpay's encrypted payment gateway. All transactions are PCI-DSS compliant and protected.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">✓ SSL Encrypted</span>
                      <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">✓ PCI-DSS Compliant</span>
                      <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold">✓ Secure Gateway</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 text-white px-8 py-5 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <FiHeart className="w-5 h-5" />
                    <span>Donate {formData.currency === 'INR' ? '₹' : '$'}{formData.amount || '0'} via Razorpay</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}

