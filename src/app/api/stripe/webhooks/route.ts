/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe, STRIPE_CONFIG } from '@/core/lib/stripe'
import { createAdminClient } from '@/core/lib/supabase'
import { logger } from '@/core/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const sig = headersList.get('stripe-signature')

    if (!sig) {
      logger.error('Missing stripe-signature header')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    if (!STRIPE_CONFIG.WEBHOOK_SECRET) {
      logger.error('Missing STRIPE_WEBHOOK_SECRET environment variable')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, sig, STRIPE_CONFIG.WEBHOOK_SECRET)
    } catch (err) {
      logger.error('Webhook signature verification failed', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    logger.webhook(event.type, 'received', { eventId: event.id })

    const adminClient = createAdminClient()

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        // Stripe best practice: Make idempotent by checking current state
        const { data: currentOrg, error: fetchError } = await adminClient
          .from('organizations')
          .select('subscription_status, stripe_subscription_id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()

        if (fetchError) {
          logger.error('Error fetching organization for subscription update', fetchError, {
            eventType: event.type,
            subscriptionId: subscription.id,
            customerId: subscription.customer
          })
          return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        // Only update if state has actually changed (idempotency)
        if (currentOrg.subscription_status !== subscription.status ||
            currentOrg.stripe_subscription_id !== subscription.id) {

          const { error } = await adminClient
            .from('organizations')
            .update({
              stripe_subscription_id: subscription.id,
              subscription_status: subscription.status,
              subscription_plan: subscription.items.data[0].price.recurring?.interval || 'monthly',
              current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
              trial_ends_at: subscription.trial_end
                ? new Date(subscription.trial_end * 1000).toISOString()
                : null,
            })
            .eq('stripe_customer_id', subscription.customer as string)

          if (error) {
            logger.error('Error updating organization subscription', error, {
              subscriptionId: subscription.id,
              customerId: subscription.customer,
              newStatus: subscription.status
            })
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
          }

          logger.webhook(event.type, 'subscription_updated', {
            subscriptionId: subscription.id,
            oldStatus: currentOrg.subscription_status,
            newStatus: subscription.status
          })
        } else {
          logger.webhook(event.type, 'subscription_unchanged', {
            subscriptionId: subscription.id,
            status: subscription.status
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Stripe best practice: Check current state before updating
        const { data: currentOrg, error: fetchError } = await adminClient
          .from('organizations')
          .select('subscription_status')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()

        if (fetchError) {
          logger.error('Error fetching organization for subscription deletion', fetchError, {
            eventType: event.type,
            subscriptionId: subscription.id,
            customerId: subscription.customer
          })
          return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        // Only update if not already canceled (idempotency)
        if (currentOrg.subscription_status !== 'canceled') {
          const { error } = await adminClient
            .from('organizations')
            .update({
              subscription_status: 'canceled',
              current_period_end: null,
            })
            .eq('stripe_customer_id', subscription.customer as string)

          if (error) {
            logger.error('Error canceling organization subscription', error, {
              subscriptionId: subscription.id,
              customerId: subscription.customer
            })
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
          }

          logger.webhook(event.type, 'subscription_canceled', {
            subscriptionId: subscription.id
          })
        } else {
          logger.webhook(event.type, 'subscription_already_canceled', {
            subscriptionId: subscription.id
          })
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

        // Mark organization as active after successful payment
        if ((invoice as any).subscription) {
          const subscriptionId = (invoice as any).subscription

          // Check current status before updating (idempotency)
          const { data: currentOrg, error: fetchError } = await adminClient
            .from('organizations')
            .select('subscription_status, is_active')
            .eq('stripe_subscription_id', subscriptionId)
            .single()

          if (fetchError) {
            logger.error('Error fetching organization for payment success', fetchError, {
              eventType: event.type,
              subscriptionId,
              invoiceId: invoice.id
            })
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
          }

          // Only update if status needs to change
          if (currentOrg.subscription_status !== 'active' || !currentOrg.is_active) {
            const { error } = await adminClient
              .from('organizations')
              .update({
                subscription_status: 'active',
                is_active: true,
              })
              .eq('stripe_subscription_id', subscriptionId)

            if (error) {
              logger.error('Error activating organization after payment', error, {
                subscriptionId,
                invoiceId: invoice.id
              })
              return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
            }

            logger.webhook(event.type, 'organization_activated', {
              subscriptionId,
              invoiceId: invoice.id
            })
          } else {
            logger.webhook(event.type, 'organization_already_active', {
              subscriptionId,
              invoiceId: invoice.id
            })
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        // Mark subscription as past due
        if ((invoice as any).subscription) {
          const subscriptionId = (invoice as any).subscription

          // Check current status before updating (idempotency)
          const { data: currentOrg, error: fetchError } = await adminClient
            .from('organizations')
            .select('subscription_status')
            .eq('stripe_subscription_id', subscriptionId)
            .single()

          if (fetchError) {
            logger.error('Error fetching organization for failed payment', fetchError, {
              eventType: event.type,
              subscriptionId,
              invoiceId: invoice.id
            })
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
          }

          // Only update if not already past_due
          if (currentOrg.subscription_status !== 'past_due') {
            const { error } = await adminClient
              .from('organizations')
              .update({
                subscription_status: 'past_due',
              })
              .eq('stripe_subscription_id', subscriptionId)

            if (error) {
              logger.error('Error marking subscription past due', error, {
                subscriptionId,
                invoiceId: invoice.id
              })
              return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
            }

            logger.webhook(event.type, 'subscription_past_due', {
              subscriptionId,
              invoiceId: invoice.id
            })
          } else {
            logger.webhook(event.type, 'subscription_already_past_due', {
              subscriptionId,
              invoiceId: invoice.id
            })
          }
        }
        break
      }

      default:
        logger.webhook(event.type, 'unhandled', { eventId: event.id })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error('Webhook handler failed', error, {
      requestHeaders: Object.fromEntries((await headers()).entries())
    })
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}