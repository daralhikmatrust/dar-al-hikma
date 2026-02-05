import { Link } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'

/**
 * Professional About Us Page Header
 * Compact, dashboard-style header matching admin design language
 * Includes breadcrumb navigation back to main About page
 */
export default function AboutPageHeader({ title, description, showBackLink = true }) {
  return (
    <div className="mb-6">
      {showBackLink && (
        <Link 
          to="/about/who-we-are" 
          className="inline-flex items-center gap-2 text-slate-600 hover:text-primary-600 font-semibold text-sm mb-4 transition-colors group"
        >
          <FiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to About Us</span>
        </Link>
      )}
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
          {title}
        </h1>
        {description && (
          <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-4xl">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
