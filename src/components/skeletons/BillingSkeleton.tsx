import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function BillingSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-32 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Skeleton className="h-4 w-12 mb-1" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div>
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-5 w-28" />
          </div>
          <div>
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-5 w-36" />
          </div>
          <Skeleton className="h-10 w-48 mt-4" />
        </CardContent>
      </Card>
    </div>
  )
}