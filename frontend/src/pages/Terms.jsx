import { Helmet } from 'react-helmet-async'
import { FiFileText, FiCheckCircle, FiAlertCircle, FiHeart } from 'react-icons/fi'

export default function Terms() {
  const sections = [
    {
      icon: FiCheckCircle,
      title: 'Acceptance of Terms',
      content: 'By using the Dar Al Hikma Trust website, you agree to these terms and conditions. If you do not agree, please do not use our services. We reserve the right to update these terms to ensure compliance with applicable laws.'
    },
    {
      icon: FiHeart,
      title: 'Donations',
      content: 'All donations are voluntary and non-refundable. Donations are used for charitable purposes including education, healthcare, and welfare initiatives. You will receive a tax-exempt receipt (80G) for eligible contributions. We do not guarantee any specific outcome from your donation.'
    },
    {
      icon: FiAlertCircle,
      title: 'Use of Website',
      content: 'You agree to use our website only for lawful purposes. You may not attempt to gain unauthorized access to our systems, interfere with the site\'s operation, or use it for any fraudulent or harmful activity. We may suspend or terminate access for violations.'
    },
    {
      icon: FiFileText,
      title: 'Intellectual Property',
      content: 'All content on this website—including text, images, and logos—is the property of Dar Al Hikma Trust and is protected by applicable laws. You may not reproduce or distribute our content without prior written permission.'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Terms & Conditions | Dar Al Hikma Trust</title>
        <meta name="description" content="Terms and conditions for using the Dar Al Hikma Trust website and making charitable donations." />
        <link rel="canonical" href="https://daralhikma.org.in/terms" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-8 py-12 md:py-16">
            <div className="flex items-center gap-3 mb-4">
              <FiFileText className="w-10 h-10 text-primary-400" />
              <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">Legal</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Terms & Conditions</h1>
            <p className="mt-4 text-slate-300 text-lg max-w-2xl">
              By using our website and services, you agree to the following terms.
            </p>
            <p className="mt-2 text-slate-400 text-sm">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="p-8 md:p-12 space-y-10">
            <p className="text-slate-600 leading-relaxed">
              Dar Al Hikma Trust operates this website to support our mission of education and welfare. By accessing or using our services, you acknowledge that you have read and understood these terms.
            </p>

            {sections.map((section, idx) => (
              <div key={idx} className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <section.icon className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">{section.title}</h2>
                  <p className="text-slate-600 leading-relaxed">{section.content}</p>
                </div>
              </div>
            ))}

            <div className="border-t border-slate-200 pt-8">
              <p className="text-slate-600">
                For questions about these terms, contact us at{' '}
                <a href="mailto:info@daralhikma.org" className="text-primary-600 font-semibold hover:underline">info@daralhikma.org</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
