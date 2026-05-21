import { Metadata }         from 'next'
import { getServerSession }  from 'next-auth'
import { redirect }          from 'next/navigation'
import { authOptions }       from '@/lib/auth'
import { BulkImportClient }  from './BulkImportClient'

export const metadata: Metadata = { title: 'Bulk Import — Forestry Admin' }

export default async function BulkImportPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    redirect('/admin')
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-terracotta mb-1">Admin Portal</p>
        <h1 className="font-heading text-4xl font-bold text-charcoal-900 tracking-tight">Bulk Import Products</h1>
        <p className="text-sm text-charcoal-400 mt-1.5">Upload the Excel template to create or update many products at once.</p>
      </div>

      <BulkImportClient />
    </div>
  )
}
