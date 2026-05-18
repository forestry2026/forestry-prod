'use client'
import { useState, useEffect, useRef } from 'react'
import { FileText, Layers, Image as ImageIcon, Trash2, Download, Upload, Loader2 } from 'lucide-react'

interface ProductFile {
  id: string
  type: string
  name: string
  url: string
  size?: number
}

interface Props {
  productId: string
}

const FILE_TYPES = [
  { key: 'specification', label: 'Specification', icon: FileText, accept: '.pdf', color: 'text-red-500' },
  { key: 'dwg',           label: 'DWG Drawing',   icon: Layers,   accept: '.dwg,.dxf', color: 'text-blue-500' },
  { key: 'png',           label: 'PNG File',      icon: ImageIcon, accept: '.png,.jpg,.jpeg', color: 'text-green-500' },
]

const fmtSize = (bytes?: number) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function ProductFilesSection({ productId }: Props) {
  const [files, setFiles] = useState<ProductFile[]>([])
  const [uploading, setUploading] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    fetch(`/api/products/${productId}/files`)
      .then(r => r.json())
      .then(d => setFiles(d.data || []))
  }, [productId])

  const handleUpload = async (type: string, file: File) => {
    setUploading(type)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', type)
    const res = await fetch(`/api/products/${productId}/files`, { method: 'POST', body: fd })
    const data = await res.json()
    if (res.ok) setFiles(prev => [...prev, data.data])
    setUploading(null)
  }

  const handleDelete = async (fileId: string) => {
    setDeleting(fileId)
    await fetch(`/api/products/${productId}/files/${fileId}`, { method: 'DELETE' })
    setFiles(prev => prev.filter(f => f.id !== fileId))
    setDeleting(null)
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {FILE_TYPES.map(({ key, label, icon: Icon, accept, color }) => {
        const typeFiles = files.filter(f => f.type === key)
        const uploaded = typeFiles[0] // one file per type
        return (
          <div key={key} className="rounded-lg border border-[#e8dcc4] bg-cream/30 p-3 flex flex-col gap-2">
            {/* Header row */}
            <div className="flex items-center gap-2">
              <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
              <span className="text-xs font-semibold text-charcoal flex-1 truncate">{label}</span>
              {typeFiles.length > 0 && (
                <span className="text-[10px] bg-terracotta/10 text-terracotta font-semibold px-1.5 py-0.5 rounded">
                  {typeFiles.length}
                </span>
              )}
            </div>

            {/* Uploaded file or empty state */}
            {uploaded ? (
              <div className="flex items-center gap-1.5 px-2 py-1.5 bg-white rounded-lg border border-[#e8dcc4]">
                <span className="text-[11px] font-medium text-charcoal flex-1 truncate">{uploaded.name}</span>
                {uploaded.size && <span className="text-[10px] text-charcoal/40 flex-shrink-0">{fmtSize(uploaded.size)}</span>}
                <a href={uploaded.url} download className="p-0.5 text-charcoal/40 hover:text-terracotta transition-colors flex-shrink-0">
                  <Download className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(uploaded.id)}
                  disabled={deleting === uploaded.id}
                  className="p-0.5 text-charcoal/30 hover:text-red-500 transition-colors disabled:opacity-40 flex-shrink-0"
                >
                  {deleting === uploaded.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-charcoal/40 text-center py-1">No file</p>
            )}

            {/* Upload button */}
            <button
              type="button"
              onClick={() => inputRefs.current[key]?.click()}
              disabled={uploading === key}
              className="flex items-center justify-center gap-1.5 py-1.5 border border-dashed border-terracotta/50 text-terracotta text-[11px] font-semibold rounded-lg hover:bg-terracotta/5 transition-colors disabled:opacity-50"
            >
              {uploading === key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              {uploaded ? 'Replace' : 'Upload'}
            </button>
            <input
              ref={el => { inputRefs.current[key] = el }}
              type="file"
              accept={accept}
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(key, f); e.target.value = '' }}
            />
          </div>
        )
      })}
    </div>
  )
}
