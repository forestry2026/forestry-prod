'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { MessageSquare, Send, Trash2, Loader2, Lock } from 'lucide-react'

interface NoteUser {
  id:        string
  name:      string
  role:      string
  avatarUrl: string | null
}

interface Note {
  id:        string
  body:      string
  createdAt: string
  user:      NoteUser
}

interface Props {
  rfpId:       string
  currentUser: { id: string; role: string; name: string }
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function roleLabel(role: string) {
  return role === 'ADMIN' ? 'Admin' : role === 'MANAGER' ? 'Manager' : role === 'PRODUCTION' ? 'Production' : role
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)   return 'just now'
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7)   return `${d}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function RfpNotesPanel({ rfpId, currentUser }: Props) {
  const [notes,       setNotes]       = useState<Note[]>([])
  const [body,        setBody]        = useState('')
  const [loading,     setLoading]     = useState(true)
  const [submitting,  setSubmitting]  = useState(false)
  const [deletingId,  setDeletingId]  = useState<string | null>(null)
  const [error,       setError]       = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const fetchNotes = useCallback(async () => {
    try {
      const res  = await fetch(`/api/rfp/${rfpId}/notes`)
      const data = await res.json()
      if (data.success) setNotes(data.data)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [rfpId])

  useEffect(() => { fetchNotes() }, [fetchNotes])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const res  = await fetch(`/api/rfp/${rfpId}/notes`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ body }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to post note')
      setNotes(prev => [data.data, ...prev])
      setBody('')
      textareaRef.current?.focus()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(noteId: string) {
    setDeletingId(noteId)
    try {
      const res = await fetch(`/api/rfp/${rfpId}/notes/${noteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setNotes(prev => prev.filter(n => n.id !== noteId))
    } catch { /* silent */ }
    finally { setDeletingId(null) }
  }

  const canDelete = (note: Note) =>
    note.user.id === currentUser.id || currentUser.role === 'ADMIN'

  return (
    <div className="bg-white rounded-2xl border border-[#EDE8E1] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#EDE8E1] bg-[#FAFAF9] flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-charcoal-900 flex items-center justify-center flex-shrink-0">
          <Lock className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-charcoal-400">Internal Notes</p>
          <p className="text-[11px] text-charcoal-400 mt-0.5">Visible to admin team only · not shared with vendor</p>
        </div>
        {notes.length > 0 && (
          <span className="flex-shrink-0 inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-charcoal-900 text-white text-[10px] font-bold tabular-nums">
            {notes.length}
          </span>
        )}
      </div>

      {/* Compose */}
      <form onSubmit={handleSubmit} className="px-6 py-4 border-b border-[#EDE8E1]">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-charcoal-900 flex items-center justify-center mt-0.5">
            <span className="text-[10px] font-bold text-white">{initials(currentUser.name)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={body}
              onChange={e => setBody(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e as any)
              }}
              rows={2}
              placeholder="Add an internal note…"
              className="w-full text-sm text-charcoal-800 placeholder:text-charcoal-300 bg-cream/50 border border-[#EDE8E1] rounded-xl px-3.5 py-2.5 resize-none focus:outline-none focus:border-charcoal-400 focus:ring-1 focus:ring-charcoal-200 transition-colors"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-[10px] text-charcoal-300">⌘↵ to submit</p>
              <button
                type="submit"
                disabled={submitting || !body.trim()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-charcoal-900 hover:bg-charcoal-800 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <Send className="w-3 h-3" />
                }
                Post
              </button>
            </div>
            {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
          </div>
        </div>
      </form>

      {/* Notes list */}
      <div className="divide-y divide-[#EDE8E1] max-h-[440px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-4 h-4 animate-spin text-charcoal-300" />
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <MessageSquare className="w-5 h-5 text-charcoal-200" />
            <p className="text-xs text-charcoal-300">No internal notes yet</p>
          </div>
        ) : (
          notes.map(note => (
            <div key={note.id} className="px-6 py-4 flex items-start gap-3 group hover:bg-[#FAFAF9] transition-colors">
              {/* Avatar */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-charcoal-100 flex items-center justify-center mt-0.5">
                <span className="text-[10px] font-bold text-charcoal-600">{initials(note.user.name)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-semibold text-charcoal-800">{note.user.name}</span>
                  <span className="text-[10px] text-charcoal-400 font-medium">{roleLabel(note.user.role)}</span>
                  <span className="text-[10px] text-charcoal-300 ml-auto flex-shrink-0">{timeAgo(note.createdAt)}</span>
                </div>
                <p className="text-sm text-charcoal-700 leading-relaxed whitespace-pre-wrap">{note.body}</p>
              </div>
              {/* Delete — always visible for own notes, hover-only for admin deleting others */}
              {canDelete(note) && (
                <button
                  onClick={() => handleDelete(note.id)}
                  disabled={deletingId === note.id}
                  className={[
                    'flex-shrink-0 transition-opacity p-1 rounded-lg hover:bg-rose-50 text-charcoal-300 hover:text-rose-500 disabled:opacity-30',
                    note.user.id === currentUser.id
                      ? 'opacity-60 hover:opacity-100'          // always visible for author
                      : 'opacity-0 group-hover:opacity-100',   // hover-reveal for admin
                  ].join(' ')}
                  title="Delete note"
                >
                  {deletingId === note.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />
                  }
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
