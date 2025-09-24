/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe, STRIPE_CONFIG } from '@/core/lib/stripe'
import { createAdminClient } from '@/core/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const sig = headersList.get('stripe-signature')

    if (!sig) {
      console.error('Missing stripe-signature header')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    if (!STRIPE_CONFIG.WEBHOOK_SECRET) {
      console.error('Missing STRIPE_WEBHOOK_SECRET environment variable')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, sig, STRIPE_CONFIG.WEBHOOK_SECRET)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('Received Stripe webhook:', event.type)

    const adminClient = createAdminClient()

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        // Update organization with subscription info
        const { error } = await adminClient
          .from('organizations')
          .update({
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
            subscription_plan: subscription.items.data[0].price.recurring?.interval || 'monthly',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            trial_ends_at: subscription.trial_end
              ? new Date(subscription.trial_end * 1000).toISOString()
              : null,
          })
          .eq('stripe_customer_id', subscription.customer as string)

        if (error) {
          console.error('Error updating organization subscription:', error)
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
        }

        console.log('Updated organization subscription:', subscription.id)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Mark subscription as canceled
        const { error } = await adminClient
          .from('organizations')
          .update({
            subscription_status: 'canceled',
            current_period_end: null,
          })
          .eq('stripe_customer_id', subscription.customer as string)

        if (error) {
          console.error('Error canceling organization subscription:', error)
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
        }

        console.log('Canceled organization subscription:', subscription.id)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

        // Mark organization as active after successful payment
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((invoice as any).subscription) {
          const { error } = await adminClient
            .from('organizations')
            .update({
              subscription_status: 'active',
              is_active: true,
            })
            .eq('stripe_subscription_id', (invoice as any).subscription)

          if (error) {
            console.error('Error activating organization:', error)
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
          }

          console.log('Activated organization after payment:', (invoice as any).subscription)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        // Mark subscription as past due
        if ((invoice as any).subscription) {
          const { error } = await adminClient
            .from('organizations')
            .update({
              subscription_status: 'past_due',
            })
            .eq('stripe_subscription_id', (invoice as any).subscription)

          if (error) {
            console.error('Error marking subscription past due:', error)
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
          }

          console.log('Marked subscription past due:', (invoice as any).subscription)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}