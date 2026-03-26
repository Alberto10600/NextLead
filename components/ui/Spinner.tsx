interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
}

export default function Spinner({ size = 'md' }: SpinnerProps) {
  return (
    <div
      className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-slate-600 border-t-blue-500`}
    />
  )
}
