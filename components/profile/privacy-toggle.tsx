'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { updatePrivacyAction } from '@/app/profile/actions'
import { Lock, Globe } from 'lucide-react'

interface PrivacyToggleProps {
  isPrivate: boolean
}

export function PrivacyToggle({ isPrivate: initialPrivate }: PrivacyToggleProps) {
  const router = useRouter()
  const [isPrivate, setIsPrivate] = useState(initialPrivate)
  const [pending, startTransition] = useTransition()

  const setPrivacy = (nextPrivate: boolean) => {
    startTransition(async () => {
      const result = await updatePrivacyAction(nextPrivate)
      if (result.error) {
        toast.error(result.error)
      } else {
        setIsPrivate(nextPrivate)
        router.refresh()
        toast.success(nextPrivate ? 'Account is now private' : 'Account is now public')
      }
    })
  }

  return (
    <div className="space-y-3">
      <Label>Account visibility</Label>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={!isPrivate ? 'default' : 'outline'}
          size="sm"
          disabled={pending}
          onClick={() => setPrivacy(false)}
        >
          <Globe className="h-4 w-4 mr-1" />
          Public
        </Button>
        <Button
          type="button"
          variant={isPrivate ? 'default' : 'outline'}
          size="sm"
          disabled={pending}
          onClick={() => setPrivacy(true)}
        >
          <Lock className="h-4 w-4 mr-1" />
          Private
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Private accounts only show completed challenges to friends.
      </p>
    </div>
  )
}
