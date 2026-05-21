'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Send, CheckCircle2, Users, UploadCloud, X, FileText, Image } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import PhoneInput from '@/components/ui/PhoneInput'
import CountrySelect from '@/components/ui/CountrySelect'
import { COUNTRIES } from '@/lib/countries'

const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp']
const MAX_FILE_SIZE_MB   = 10
const MAX_FILES          = 5

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  return ['jpg', 'jpeg', 'png', 'webp'].includes(ext)
    ? <Image className="w-4 h-4 text-terracotta flex-shrink-0" />
    : <FileText className="w-4 h-4 text-terracotta flex-shrink-0" />
}

function formatBytes(bytes: number) {
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const schema = z.object({
  name:         z.string().min(2,  'Full name is required'),
  email:        z.string().email('Enter a valid email address'),
  companyName:  z.string().min(2,  'Company name is required'),
  phone:        z.string().min(4,  'Phone number is required'),
  country:      z.string().min(1,  'Country is required'),
  tradeLicense: z.string().optional(),
  message:      z.string().optional(),
  // Honeypot — humans never fill this; bots auto-fill every field.
  website_url:  z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function RequestAccessPage() {
  const [submitted,  setSubmitted]  = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [documents,  setDocuments]  = useState<File[]>([])
  const [dragOver,   setDragOver]   = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const successRef = useRef<HTMLDivElement>(null)

  // Phone — managed outside RHF; synced into RHF via setValue
  const [countryCode, setCountryCode] = useState('+971')
  const [phoneNumber, setPhoneNumber] = useState('')

  // Country — managed outside RHF; synced into RHF via setValue
  const [countryIso, setCountryIso] = useState('AE')

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onTouched',        // validate after first blur, then live on change
    reValidateMode: 'onChange',
    defaultValues: { country: 'United Arab Emirates' },
  })

  // ── Auto-scroll to success message ──────────────────────────────────────────
  useEffect(() => {
    if (submitted) {
      successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [submitted])

  // ── IP-based country detection ───────────────────────────────────────────────
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then((data: { country_code?: string }) => {
        const code    = data.country_code
        const country = code ? COUNTRIES.find(c => c.code === code) : null
        if (country) {
          setCountryIso(country.code)
          setCountryCode(country.dialCode)
          setValue('country', country.name, { shouldValidate: false })
        }
      })
      .catch(() => { /* keep UAE defaults on network error */ })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handlePhoneChange(v: string) {
    setPhoneNumber(v)
    const normalised = v.trim().replace(/^0+/, '')
    setValue('phone', normalised, { shouldValidate: !!errors.phone })
  }

  function handlePhoneBlur() {
    trigger('phone')
  }

  function handleCountryChange(code: string) {
    setCountryIso(code)
    const name = COUNTRIES.find(c => c.code === code)?.name ?? code
    setValue('country', name, { shouldValidate: true })
  }

  function addFiles(incoming: FileList | File[] | null) {
    if (!incoming) return
    const candidates = Array.from(incoming)
    const valid = candidates.filter(f => {
      const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
      return ALLOWED_EXTENSIONS.includes(ext) && f.size <= MAX_FILE_SIZE_MB * 1024 * 1024
    })
    setDocuments(prev => {
      const combined = [...prev, ...valid]
      return combined.slice(0, MAX_FILES)
    })
  }

  function removeFile(index: number) {
    setDocuments(prev => prev.filter((_, i) => i !== index))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError(null)
    try {
      // Strip leading zeros; combine with dial code
      const normalised = phoneNumber.trim().replace(/^0+/, '')
      const fullPhone  = `${countryCode} ${normalised}`

      // 1. Upload files individually first (optional step)
      const documentPaths: string[] = []
      for (const file of documents) {
        const fd = new window.FormData()
        fd.append('file', file)
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd })
        const upJson = await upRes.json()
        if (!upRes.ok) throw new Error(upJson.error || 'File upload failed')
        documentPaths.push(upJson.path)
      }

      // 2. Submit form as JSON with document paths
      const res = await fetch('/api/access-requests', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:          data.name,
          email:         data.email,
          companyName:   data.companyName,
          phone:         fullPhone,
          country:       data.country,
          tradeLicense:  data.tradeLicense,
          documentPaths,
          message:       data.message,
          website_url:   data.website_url,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Submission failed')
      setSubmitted(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream pt-24 pb-16 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <Link href="/" className="btn-ghost inline-flex mb-6 -ml-1 text-sm">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Home
        </Link>

        <div className="card p-10">
          {submitted ? (
            /* ── Success State ── */
            <div ref={successRef} className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-sage/15 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 size={32} className="text-[#4A7A3D]" aria-hidden="true" />
              </div>
              <h1 className="font-heading text-2xl font-bold mb-3">Request Received!</h1>
              <p className="text-[#6B6B6B] text-sm leading-relaxed mb-8 max-w-sm mx-auto">
                Thank you for your interest. We'll review your application and contact you within <strong>24–48 hours</strong> with your access credentials.
              </p>
              <Link href="/" className="btn-primary">
                Return to Home
              </Link>
            </div>
          ) : (
            /* ── Form ── */
            <>
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-terracotta/10 flex items-center justify-center mb-4 text-terracotta">
                  <Users size={26} aria-hidden="true" />
                </div>
                <h1 className="font-heading text-2xl font-bold mb-1">Request Vendor Access</h1>
                <p className="text-sm text-[#6B6B6B]">
                  Fill in your company details. Our team reviews all applications within 24–48 hours.
                </p>
              </div>

              {error && (
                <div role="alert" className="mb-5 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  <span>⚠</span> {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

                {/* Honeypot — hidden from real users, attractive to bots. */}
                <div aria-hidden="true" className="absolute -left-[9999px] opacity-0 pointer-events-none w-0 h-0 overflow-hidden">
                  <label htmlFor="website_url">Website (leave blank)</label>
                  <input
                    id="website_url"
                    type="text"
                    autoComplete="off"
                    tabIndex={-1}
                    {...register('website_url')}
                  />
                </div>

                {/* Name + Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="form-label">Full Name</label>
                    <input
                      id="name"
                      type="text"
                      className={`form-input ${errors.name ? 'form-input-error' : ''}`}
                      placeholder="Ahmed Al Mansouri"
                      autoComplete="name"
                      {...register('name')}
                    />
                    {errors.name && <p className="form-error">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                      id="email"
                      type="email"
                      className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                      placeholder="ahmed@company.ae"
                      autoComplete="email"
                      {...register('email')}
                    />
                    {errors.email && <p className="form-error">{errors.email.message}</p>}
                  </div>
                </div>

                {/* Company */}
                <div>
                  <label htmlFor="companyName" className="form-label">Company Name</label>
                  <input
                    id="companyName"
                    type="text"
                    className={`form-input ${errors.companyName ? 'form-input-error' : ''}`}
                    placeholder="Al Nakheel Landscaping LLC"
                    autoComplete="organization"
                    {...register('companyName')}
                  />
                  {errors.companyName && <p className="form-error">{errors.companyName.message}</p>}
                </div>

                {/* Phone + Country */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Phone Number</label>
                    <PhoneInput
                      countryCode={countryCode}
                      phone={phoneNumber}
                      onCountryCodeChange={setCountryCode}
                      onPhoneChange={handlePhoneChange}
                      onBlur={handlePhoneBlur}
                      placeholder="50 123 4567"
                      error={errors.phone?.message}
                    />
                  </div>
                  <div>
                    <label className="form-label">Country</label>
                    <CountrySelect
                      value={countryIso}
                      onChange={handleCountryChange}
                      error={errors.country?.message}
                    />
                  </div>
                </div>

                {/* Document Upload */}
                <div>
                  <label className="form-label">
                    Upload Licence &amp; Tax Documents{' '}
                    <span className="text-[#6B6B6B] font-normal">(optional)</span>
                  </label>

                  {/* Drop zone */}
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Upload documents"
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`
                      relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed
                      px-4 py-7 cursor-pointer transition-colors select-none
                      ${dragOver
                        ? 'border-terracotta bg-terracotta/5'
                        : 'border-[#E8E0D5] bg-cream hover:border-terracotta/50 hover:bg-terracotta/5'}
                    `}
                  >
                    <UploadCloud className={`w-7 h-7 transition-colors ${dragOver ? 'text-terracotta' : 'text-[#6B6B6B]'}`} />
                    <p className="text-sm font-semibold text-[#1C1C1C]">
                      {dragOver ? 'Drop files here' : 'Click to upload or drag & drop'}
                    </p>
                    <p className="text-xs text-[#6B6B6B]">
                      PDF, JPG, PNG — up to {MAX_FILE_SIZE_MB} MB each · max {MAX_FILES} files
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="sr-only"
                      onChange={e => addFiles(e.target.files)}
                    />
                  </div>

                  {/* File list */}
                  {documents.length > 0 && (
                    <ul className="mt-2.5 space-y-1.5">
                      {documents.map((f, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2.5 bg-white border border-[#E8E0D5] rounded-lg px-3 py-2"
                        >
                          {getFileIcon(f.name)}
                          <span className="flex-1 text-sm text-[#1C1C1C] truncate">{f.name}</span>
                          <span className="text-xs text-[#6B6B6B] flex-shrink-0">{formatBytes(f.size)}</span>
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); removeFile(i) }}
                            className="p-0.5 rounded hover:bg-red-50 text-[#6B6B6B] hover:text-red-500 transition-colors"
                            aria-label={`Remove ${f.name}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="form-label">
                    How will you use Forestry products? <span className="text-[#6B6B6B] font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="message"
                    rows={3}
                    className="form-input resize-none"
                    placeholder="e.g. Hotel interior design, landscaping projects, retail installations…"
                    {...register('message')}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center py-3 text-base mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <><LoadingSpinner size={18} /> Submitting…</>
                  ) : (
                    <><Send size={16} aria-hidden="true" /> Submit Request</>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-[#6B6B6B]">
                Already have an account?{' '}
                <Link href="/login" className="text-terracotta font-semibold hover:underline">
                  Sign in here
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
