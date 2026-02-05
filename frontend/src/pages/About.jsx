import { useEffect, useState } from 'react'
import api from '../services/api'
import PageHeader from '../components/PageHeader'
import { FiUser, FiFileText } from 'react-icons/fi'

const SECTION_IDS = {
  who_we_are: 'who-we-are',
  why_dar_al_hikma: 'why',
  council: 'council',
  advisory: 'advisory-board',
  legal_financial: 'legal-financial',
  audit: 'audit'
}

const SECTION_TITLES = {
  who_we_are: 'Who We Are',
  why_dar_al_hikma: 'Why Dar Al Hikma',
  council: 'Our Council',
  advisory: 'Advisory Board',
  legal_financial: 'Legal & Financial Team',
  audit: 'Audit'
}

export default function About() {
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
  }, [])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  const sections = content?.sections || {}
  const council = content?.council || []
  const advisory = content?.advisory || []
  const legalFinancial = content?.legalFinancial || []
  const auditReports = content?.auditReports || []

  const sectionText = (key) => {
    const s = sections[key]
    const title = s?.title || SECTION_TITLES[key]
    const description = s?.description || ''
    return { title, description }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page header */}
      <section className="py-8 md:py-12">
        <PageHeader
          title="About Us"
          description="Learn about Dar Al Hikma Trust, our council, advisory board, and governance."
        />
      </section>

      {/* Who We Are */}
      <section id={SECTION_IDS.who_we_are} className="py-10 scroll-mt-24">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">{sectionText('who_we_are').title}</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-line">
            {sectionText('who_we_are').description || 'Content for this section is managed in the Admin About Us page.'}
          </div>
        </div>
      </section>

      {/* Why Dar Al Hikma */}
      <section id={SECTION_IDS.why_dar_al_hikma} className="py-10 scroll-mt-24">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">{sectionText('why_dar_al_hikma').title}</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-line">
            {sectionText('why_dar_al_hikma').description || 'Content for this section is managed in the Admin About Us page.'}
          </div>
        </div>
      </section>

      {/* Our Council */}
      <section id={SECTION_IDS.council} className="py-10 scroll-mt-24">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{sectionText('council').title}</h2>
          {sections.council?.description && (
            <p className="text-slate-600 mb-6">{sections.council.description}</p>
          )}
          <div className="grid md:grid-cols-2 gap-6">
            {council.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
          {council.length === 0 && (
            <p className="text-slate-500 text-sm">Council members will appear here once added in Admin.</p>
          )}
        </div>
      </section>

      {/* Advisory Board */}
      <section id={SECTION_IDS.advisory} className="py-10 scroll-mt-24">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{sectionText('advisory').title}</h2>
          {sections.advisory?.description && (
            <p className="text-slate-600 mb-6">{sections.advisory.description}</p>
          )}
          <div className="grid md:grid-cols-2 gap-6">
            {advisory.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
          {advisory.length === 0 && (
            <p className="text-slate-500 text-sm">Advisory board members will appear here once added in Admin.</p>
          )}
        </div>
      </section>

      {/* Legal & Financial Team */}
      <section id={SECTION_IDS.legal_financial} className="py-10 scroll-mt-24">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{sectionText('legal_financial').title}</h2>
          {sections.legal_financial?.description && (
            <p className="text-slate-600 mb-6">{sections.legal_financial.description}</p>
          )}
          <div className="grid md:grid-cols-2 gap-6">
            {legalFinancial.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
          {legalFinancial.length === 0 && (
            <p className="text-slate-500 text-sm">Legal & financial team members will appear here once added in Admin.</p>
          )}
        </div>
      </section>

      {/* Audit */}
      <section id={SECTION_IDS.audit} className="py-10 scroll-mt-24 pb-16">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{sectionText('audit').title}</h2>
          {sections.audit?.description && (
            <p className="text-slate-600 mb-6">{sections.audit.description}</p>
          )}
          {auditReports.length === 0 ? (
            <p className="text-slate-500 text-sm">Audit reports will appear here once added in Admin.</p>
          ) : (
            <div className="space-y-6">
              {auditReports.map((report) => (
                <div key={report.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                    <FiFileText className="w-5 h-5 text-slate-600" />
                    <span className="font-semibold text-slate-900">{report.title}</span>
                  </div>
                  <div className="p-4">
                    {report.fileUrl ? (
                      <div className="flex gap-3">
                        <a href={report.fileUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors">
                          View PDF
                        </a>
                        <a href={report.fileUrl} target="_blank" rel="noopener noreferrer" download className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                          Download PDF
                        </a>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm">Report not available</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function MemberCard({ member }) {
  const [expanded, setExpanded] = useState(false)
  const hasLongDesc = member.description && member.description.length > 120
  const shortDesc = hasLongDesc ? member.description.slice(0, 120) + '...' : member.description

  return (
    <div className="flex gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:shadow-sm transition-shadow">
      {member.photo ? (
        <img
          src={member.photo}
          alt={member.name}
          className="w-24 h-24 rounded-xl object-cover flex-shrink-0 border border-slate-200"
          onError={(e) => {
            e.target.style.display = 'none'
            const fallback = e.target.nextElementSibling
            if (fallback) fallback.classList.remove('hidden')
          }}
        />
      ) : null}
      <div className={`w-24 h-24 rounded-xl bg-slate-200 flex items-center justify-center flex-shrink-0 ${member.photo ? 'hidden' : ''}`}>
        <FiUser className="w-10 h-10 text-slate-500" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-bold text-slate-900">{member.name}</h3>
        {member.role && <p className="text-sm text-slate-600 font-medium">{member.role}</p>}
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          {expanded ? member.description : shortDesc}
        </p>
        {hasLongDesc && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-primary-600 text-sm font-semibold mt-1 hover:underline"
          >
            {expanded ? 'Read less' : 'Read more...'}
          </button>
        )}
      </div>
    </div>
  )
}
