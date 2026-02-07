import { Link, useNavigate } from 'react-router-dom'
import { 
  FiTwitter, 
  FiFacebook, 
  FiInstagram, 
  FiYoutube, 
  FiMapPin, 
  FiPhone, 
  FiMail,
  FiHeart,
  FiCheckCircle,
  FiAward,
  FiShield,
  FiZap,
  FiFileText,
  FiExternalLink // Added for legal links
} from 'react-icons/fi'

export default function Footer() {
  const navigate = useNavigate()

  const handleLinkClick = (path) => {
    if (path.startsWith('http')) {
      window.open(path, '_blank')
      return
    }
    navigate(path)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="bg-slate-950 text-slate-400 pt-20 pb-10 border-t border-slate-900 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Grid Area */}
        <div className="grid md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          
          {/* Column 1: Mission & Brand */}
          <div className="lg:col-span-4 space-y-8">
            <div>
              <h3 className="text-white text-2xl font-black mb-3 tracking-tight">
                Dar Al Hikma<span className="text-indigo-500">.</span>
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
                A non-profit organization dedicated to creating sustainable impact through education and healthcare for the underserved.
              </p>
            </div>

            <div className="flex gap-4">
              {[
                { Icon: FiTwitter, link: '#' },
                { Icon: FiFacebook, link: '#' },
                { Icon: FiInstagram, link: '#' },
                { Icon: FiYoutube, link: '#' }
              ].map(({ Icon, link }, i) => (
                <a 
                  key={i} 
                  href={link} 
                  className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:border-indigo-500 hover:text-white transition-all duration-300 group"
                >
                  <Icon size={18} className="group-hover:scale-110 transition-transform" />
                </a>
              ))}
            </div>

            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-900/50 border border-slate-800/50">
              <FiShield className="text-indigo-500" size={18} />
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Verified 80G Tax Exempt</span>
            </div>
          </div>

          {/* Column 2: Navigation - UPDATED WITH LEGAL LINKS */}
          <div className="lg:col-span-2 lg:pl-4">
            <h4 className="text-white font-bold mb-6 text-xs uppercase tracking-[0.2em]">Explore</h4>
            <ul className="space-y-4 text-sm">
              {[
                { name: 'About Us', path: '/about-us' },
                { name: 'Our Projects', path: '/projects' },
                { name: 'Media Gallery', path: '/media' },
                { name: 'Privacy Policy', path: '/privacy-policy' }, // New
                { name: 'Terms of Service', path: '/terms' }       // New
              ].map((item) => (
                <li key={item.name}>
                  <button 
                    onClick={() => handleLinkClick(item.path)}
                    className="hover:text-indigo-400 transition-colors text-left flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-slate-800 group-hover:bg-indigo-500 transition-all"></span>
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Impact Actions */}
          <div className="lg:col-span-3">
            <h4 className="text-white font-bold mb-6 text-xs uppercase tracking-[0.2em]">Quick Actions</h4>
            <div className="space-y-3">
              <button 
                onClick={() => handleLinkClick('/donate')}
                className="w-full flex items-center justify-between px-5 py-3 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all group shadow-lg shadow-indigo-500/5"
              >
                <span className="text-sm font-bold flex items-center gap-2">
                  <FiHeart className="group-hover:fill-white transition-colors" /> Donate Now
                </span>
                <FiZap size={14} />
              </button>
              
              <button 
                onClick={() => handleLinkClick('/zakat-calculator')}
                className="w-full flex items-center justify-between px-5 py-3 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all group"
              >
                <span className="text-sm font-bold flex items-center gap-2">
                  <FiCheckCircle /> Zakat Calculator
                </span>
                <FiAward size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>

          {/* Column 4: Reach Out */}
          <div className="lg:col-span-3">
            <h4 className="text-white font-bold mb-6 text-xs uppercase tracking-[0.2em]">Reach Us</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <FiMapPin className="mt-1 text-indigo-500 shrink-0" size={16} />
                <span className="leading-relaxed">123, Trust Road, Knowledge City, New Delhi, India 110001</span>
              </li>
              <li className="flex items-center gap-3">
                <FiPhone className="text-indigo-500 shrink-0" size={16} />
                <span className="font-mono">+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-3">
                <FiMail className="text-indigo-500 shrink-0" size={16} />
                <span>info@daralhikma.org</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar - UPDATED FOR SEO TRUST */}
        <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center text-[11px] text-slate-600 gap-6">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-center md:text-left">
            <p>&copy; {new Date().getFullYear()} Dar Al Hikma Trust. All rights reserved.</p>
            <span className="hidden md:block w-1 h-1 rounded-full bg-slate-800"></span>
            
            {/* Added subtle legal links for SEO crawlers */}
            <div className="flex gap-4">
               <button onClick={() => handleLinkClick('/privacy-policy')} className="hover:text-slate-400">Privacy</button>
               <button onClick={() => handleLinkClick('/terms')} className="hover:text-slate-400">Terms</button>
            </div>

            <span className="hidden md:block w-1 h-1 rounded-full bg-slate-800"></span>
            <p className="flex items-center gap-2">
              <FiFileText size={12} className="text-slate-700" />
              Registered Charity under the Indian Trust Act, 1882
            </p>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/30 border border-slate-900">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="uppercase tracking-[0.15em] font-black text-[9px] text-slate-500">System Live</span>
          </div>
        </div>
      </div>
    </footer>
  )
}