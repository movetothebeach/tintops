import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function SubscriptionSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto mb-2" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="relative">
              <CardHeader>
                <Skeleton className="h-7 w-32 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Skeleton className="h-10 w-24 inline-block mr-2" />
                  <Skeleton className="h-5 w-16 inline-block" />
                </div>
                <Skeleton className="h-8 w-full rounded-md" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Skeleton className="h-4 w-96 mx-auto mb-2" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
    </div>
  )
}