'use client'

import { useEffect, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { createOrganization } from '@/app/actions/organizations'
import { getCookie } from '@/core/lib/utils'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {pending ? 'Creating organization...' : 'Create Organization'}
    </Button>
  )
}

interface OnboardingFormProps {
  defaultFullName?: string
}

const initialState = {
  error: null as string | null,
}

export function OnboardingForm({ defaultFullName = '' }: OnboardingFormProps) {
  const [state, formAction] = useFormState(
    async (prevState: typeof initialState, formData: FormData) => {
      try {
        await createOrganization(formData)
        return { error: null }
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }
    },
    initialState
  )

  const [subdomain, setSubdomain] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [isGeneratingSubdomain, setIsGeneratingSubdomain] = useState(false)
  const [subdomainGenerated, setSubdomainGenerated] = useState(false)

  // Auto-generate subdomain when organization name changes
  useEffect(() => {
    if (!organizationName || organizationName.length < 2) {
      return
    }

    const timer = setTimeout(async () => {
      setIsGeneratingSubdomain(true)
      try {
        const csrfToken = getCookie('csrf-token')
        const response = await fetch('/api/organizations/generate-subdomain', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken || ''
          },
          body: JSON.stringify({ organizationName }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.subdomain && subdomainGenerated !== false) {
            setSubdomain(data.subdomain)
            setSubdomainGenerated(true)
          }
        }
      } catch (error) {
        console.error('Error generating subdomain:', error)
      } finally {
        setIsGeneratingSubdomain(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [organizationName, subdomain])

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ownerName">Your Full Name</Label>
        <Input
          id="ownerName"
          name="ownerName"
          placeholder="Enter your full name"
          defaultValue={defaultFullName}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Shop Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Your tint shop name"
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subdomain" className="flex items-center gap-2">
          Subdomain
          {isGeneratingSubdomain && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          )}
          {subdomainGenerated && (
            <span className="text-xs text-green-600">✓ Auto-generated</span>
          )}
        </Label>
        <div className="flex">
          <Input
            id="subdomain"
            name="subdomain"
            placeholder="your-shop"
            value={subdomain}
            onChange={(e) => {
              setSubdomain(e.target.value)
              setSubdomainGenerated(false)
            }}
            disabled={isGeneratingSubdomain}
            required
          />
          <span className="flex items-center px-3 text-sm text-muted-foreground">
            .tintops.app
          </span>
        </div>
        {subdomainGenerated && (
          <p className="text-xs text-muted-foreground">
            Auto-generated from your shop name. You can edit this if needed.
          </p>
        )}
      </div>

      {state.error && (
        <div className="text-sm font-medium text-destructive">
          {state.error}
        </div>
      )}

      <SubmitButton />
    </form>
  )
}