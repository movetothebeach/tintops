'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/core/contexts/AuthContext'
import { supabase } from '@/core/lib/supabase'
import { logger } from '@/core/lib/logger'

interface SubscriptionStatus {
  isActive: boolean
  isTrialing: boolean
  isPastDue: boolean
  isCanceled: boolean
  hasAccess: boolean
  trialEndsAt: Date | null
  currentPeriodEnd: Date | null
  plan: string | null
  loading: boolean
  error: string | null
}

export function useSubscription(): SubscriptionStatus {
  const { user, loading: authLoading } = useAuth()
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionStatus>({
    isActive: false,
    isTrialing: false,
    isPastDue: false,
    isCanceled: false,
    hasAccess: false,
    trialEndsAt: null,
    currentPeriodEnd: null,
    plan: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    async function fetchSubscriptionStatus() {
      if (authLoading) return

      if (!user) {
        setSubscriptionData(prev => ({ ...prev, loading: false }))
        return
      }

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setSubscriptionData(prev => ({ ...prev, loading: false }))
          return
        }

        const response = await fetch('/api/organizations', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch organization')
        }

        let organization
        try {
          const result = await response.json()
          organization = result.organization
        } catch (jsonError) {
          logger.error('Failed to parse organization response', jsonError)
          throw new Error('Invalid response from server')
        }

        if (!organization) {
          setSubscriptionData(prev => ({ ...prev, loading: false }))
          return
        }

        const status = organization.subscription_status
        const trialEndsAt = organization.trial_ends_at ? new Date(organization.trial_ends_at) : null
        const currentPeriodEnd = organization.current_period_end ? new Date(organization.current_period_end) : null

        // Determine subscription state for UI display
        const isActive = status === 'active'
        const isTrialing = status === 'trialing'
        const isPastDue = status === 'past_due'
        const isCanceled = status === 'canceled' || status === null

        // Trust the webhook-maintained is_active field as the single source of truth
        // The webhook handles all subscription logic including:
        // - Active subscriptions
        // - Trial periods
        // - Canceled but paid through period
        // - Payment failures
        const hasAccess = organization.is_active === true

        setSubscriptionData({
          isActive,
          isTrialing,
          isPastDue,
          isCanceled,
          hasAccess,
          trialEndsAt,
          currentPeriodEnd,
          plan: organization.subscription_plan,
          loading: false,
          error: null,
        })

      } catch (error) {
        logger.error('Error fetching subscription status', error)
        setSubscriptionData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load subscription status'
        }))
      }
    }

    fetchSubscriptionStatus()
  }, [user, authLoading])

  return subscriptionData
}