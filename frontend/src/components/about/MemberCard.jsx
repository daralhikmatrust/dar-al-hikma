import { useState } from 'react'
import { FiUser, FiChevronDown, FiChevronUp } from 'react-icons/fi'

/**
 * Professional Member Card Component
 * Matches Admin Dashboard design language with card-based layout
 * Used for Council, Advisory Board, and Legal & Financial Team members
 */
export default function MemberCard({ member }) {
  const [expanded, setExpanded] = useState(false)
  const [photoError, setPhotoError] = useState(false)
  const hasLongDesc = member.description && member.description.length > 180
  const shortDesc = hasLongDesc ? member.description.slice(0, 180) + '...' : member.description
  const showPhoto = member.photo && !photoError

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-1 group">
      <div className="p-5">
        <div className="flex gap-4">
          {/* Profile Photo - proper sizing, no upscaling, object-cover for aspect ratio */}
          <div className="flex-shrink-0 w-32 h-32 min-w-[8rem]">
            {showPhoto ? (
              <img 
                src={member.photo} 
                alt={member.name}
                className="w-full h-full rounded-xl object-cover border-2 border-slate-200 group-hover:border-primary-300 transition-colors max-w-full"
                style={{ imageRendering: 'auto' }}
                loading="lazy"
                onError={() => setPhotoError(true)}
              />
            ) : (
              <div className="w-full h-full rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center border-2 border-slate-200 group-hover:border-primary-300 transition-colors">
                <FiUser className="w-14 h-14 text-slate-400" />
              </div>
            )}
          </div>

          {/* Member Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-primary-700 transition-colors">
              {member.name}
            </h3>
            {member.role && (
              <p className="text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                {member.role}
              </p>
            )}
            {member.description && (
              <p className="text-sm text-slate-600 leading-relaxed">
                {expanded ? member.description : shortDesc}
              </p>
            )}
          </div>
        </div>

        {/* Read More Button */}
        {hasLongDesc && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-3 flex items-center gap-1.5 text-primary-600 hover:text-primary-700 text-sm font-semibold transition-colors"
          >
            {expanded ? (
              <>
                <span>Read less</span>
                <FiChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Read more</span>
                <FiChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
