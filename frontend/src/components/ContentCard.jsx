/**
 * ContentCard - Reusable card matching Admin Dashboard UI
 * Use for content blocks: white bg, subtle shadow, consistent border
 */
export default function ContentCard({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
