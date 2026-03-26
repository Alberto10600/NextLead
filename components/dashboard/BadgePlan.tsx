import type { Plan } from '@/types'

interface BadgePlanProps {
  plan: Plan
}

const planColors: Record<Plan, string> = {
  free:     'bg-slate-700 text-slate-300',
  starter:  'bg-blue-900/50 text-blue-300',
  pro:      'bg-purple-900/50 text-purple-300',
  business: 'bg-amber-900/50 text-amber-300',
}

export default function BadgePlan({ plan }: BadgePlanProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${planColors[plan]}`}>
      {plan}
    </span>
  )
}
