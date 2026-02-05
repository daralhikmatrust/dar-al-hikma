import { FiUpload } from 'react-icons/fi'

/**
 * MediaUploader - Upload (primary) + URL fallback, matches Admin Dashboard form design
 * Props: label, accept, maxSizeMB, value (URL string), onChange (url), onFileSelect (file), hint
 */
export default function MediaUploader({
  label = 'Photo',
  accept = 'image/*',
  maxSizeMB = 5,
  value = '',
  onChange,
  onFileSelect,
  hint = 'Max 5MB. JPG, PNG, WEBP'
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
      <div className="space-y-2">
        {onFileSelect && (
          <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-xl cursor-pointer hover:bg-primary-700 transition-colors">
            <FiUpload className="w-4 h-4" />
            Upload Photo
            <input
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file && file.size <= maxSizeMB * 1024 * 1024) {
                  onFileSelect(file)
                }
              }}
            />
          </label>
        )}
        <p className="text-xs text-slate-500">{hint}</p>
        {onChange && (
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Or paste image URL"
          />
        )}
      </div>
    </div>
  )
}
