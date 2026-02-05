/**
 * FormCard - Reusable form container matching Admin Dashboard UI
 * Use for centered forms: white card, subtle shadow, consistent border and padding
 */
export default function FormCard({ title, description, children, className = '' }) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}
    >
      {(title || description) && (
        <div className="border-b border-slate-200 px-6 py-4 bg-slate-50/50">
          {title && <h2 className="text-lg font-bold text-slate-900">{title}</h2>}
          {description && <p className="text-sm text-slate-600 mt-0.5">{description}</p>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}
