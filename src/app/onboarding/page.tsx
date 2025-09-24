'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/core/contexts/AuthContext'
import { supabase } from '@/core/lib/supabase'
import { logger } from '@/core/lib/logger'

const onboardingSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
  subdomain: z.string()
    .min(3, 'Subdomain must be at least 3 characters')
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens')
    .regex(/^[a-z0-9]/, 'Subdomain must start with a letter or number')
    .regex(/[a-z0-9]$/, 'Subdomain must end with a letter or number'),
})

type OnboardingForm = z.infer<typeof onboardingSchema>

export default function OnboardingPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isGeneratingSubdomain, setIsGeneratingSubdomain] = useState(false)
  const [subdomainGenerated, setSubdomainGenerated] = useState(false)
  const [pageReady, setPageReady] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [redirecting, setRedirecting] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const form = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: '',
      organizationName: '',
      subdomain: '',
    },
  })

  // Single initialization function to prevent race conditions
  const initializePage = useCallback(async () => {
    setInitializing(true)
    let willRedirect = false

    try {
      // Wait for auth to finish loading
      if (authLoading) return

      // Check if user is authenticated
      if (!user) {
        willRedirect = true
        setRedirecting(true)
        router.push('/auth/login')
        return
      }

      // Set user's full name from metadata
      if (user.user_metadata?.full_name) {
        form.setValue('fullName', user.user_metadata.full_name)
      }

      // Check if user already has an organization
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const response = await fetch('/api/organizations', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        if (response.ok) {
          let organization
          try {
            const result = await response.json()
            organization = result.organization
          } catch (jsonError) {
            logger.error('Failed to parse organization response', jsonError)
            throw new Error('Invalid response from server')
          }
          if (organization) {
            willRedirect = true
            setRedirecting(true)
            router.push('/dashboard')
            return
          }
        }
      }

      // All checks passed, page is ready
      setPageReady(true)
    } catch (err) {
      logger.error('Error initializing page', err)
      setError('Failed to load page. Please try again.')
    } finally {
      // Only stop loading if we're not redirecting
      if (!willRedirect) {
        setInitializing(false)
      }
    }
  }, [user, authLoading, router, form])

  // Debounced subdomain generation
  const generateSubdomain = useCallback(async (organizationName: string) => {
    if (!organizationName.trim() || organizationName.trim().length < 2) {
      return
    }

    setIsGeneratingSubdomain(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch('/api/organizations/generate-subdomain', {
        method: 'POST',
        headers,
        body: JSON.stringify({ organizationName: organizationName.trim() }),
      })

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        logger.error('Failed to parse subdomain response', jsonError)
        return
      }

      if (response.ok && data.subdomain) {
        form.setValue('subdomain', data.subdomain)
        setSubdomainGenerated(true)
      }
    } catch (err) {
      logger.error('Error generating subdomain', err)
    } finally {
      setIsGeneratingSubdomain(false)
    }
  }, [form])

  // Run initialization once
  useEffect(() => {
    initializePage()
  }, [initializePage])

  // Optimized debounced subdomain generation (only runs when page is ready)
  const debouncedGenerateSubdomain = useMemo(() => {
    let timeoutId: NodeJS.Timeout
    return (organizationName: string) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        if (pageReady) {
          generateSubdomain(organizationName)
        }
      }, 500)
    }
  }, [generateSubdomain, pageReady])

  // Watch organization name changes (only when page is ready)
  const watchedOrgName = form.watch('organizationName')
  useEffect(() => {
    if (pageReady && watchedOrgName && !form.formState.dirtyFields.subdomain) {
      debouncedGenerateSubdomain(watchedOrgName)
    }
  }, [watchedOrgName, debouncedGenerateSubdomain, form.formState.dirtyFields.subdomain, pageReady])

  async function onSubmit(values: OnboardingForm) {
    try {
      setIsLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Please log in again')
        return
      }

      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: values.organizationName,
          subdomain: values.subdomain,
          ownerName: values.fullName,
        }),
      })

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        logger.error('Failed to parse organization creation response', jsonError)
        setError('Failed to create organization - invalid server response')
        return
      }

      if (!response.ok) {
        setError(data.error || 'Failed to create organization')
        return
      }

      // Success! Redirect to dashboard
      router.push('/dashboard')
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading during initialization or redirect
  if (initializing || redirecting || !pageReady) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm font-medium">
            {redirecting ? 'Redirecting...' : 'Loading...'}
          </span>
        </div>
      </div>
    )
  }

  // Show error state if initialization failed
  if (error && !pageReady) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-medium text-destructive mb-2">{error}</p>
          <Button onClick={initializePage} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[450px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to TintOps!
          </h1>
          <p className="text-sm text-muted-foreground">
            Let&apos;s set up your tint shop organization
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Organization Setup</CardTitle>
            <CardDescription>
              Create your organization to get started with TintOps
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            {isLoading && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-sm font-medium">Creating organization...</span>
                </div>
              </div>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your full name"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="organizationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shop Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your tint shop name"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subdomain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Subdomain
                        {isGeneratingSubdomain && (
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        )}
                        {subdomainGenerated && !form.formState.dirtyFields.subdomain && (
                          <span className="text-xs text-green-600">✓ Auto-generated</span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <div className="flex">
                          <Input
                            placeholder="your-shop"
                            disabled={isLoading || isGeneratingSubdomain}
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              if (subdomainGenerated) {
                                setSubdomainGenerated(false)
                              }
                            }}
                          />
                          <span className="flex items-center px-3 text-sm text-muted-foreground">
                            .tintops.app
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                      {subdomainGenerated && !form.formState.dirtyFields.subdomain && (
                        <p className="text-xs text-muted-foreground">
                          Auto-generated from your shop name. You can edit this if needed.
                        </p>
                      )}
                    </FormItem>
                  )}
                />
                {error && (
                  <div className="text-sm font-medium text-destructive">
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? 'Creating organization...' : 'Create Organization'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}