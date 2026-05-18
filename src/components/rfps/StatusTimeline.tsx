import { Check } from 'lucide-react'

interface Props {
  currentStatus: string
  dates?: Partial<Record<string, string | Date | null>>
}

function fmtShort(iso: string | Date) {
  const d = new Date(iso)
  const now = new Date()
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

const STEPS = [
  { key: 'SUBMITTED',    label: 'Submitted' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'QUOTED',       label: 'Quoted' },
  { key: 'APPROVED',     label: 'Approved' },
  { key: 'IN_PRODUCTION',label: 'In Production' },
  { key: 'COMPLETED',    label: 'Completed' },
]

// Statuses that map to an existing step for display purposes
const STATUS_ALIAS: Record<string, string> = {
  PENDING:   'UNDER_REVIEW', // vendor revision request → still in review stage
  DRAFT:     'SUBMITTED',    // draft shows as submitted step (pre-submission)
  CANCELLED: 'SUBMITTED',    // cancelled shows position at submitted
}

export function StatusTimeline({ currentStatus, dates = {} }: Props) {
  const resolvedStatus = STATUS_ALIAS[currentStatus] ?? currentStatus
  const currentIndex   = STEPS.findIndex(s => s.key === resolvedStatus)
  const isRejected     = currentStatus === 'REJECTED'
  const isPending      = currentStatus === 'PENDING'

  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex items-start gap-0 min-w-[560px] py-1 px-0.5">
        {STEPS.map((step, index) => {
          const done    = !isRejected && index < currentIndex
          const active  = !isRejected && index === currentIndex
          const future  = isRejected || index > currentIndex
          const isLast  = index === STEPS.length - 1

          return (
            <div key={step.key} className="flex items-start flex-1 min-w-0">
              {/* Step node + label */}
              <div className="flex flex-col items-center flex-shrink-0">
                {/* Circle */}
                <div className={`
                  w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all
                  ${done                                   ? 'bg-charcoal-900 ring-0'                : ''}
                  ${active && !isPending                   ? 'bg-terracotta ring-4 ring-terracotta/20' : ''}
                  ${active && isPending                    ? 'bg-amber-400 ring-4 ring-amber-200'    : ''}
                  ${future                                 ? 'bg-charcoal-100 ring-2 ring-charcoal-100' : ''}
                  ${isRejected && index === 0              ? 'bg-red-500 ring-4 ring-red-100'        : ''}
                `}>
                  {done && <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />}
                  {active && !isRejected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                </div>

                {/* Label + date */}
                <span className={`
                  mt-2 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap
                  ${done              ? 'text-charcoal-600' : ''}
                  ${active && !isPending ? 'text-terracotta'   : ''}
                  ${active && isPending  ? 'text-amber-500'    : ''}
                  ${future            ? 'text-charcoal-300' : ''}
                `}>
                  {step.label}
                </span>
                {dates[step.key] && (done || active) && (
                  <span className="mt-0.5 text-[9px] font-medium text-charcoal-400 whitespace-nowrap tabular-nums">
                    {fmtShort(dates[step.key]!)}
                  </span>
                )}
              </div>

              {/* Connector */}
              {!isLast && (
                <div className="flex-1 h-0.5 mt-3.5 mx-2 transition-colors"
                  style={{ backgroundColor: done ? '#2D3436' : '#E0E3E3' }}
                />
              )}
            </div>
          )
        })}

        {/* Rejected state appended */}
        {isRejected && (
          <div className="flex items-start flex-shrink-0 ml-2">
            <div className="h-0.5 w-6 mt-3.5 bg-red-200" />
            <div className="flex flex-col items-center ml-2">
              <div className="w-7 h-7 rounded-full bg-red-500 ring-4 ring-red-100 flex items-center justify-center">
                <span className="text-white text-xs font-bold">✕</span>
              </div>
              <span className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-red-500 whitespace-nowrap">
                Rejected
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
