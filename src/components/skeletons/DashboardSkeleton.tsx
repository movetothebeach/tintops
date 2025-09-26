import { Skeleton } from '@/components/ui/skeleton'
import { CardSkeleton } from './CardSkeleton'

export function DashboardSkeleton() {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </>
  )
}