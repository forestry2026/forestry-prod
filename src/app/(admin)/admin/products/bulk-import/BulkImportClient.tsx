'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter }        from 'next/navigation'
import Link                 from 'next/link'
import { FileSpreadsheet, Upload, AlertCircle, CheckCircle2, Loader2, X, ImageIcon, Copy, Check } from 'lucide-react'

interface Row {
  rowNumber:   number
  sku:         string
  name:        string
  status:      'create' | 'update' | 'error'
  errors:      string[]
  categoryIds: string[]
  colorIds:    string[]
  textureIds:  string[]
  finishIds:   string[]
  imageUrls:   string[]
  variantCount: number
}

interface Summary { total: number; create: number; update: number; error: number }

export function BulkImportClient() {
  const router  = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [file,     setFile]     = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [parsing,  setParsing]  = useState(false)
  const [importing, setImporting] = useState(false)
  const [rows,     setRows]     = useState<Row[] | null>(null)
  const [summary,  setSummary]  = useState<Summary | null>(null)
  const [error,    setError]    = useState<string | null>(null)
  const [result,   setResult]   = useState<{ imported: number; skipped: number } | null>(null)
  const [uploadedImages, setUploadedImages] = useState<Uploaded[]>([])

  // Build {filename → url} map of successful uploads for the import API.
  function buildImageMap(): Record<string, string> {
    const out: Record<string, string> = {}
    for (const item of uploadedImages) {
      if (item.url) out[item.name] = item.url
    }
    return out
  }

  // Re-run dry-run preview when image uploads change so "no image matched"
  // errors clear automatically as the admin uploads the right files.
  const uploadedUrls = uploadedImages.filter(i => i.url).map(i => i.url).join('|')
  useEffect(() => {
    if (file && !parsing && !importing) runPreview(file)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedUrls])

  function selectFile(f: File | null) {
    setError(null)
    setRows(null)
    setSummary(null)
    setResult(null)
    if (!f) { setFile(null); return }
    if (!f.name.toLowerCase().endsWith('.xlsx')) {
      setError('File must be an .xlsx (Excel) workbook.')
      return
    }
    setFile(f)
    runPreview(f)
  }

  async function runPreview(f: File) {
    setParsing(true); setError(null)
    try {
      const fd = new FormData()
      fd.append('file', f)
      fd.append('dryRun', '1')
      fd.append('imageMap', JSON.stringify(buildImageMap()))
      const res  = await fetch('/api/admin/products/bulk-import?dryRun=1', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not parse file')
      setRows(data.rows ?? [])
      setSummary(data.summary ?? null)
    } catch (e: any) {
      setError(e?.message ?? 'Parse failed')
    } finally {
      setParsing(false)
    }
  }

  async function commit() {
    if (!file) return
    setImporting(true); setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('imageMap', JSON.stringify(buildImageMap()))
      const res  = await fetch('/api/admin/products/bulk-import', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Import failed')
      setResult({ imported: data.imported ?? 0, skipped: data.skipped ?? 0 })
      router.refresh()
    } catch (e: any) {
      setError(e?.message ?? 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  function clear() {
    setFile(null); setRows(null); setSummary(null); setResult(null); setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const canImport = !!(summary && summary.create + summary.update > 0 && !importing)
  const validRows = rows?.filter(r => r.status !== 'error') ?? []

  return (
    <div className="space-y-5">

      {/* ── Step 1: download the template ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F0EBE3] bg-cream/40 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-terracotta">Step 1</p>
            <h2 className="font-heading text-base font-bold text-charcoal-900">Download the Excel template</h2>
            <p className="text-xs text-charcoal-500 mt-0.5">Pre-populated with reference data: Categories, Colors, Textures, Finishes, Dimensions.</p>
          </div>
          <a
            href="/api/admin/products/bulk-template"
            className="inline-flex items-center gap-2 bg-white hover:bg-cream text-charcoal-800 border border-[#E8E0D5] text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors flex-shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Download .xlsx
          </a>
        </div>
      </div>

      {/* ── Step 2: upload product images to Cloudinary ───────────── */}
      <ImageUploader items={uploadedImages} setItems={setUploadedImages} />

      {/* ── Step 3: drop the file ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F0EBE3] bg-cream/40">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-terracotta">Step 3</p>
          <h2 className="font-heading text-base font-bold text-charcoal-900">Upload your filled-in file</h2>
        </div>

        <div className="px-6 py-5">
          {!file ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault(); setDragOver(false)
                const f = e.dataTransfer.files?.[0]
                if (f) selectFile(f)
              }}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                dragOver ? 'border-terracotta bg-terracotta/5' : 'border-[#D8CFC2] hover:border-terracotta/50 hover:bg-cream/40'
              }`}
            >
              <Upload className="w-8 h-8 text-charcoal-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-charcoal-700">Drop your .xlsx file here</p>
              <p className="text-xs text-charcoal-400 mt-1">or click to browse</p>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={(e) => selectFile(e.target.files?.[0] ?? null)}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-cream/50 border border-[#E8E0D5]">
              <div className="flex items-center gap-3 min-w-0">
                <FileSpreadsheet className="w-5 h-5 text-terracotta flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-charcoal-900 truncate">{file.name}</p>
                  <p className="text-[11px] text-charcoal-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button onClick={clear} className="text-charcoal-400 hover:text-rose-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {parsing && (
            <p className="mt-3 text-sm text-charcoal-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Parsing rows…
            </p>
          )}

          {error && (
            <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-rose-50 text-rose-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* ── Step 4: preview + commit ──────────────────────────────── */}
      {summary && (
        <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0EBE3] bg-cream/40 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-terracotta">Step 4</p>
              <h2 className="font-heading text-base font-bold text-charcoal-900">Review &amp; import</h2>
            </div>
            <div className="flex items-center gap-2">
              <Stat label="To create"  value={summary.create} color="bg-emerald-50 text-emerald-700" />
              <Stat label="To update"  value={summary.update} color="bg-blue-50 text-blue-700" />
              <Stat label="With errors" value={summary.error} color="bg-rose-50 text-rose-700" />
              <Stat label="Total"      value={summary.total}  color="bg-cream text-charcoal-700" />
            </div>
          </div>

          {/* Rows table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream/40 border-b border-[#F0EBE3]">
                <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-charcoal-500">
                  <th className="px-4 py-2.5">Row</th>
                  <th className="px-4 py-2.5">SKU</th>
                  <th className="px-4 py-2.5">Name</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Variants</th>
                  <th className="px-4 py-2.5">Cats/Colors/Tex/Fin/Img</th>
                  <th className="px-4 py-2.5">Errors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE3]">
                {rows!.map(r => (
                  <tr key={r.rowNumber} className={r.status === 'error' ? 'bg-rose-50/40' : ''}>
                    <td className="px-4 py-2.5 font-mono text-xs text-charcoal-400">{r.rowNumber}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-charcoal-900">{r.sku || '—'}</td>
                    <td className="px-4 py-2.5 text-charcoal-900">{r.name || '—'}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-2.5 text-xs font-mono text-charcoal-700">{r.variantCount}</td>
                    <td className="px-4 py-2.5 text-xs text-charcoal-500">
                      {r.categoryIds.length}/{r.colorIds.length}/{r.textureIds.length}/{r.finishIds.length}/{r.imageUrls.length}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-rose-700">
                      {r.errors.length === 0 ? '' : r.errors.join(' · ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-[#F0EBE3] bg-cream/30 flex items-center justify-between gap-3">
            <p className="text-xs text-charcoal-500">
              {summary.error > 0
                ? `${summary.error} rows have errors and will be skipped. Fix the spreadsheet to import them.`
                : 'All rows are valid.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={clear}
                className="text-sm font-semibold text-charcoal-600 hover:text-charcoal-900 px-3 py-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={commit}
                disabled={!canImport}
                className="inline-flex items-center gap-2 bg-terracotta hover:bg-terracotta-dark text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</>
                  : <>Import {validRows.length} row{validRows.length === 1 ? '' : 's'}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Result ────────────────────────────────────────────────── */}
      {result && (
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-card overflow-hidden">
          <div className="px-6 py-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading text-base font-bold text-charcoal-900">Import complete</h3>
              <p className="text-sm text-charcoal-600 mt-0.5">
                {result.imported} product{result.imported === 1 ? '' : 's'} imported.
                {result.skipped > 0 ? ` ${result.skipped} skipped (errors).` : ''}
              </p>
            </div>
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-2 bg-charcoal text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-charcoal-700 transition-colors"
            >
              View products
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`flex flex-col items-end px-3 py-1.5 rounded-lg ${color}`}>
      <span className="font-heading text-base font-bold leading-none">{value}</span>
      <span className="text-[9px] font-semibold uppercase tracking-wider mt-0.5">{label}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: 'create' | 'update' | 'error' }) {
  if (status === 'create') return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700">Create</span>
  if (status === 'update') return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700">Update</span>
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-50 text-rose-700">Error</span>
}

/* ────────────────────────────────────────────────────────────────────
 * ImageUploader — drop many images at once → upload to Cloudinary →
 * show table of filename → URL with one-click copy. Admin pastes URLs
 * into the Excel template.
 * ──────────────────────────────────────────────────────────────────── */
interface Uploaded {
  name:   string
  url:    string | null
  error?: string
  uploading?: boolean
}

function ImageUploader({
  items, setItems,
}: {
  items:    Uploaded[]
  setItems: React.Dispatch<React.SetStateAction<Uploaded[]>>
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [copied,   setCopied]   = useState<string | null>(null)

  async function uploadOne(file: File): Promise<Uploaded> {
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res  = await fetch('/api/products/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) return { name: file.name, url: null, error: data.error ?? 'Upload failed' }
      return { name: file.name, url: data.imageUrl as string }
    } catch (e: any) {
      return { name: file.name, url: null, error: e?.message ?? 'Upload failed' }
    }
  }

  async function handleFiles(files: File[]) {
    if (files.length === 0) return
    // Initial placeholders
    const placeholders: Uploaded[] = files.map(f => ({ name: f.name, url: null, uploading: true }))
    setItems(prev => [...prev, ...placeholders])

    // Upload in parallel batches of 4
    const startIdx = items.length
    const results = await Promise.all(files.map(f => uploadOne(f)))
    setItems(prev => {
      const next = [...prev]
      results.forEach((r, i) => { next[startIdx + i] = r })
      return next
    })
  }

  function copyUrl(url: string) {
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(url)
      setTimeout(() => setCopied(null), 1200)
    }).catch(() => {})
  }

  function copyAll() {
    const urls = items.filter(i => i.url).map(i => i.url).join('\n')
    if (!urls) return
    navigator.clipboard?.writeText(urls).then(() => {
      setCopied('all')
      setTimeout(() => setCopied(null), 1200)
    }).catch(() => {})
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  function clearAll() {
    setItems([])
  }

  const successCount = items.filter(i => i.url).length

  return (
    <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card overflow-hidden">
      <div className="px-6 py-4 border-b border-[#F0EBE3] bg-cream/40 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-terracotta">Step 2</p>
          <h2 className="font-heading text-base font-bold text-charcoal-900">Upload product images</h2>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Name files as <code className="font-mono text-[10px]">1a.jpg</code>, <code className="font-mono text-[10px]">1b.jpg</code>, <code className="font-mono text-[10px]">1c.jpg</code> … —
            the <strong>"a"</strong> file becomes the primary image, the rest follow in order. Then enter <strong>"1"</strong> in
            the <strong>Image Group</strong> column of the Excel sheet. Images upload to Cloudinary's <code className="text-[10px] font-mono">forestry/products</code> folder.
          </p>
        </div>
        {items.length > 0 && (
          <div className="flex flex-col items-end px-3 py-1.5 rounded-lg bg-emerald-50">
            <span className="font-heading text-base font-bold text-emerald-700 leading-none">{successCount}/{items.length}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 mt-0.5">Uploaded</span>
          </div>
        )}
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragOver(false)
            const files = Array.from(e.dataTransfer.files ?? []).filter(f => f.type.startsWith('image/'))
            handleFiles(files)
          }}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-terracotta bg-terracotta/5' : 'border-[#D8CFC2] hover:border-terracotta/50 hover:bg-cream/40'
          }`}
        >
          <ImageIcon className="w-7 h-7 text-charcoal-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-charcoal-700">Drop product images here</p>
          <p className="text-xs text-charcoal-400 mt-1">or click to browse — JPG, PNG, WebP. Upload as many as you need.</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => handleFiles(Array.from(e.target.files ?? []))}
          />
        </div>

        {/* Results */}
        {items.length > 0 && (
          <div className="border border-[#E8E0D5] rounded-xl overflow-hidden">
            <div className="px-3 py-2 border-b border-[#F0EBE3] bg-cream/40 flex items-center justify-between">
              <p className="text-xs font-semibold text-charcoal-600">{items.length} file{items.length === 1 ? '' : 's'}</p>
              <div className="flex gap-2">
                <button onClick={copyAll} className="inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta hover:text-terracotta-dark transition-colors">
                  {copied === 'all' ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy all URLs</>}
                </button>
                <button onClick={clearAll} className="text-xs font-semibold text-charcoal-500 hover:text-rose-600 transition-colors">Clear</button>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-cream/30 border-b border-[#F0EBE3]">
                <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-charcoal-500">
                  <th className="px-3 py-2">Preview</th>
                  <th className="px-3 py-2">Filename</th>
                  <th className="px-3 py-2">Cloudinary URL</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE3]">
                {items.map((item, idx) => (
                  <tr key={`${item.name}-${idx}`}>
                    <td className="px-3 py-2 w-14">
                      {item.url
                        ? <img src={item.url} alt="" className="w-10 h-10 rounded-lg object-cover border border-[#E8E0D5]" />
                        : <div className="w-10 h-10 rounded-lg bg-cream border border-[#E8E0D5] flex items-center justify-center">
                            {item.error
                              ? <AlertCircle className="w-4 h-4 text-rose-500" />
                              : <Loader2 className="w-4 h-4 text-charcoal-400 animate-spin" />}
                          </div>
                      }
                    </td>
                    <td className="px-3 py-2 text-xs text-charcoal-700 max-w-[180px] truncate">{item.name}</td>
                    <td className="px-3 py-2">
                      {item.url
                        ? <code className="text-[10px] font-mono text-charcoal-700 break-all">{item.url}</code>
                        : item.error
                          ? <span className="text-xs text-rose-600">{item.error}</span>
                          : <span className="text-xs text-charcoal-400">Uploading…</span>
                      }
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      {item.url && (
                        <button onClick={() => copyUrl(item.url!)} className="inline-flex items-center gap-1 text-xs font-semibold text-terracotta hover:text-terracotta-dark px-2 py-1 rounded transition-colors">
                          {copied === item.url ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                        </button>
                      )}
                      <button onClick={() => removeItem(idx)} className="ml-1 text-charcoal-300 hover:text-rose-500 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
