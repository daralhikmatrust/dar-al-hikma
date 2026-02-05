/**
 * PageHeader Component
 * Dashboard-inspired header to replace large green hero sections
 * Matches Admin Dashboard card styling for consistency
 */
export default function PageHeader({ title, description, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8 mb-8">
      <div className="max-w-5xl">
        {title && (
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            {title}
          </h1>
        )}
        {description && (
          <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-3xl">
            {description}
          </p>
        )}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  )
}
