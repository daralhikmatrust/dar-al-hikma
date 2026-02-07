import { Helmet } from 'react-helmet-async'
import { FiShield, FiLock, FiMail, FiCreditCard, FiFileText } from 'react-icons/fi'

export default function PrivacyPolicy() {
  const sections = [
    {
      icon: FiShield,
      title: 'Information We Collect',
      content: 'We collect information necessary to process your donations and provide you with updates. This includes your name, email address, phone number, and donation amount when you make a contribution. We do not collect sensitive payment card details—all financial transactions are securely processed through Razorpay.'
    },
    {
      icon: FiLock,
      title: 'How We Use Your Information',
      content: 'Your information is used solely to process donations, issue tax exemption receipts (80G), send acknowledgments, and provide occasional updates about our projects. We never sell, rent, or share your personal data with third parties for marketing purposes.'
    },
    {
      icon: FiCreditCard,
      title: 'Payment Security',
      content: 'All payments are processed through Razorpay, a PCI-DSS compliant payment gateway. We do not store your card details. Your financial data is encrypted and handled according to industry best practices.'
    },
    {
      icon: FiMail,
      title: 'Communication',
      content: 'By donating, you may receive transactional emails (receipts, confirmations) and optional newsletters about our work. You can opt out of non-essential communications at any time.'
    },
    {
      icon: FiFileText,
      title: 'Data Retention & Your Rights',
      content: 'We retain donation records as required by law for audit and tax purposes. You have the right to request access to your data, corrections, or deletion subject to legal obligations. Contact us at info@daralhikma.org for any privacy-related requests.'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Privacy Policy | Dar Al Hikma Trust</title>
        <meta name="description" content="Read our privacy policy to understand how Dar Al Hikma Trust protects and manages your personal and donation data." />
        <link rel="canonical" href="https://daralhikma.org.in/privacy-policy" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 px-8 py-12 md:py-16">
            <div className="flex items-center gap-3 mb-4">
              <FiShield className="w-10 h-10 text-white/90" />
              <span className="text-primary-200 text-sm font-bold uppercase tracking-widest">Legal</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Privacy Policy</h1>
            <p className="mt-4 text-primary-100 text-lg max-w-2xl">
              Your trust matters. Learn how we protect and use your information at Dar Al Hikma Trust.
            </p>
            <p className="mt-2 text-primary-200/80 text-sm">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="p-8 md:p-12 space-y-10">
            <p className="text-slate-600 leading-relaxed">
              At Dar Al Hikma Trust, we are committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information when you visit our website or make a donation.
            </p>

            {sections.map((section, idx) => (
              <div key={idx} className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center">
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
                For questions about this policy or your data, contact us at{' '}
                <a href="mailto:info@daralhikma.org" className="text-primary-600 font-semibold hover:underline">info@daralhikma.org</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
