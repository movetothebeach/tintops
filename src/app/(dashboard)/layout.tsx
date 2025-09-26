'use client'

import { DashboardLayout } from '@/components/dashboard-layout'

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // All auth checks are handled by middleware at edge
  return <DashboardLayout>{children}</DashboardLayout>
}