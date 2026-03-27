import type { Plan } from '@/types'

interface BadgePlanProps {
  plan: Plan
}

const planColors: Record<Plan, string> = {
  free:     'bg-gray-100 text-gray-500 border border-gray-200',
  starter:  'bg-blue-50 text-blue-600 border border-blue-200',
  pro:      'bg-orange-50 text-orange-600 border border-orange-200',
  business: 'bg-amber-50 text-amber-600 border border-amber-200',
}

export default function BadgePlan({ plan }: BadgePlanProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${planColors[plan]}`}>
      {plan}
    </span>
  )
}
