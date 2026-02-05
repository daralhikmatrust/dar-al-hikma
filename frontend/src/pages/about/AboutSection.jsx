import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../services/api'
import AboutPageHeader from '../../components/about/AboutPageHeader'
import MemberCard from '../../components/about/MemberCard'
import AuditCard from '../../components/about/AuditCard'
import { FiAlertCircle, FiArrowLeft, FiChevronDown } from 'react-icons/fi'

const ROUTE_TO_KEY = {
  'who-we-are': 'who_we_are',
  'why-dar-al-hikma': 'why_dar_al_hikma',
  'our-council': 'council',
  'advisory-board': 'advisory',
  'legal-financial': 'legal_financial',
  'legal-financial-team': 'legal_financial',
  'audit': 'audit'
}

const SECTION_TITLES = {
  who_we_are: 'Who We Are',
  why_dar_al_hikma: 'Why Dar Al Hikma',
  council: 'Our Council',
  advisory: 'Advisory Board',
  legal_financial: 'Legal & Financial Team',
  audit: 'Audit Reports'
}

const SECTION_DESCRIPTIONS = {
  who_we_are: 'Learn about our mission, vision, and the values that drive Dar Al Hikma Trust.',
  why_dar_al_hikma: 'Discover why Dar Al Hikma Trust is committed to making a difference in our community.',
  council: 'Meet the dedicated members of our Zakat Council who guide our strategic direction.',
  advisory: 'Our Advisory Board brings expertise and wisdom to support our mission.',
  legal_financial: 'The Legal & Financial Team ensures transparency and compliance in all our operations.',
  audit: 'Access our annual audit reports demonstrating our commitment to financial transparency.'
}

