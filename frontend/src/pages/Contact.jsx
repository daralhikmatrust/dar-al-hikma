import { Helmet } from "react-helmet-async"
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import PageHeader from '../components/PageHeader'
import { FiMail, FiPhone, FiMapPin, FiSend, FiClock } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../services/api'

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [contactContent, setContactContent] = useState(null)

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data } = await api.get('/content/contact')
        if (data?.contact) setContactContent(data.contact)
      } catch (e) { /* silent catch */ }
    }
    fetchContent()
  }, [])

  // Updated defaults for Dar Al Hikma
  const addressText = contactContent?.address || 'Bhagalpur, Bihar, India'
  const phone1 = contactContent?.phone1 || '+91 98765 43210'
  const email1 = contactContent?.email1 || 'info@daralhikma.org.in'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return // Prevent double-clicks

    setSubmitting(true)
    const toastId = toast.loading('Sending your enquiry...')

    try {
      // Logic Fix: Explicitly handle data response
      const { data } = await api.post('/contact', formData)
      
      if (data.success) {
        toast.success(data.message || 'Message sent successfully!', { id: toastId })
        setFormData({ name: '', email: '', subject: '', message: '' })
      } else {
        throw new Error(data.message || 'Something went wrong')
      }
    } catch (error) {
      console.error('Contact form error:', error.response || error)
      const errorMsg = error?.response?.data?.message || 'Failed to send message. Please try again later.'
      toast.error(errorMsg, { id: toastId })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans selection:bg-primary-100 selection:text-primary-900">
      <Helmet>
        <title>Contact Us | Dar Al Hikma Trust</title>
        <meta name="description" content="Reach out to Dar Al Hikma Trust for inquiries regarding donations or missions." />
        <link rel="canonical" href="https://daralhikma.org.in/contact" />
      </Helmet>
      
      <div className="absolute top-0 right-0 w-1/2 h-[600px] bg-gradient-to-bl from-primary-50/50 to-transparent -z-10" />
      
      <section className="pt-16 pb-12">
        <div className="container-custom px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <PageHeader
              title="Get in Touch"
              description="Have a question or want to support our missions? We're here to help."
            />
          </motion.div>
        </div>
      </section>

      <section className="pb-24">
        <div className="container-custom px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-stretch">
            
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-5 flex flex-col justify-between py-2"
            >
              <div className="space-y-10">
                <div>
                  <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-6">
                    Let's discuss how we can <span className="text-primary-600">drive impact.</span>
                  </h2>
                  <p className="text-lg text-slate-600 leading-relaxed max-w-md">
                    Our team aims to respond to all inquiries within 24 hours. Connect with us through the form or our official channels.
                  </p>
                </div>

                <div className="grid gap-6">
                  {[
                    { icon: <FiMapPin />, title: 'Headquarters', detail: addressText },
                    { icon: <FiPhone />, title: 'Direct Line', detail: phone1 },
                    { icon: <FiMail />, title: 'Official Email', detail: email1 },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-5 p-2 group">
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-primary-600 text-xl group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                        {item.icon}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">{item.title}</h4>
                        <p className="text-slate-900 font-medium text-lg">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-12 p-8 rounded-3xl bg-slate-900 text-white relative overflow-hidden shadow-2xl">
                <FiClock className="absolute -right-4 -bottom-4 text-9xl text-white/5 rotate-12" />
                <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <FiClock className="text-primary-400" /> Operational Hours
                </h4>
                <div className="space-y-3 text-sm text-slate-300">
                  <p className="flex justify-between border-b border-slate-800 pb-2">
                    <span>Mon — Sat</span>
                    <span className="text-white font-mono">09:00 - 18:00</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Sunday</span>
                    <span className="text-primary-400 font-bold uppercase tracking-tighter italic">By Appointment</span>
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="lg:col-span-7"
            >
              <div className="bg-white rounded-[2.5rem] p-8 md:p-14 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 relative">
                <form onSubmit={handleSubmit} className="space-y-7 relative z-10">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Your Name</label>
                      <input
                        type="text"
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 outline-none transition-all placeholder:text-slate-400"
                        placeholder="e.g. Abdullah Khan"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                      <input
                        type="email"
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 outline-none transition-all placeholder:text-slate-400"
                        placeholder="name@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Subject</label>
                    <input
                      type="text"
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 outline-none transition-all placeholder:text-slate-400"
                      placeholder="Mission Inquiry / Volunteer / Feedback"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Message Details</label>
                    <textarea
                      rows="5"
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 outline-none transition-all resize-none placeholder:text-slate-400"
                      placeholder="Tell us more about how we can help..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full group relative flex items-center justify-center gap-3 bg-primary-600 text-white py-5 rounded-2xl font-bold text-lg overflow-hidden transition-all hover:bg-primary-700 active:scale-[0.98] disabled:opacity-70 shadow-xl shadow-primary-200"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      <>
                        <span>Send Inquiry</span>
                        <FiSend className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}