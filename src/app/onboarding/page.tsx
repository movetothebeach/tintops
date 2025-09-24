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
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const form = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: user?.user_metadata?.full_name || '',
      organizationName: '',
      subdomain: '',
    },
  })

  const checkExistingOrganization = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/organizations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const { organization } = await response.json()
        if (organization) {
          router.push('/dashboard')
          return
        }
      }
    } catch (err) {
      console.error('Error checking organization:', err)
    }
  }, [router])

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

      const data = await response.json()

      if (response.ok && data.subdomain) {
        form.setValue('subdomain', data.subdomain)
        setSubdomainGenerated(true)
      }
    } catch (err) {
      console.error('Error generating subdomain:', err)
    } finally {
      setIsGeneratingSubdomain(false)
    }
  }, [form])

  // Debounce the subdomain generation
  const debouncedGenerateSubdomain = useMemo(() => {
    let timeoutId: NodeJS.Timeout
    return (organizationName: string) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => generateSubdomain(organizationName), 500)
    }
  }, [generateSubdomain])

  // Watch organization name changes
  const watchedOrgName = form.watch('organizationName')
  useEffect(() => {
    if (watchedOrgName && !form.formState.dirtyFields.subdomain) {
      debouncedGenerateSubdomain(watchedOrgName)
    }
  }, [watchedOrgName, debouncedGenerateSubdomain, form.formState.dirtyFields.subdomain])

  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    // Check if user already has an organization
    if (user) {
      checkExistingOrganization()
    }
  }, [user, authLoading, router, checkExistingOrganization])

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

      const data = await response.json()

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

  if (authLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  if (!user) {
    return null // Will redirect
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