export default function AboutSection() {
  const { section: sectionSlug } = useParams()
  const sectionKey = ROUTE_TO_KEY[sectionSlug]
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        const { data } = await api.get('/about-us')
        setContent(data)
      } catch {
        setContent({ sections: {}, council: [], advisory: [], legalFinancial: [], auditReports: [] })
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [sectionSlug])

  if (!sectionKey) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Page Not Found</h2>
          <p className="text-slate-600 mb-6">The requested About Us section does not exist.</p>
          <Link 
            to="/about/who-we-are" 
            className="inline-block px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
          >
            Back to About Us
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading content...</p>
        </div>
      </div>
    )
  }

  const sections = content?.sections || {}
  const section = sections[sectionKey]
  const title = section?.title || SECTION_TITLES[sectionKey]
  const description = section?.description || SECTION_DESCRIPTIONS[sectionKey] || ''

  // AUDIT REPORTS PAGE
  if (sectionKey === 'audit') {
    const auditReports = content?.auditReports || []
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AboutPageHeader 
          title={title}
          description={description}
        />

        {auditReports.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiAlertCircle className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Audit Reports Available</h3>
            <p className="text-slate-600">
              Audit reports will appear here once they are added by the administrator.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {auditReports.map((report) => (
              <AuditCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </div>
    )
  }

  // MEMBER PAGES (COUNCIL, ADVISORY, LEGAL & FINANCIAL)
  if (sectionKey === 'council' || sectionKey === 'advisory' || sectionKey === 'legal_financial') {
    const memberKey = sectionKey === 'council' ? 'council' : sectionKey === 'advisory' ? 'advisory' : 'legalFinancial'
    const members = content?.[memberKey] || []
    
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AboutPageHeader 
          title={title}
          description={description}
        />

        {members.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiAlertCircle className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Members Listed</h3>
            <p className="text-slate-600">
              Team members will appear here once they are added by the administrator.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {members.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        )}
      </div>
    )
  }

  // TEXT CONTENT PAGES (WHO WE ARE, WHY DAR AL HIKMA) - One Medical–style editorial layout
  const contentData = section?.content || {}
  const blocks = Array.isArray(contentData.blocks) ? contentData.blocks : []
  const hero = contentData.hero || {}
  const heroStyle = hero.imageUrl ? (hero.style || 'split') : 'split'
  const heroImageUrl = hero.imageUrl || contentData.heroImageUrl
  const heroLabel = hero.label || ''
  const heroHeadline = hero.headline || title
  const heroIntro = hero.intro || description
  const ctaText = hero.ctaText || ''
  const ctaUrl = hero.ctaUrl || ''
  const showScrollIndicator = hero.showScrollIndicator !== false

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link to="/about/who-we-are" className="inline-flex items-center gap-2 text-slate-600 hover:text-primary-600 font-semibold text-sm transition-colors">
          <FiArrowLeft className="w-4 h-4" />
          Back to About Us
        </Link>
      </div>
      {/* Hero section - Overlay style (full-width bg image + centered text) or Split style */}
      {heroStyle === 'overlay' && heroImageUrl ? (
        <section className="relative min-h-[70vh] flex flex-col justify-center items-center text-center px-4 sm:px-6 py-20 md:py-28">
          <div className="absolute inset-0 z-0">
            <img src={heroImageUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-slate-900/50" />
          </div>
          <div className="relative z-10 max-w-4xl mx-auto">
            {heroLabel && (
              <p className="text-sm md:text-base font-semibold text-white/90 tracking-[0.2em] uppercase mb-4">
                {heroLabel}
              </p>
            )}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              {heroHeadline}
            </h1>
            {ctaText && ctaUrl && (
              ctaUrl.startsWith('http') ? (
                <a
                  href={ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 rounded-full border-2 border-white text-white font-semibold hover:bg-white hover:text-slate-900 transition-colors"
                >
                  {ctaText}
                </a>
              ) : (
                <Link
                  to={ctaUrl.startsWith('/') ? ctaUrl : `/${ctaUrl}`}
                  className="inline-flex items-center px-6 py-3 rounded-full border-2 border-white text-white font-semibold hover:bg-white hover:text-slate-900 transition-colors"
                >
                  {ctaText}
                </Link>
              )
            )}
          </div>
          {showScrollIndicator && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 animate-bounce">
              <FiChevronDown className="w-8 h-8 text-white/80" />
            </div>
          )}
        </section>
      ) : (
        <section className="py-12 md:py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`grid ${heroImageUrl ? 'lg:grid-cols-2' : ''} gap-10 lg:gap-16 items-center`}>
              {heroImageUrl && (
                <div className="order-2 lg:order-1">
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                    <img src={heroImageUrl} alt={heroHeadline} className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
              <div className={`order-1 ${heroImageUrl ? 'lg:order-2' : ''}`}>
                {heroLabel && (
                  <p className="text-sm font-semibold text-primary-600 tracking-[0.2em] uppercase mb-3">
                    {heroLabel}
                  </p>
                )}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 leading-tight">
                  {heroHeadline}
                </h1>
                {heroIntro && (
                  <p className="text-lg md:text-xl text-slate-600 leading-relaxed whitespace-pre-line">
                    {heroIntro}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Introductory paragraph - wide, centered, generous whitespace */}
      {heroIntro && heroStyle === 'overlay' && (
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed whitespace-pre-line">
              {heroIntro}
            </p>
          </div>
        </section>
      )}

      {/* Content blocks - alternating image/text, square images */}
      {blocks.length > 0 ? (
        <div className="bg-slate-50/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-24 md:space-y-32">
            {blocks.map((block, idx) => (
              <section
                key={idx}
                className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${idx % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
              >
                {block.imageUrl ? (
                  <>
                    <div className={block.imageLeft !== false ? 'lg:order-1' : 'lg:order-2'}>
                      <div className="aspect-square max-w-lg mx-auto rounded-2xl overflow-hidden shadow-lg">
                        <img src={block.imageUrl} alt={block.headline || ''} className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div className={block.imageLeft !== false ? 'lg:order-2' : 'lg:order-1'}>
                      {block.headline && (
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-6 leading-tight">
                          {block.headline}
                        </h2>
                      )}
                      {block.body && (
                        <div className="text-slate-600 text-base md:text-lg leading-relaxed whitespace-pre-line mb-6">
                          {block.body}
                        </div>
                      )}
                      {block.linkText && block.linkUrl && (
                        <Link
                          to={block.linkUrl.startsWith('/') ? block.linkUrl : `/${block.linkUrl}`}
                          className="inline-flex items-center gap-1 text-primary-600 font-semibold hover:text-primary-700 group"
                        >
                          {block.linkText}
                          <span className="group-hover:translate-x-0.5 transition-transform">›</span>
                        </Link>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="lg:col-span-2 max-w-3xl">
                    {block.headline && (
                      <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                        {block.headline}
                      </h2>
                    )}
                    {block.body && (
                      <div className="text-slate-600 text-lg leading-relaxed whitespace-pre-line">
                        {block.body}
                      </div>
                    )}
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>
      ) : !heroIntro && !blocks.length ? (
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-slate-50 rounded-2xl p-8 md:p-12 text-center">
              <p className="text-slate-600 leading-relaxed">
                {description || (
                  <>Content for this section is managed in the Admin About Us page.</>
                )}
              </p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
