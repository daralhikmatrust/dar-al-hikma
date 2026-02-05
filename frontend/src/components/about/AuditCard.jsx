import { FiFileText, FiDownload, FiExternalLink } from 'react-icons/fi'

/**
 * Professional Audit Report Card Component
 * Matches Admin Dashboard design language
 * View PDF / Download PDF buttons link directly to file_url
 */
export default function AuditCard({ report }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-5 py-4 border-b border-slate-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FiFileText className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                {report.title}
              </h3>
              {report.fiscalYear && (
                <p className="text-sm font-semibold text-slate-600">
                  Fiscal Year: <span className="text-primary-600">{report.fiscalYear}</span>
                </p>
              )}
              {report.description && (
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  {report.description}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons - View PDF / Download PDF link directly to file_url */}
          {report.fileUrl && (
            <div className="flex gap-2 flex-shrink-0 flex-wrap">
              <a
                href={report.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-primary-300 transition-all flex items-center gap-2"
                title="View PDF"
              >
                <FiExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">View PDF</span>
              </a>
              <a
                href={report.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
                title="Download PDF"
              >
                <FiDownload className="w-4 h-4" />
                <span className="hidden sm:inline">Download PDF</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* No File Available */}
      {!report.fileUrl && (
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <FiFileText className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 text-sm font-medium">
            Report not available
          </p>
        </div>
      )}
    </div>
  )
}
