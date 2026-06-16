'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Trophy } from 'lucide-react'
import { toast } from 'sonner'

interface AttemptDetails {
  id: string
  status: string
  proofUrl: string | null
  challenge: {
    title: string
    points: number
  }
  user: {
    username: string
    name: string | null
  }
}

export default function VerifyAttemptPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const attemptId = params.id
  const { status } = useSession()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [attempt, setAttempt] = useState<AttemptDetails | null>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      fetchAttempt()
    }
  }, [status])

  const fetchAttempt = async () => {
    try {
      const response = await fetch(`/api/attempts/${attemptId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch attempt')
      }
      const data = await response.json()
      setAttempt(data)
    } catch (error) {
      setError('Failed to load attempt')
    } finally {
      setFetching(false)
    }
  }

  const handleVote = async (vote: 'VERIFY' | 'REJECT') => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/attempts/${attemptId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vote,
          reason: reason || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to submit vote')
        setLoading(false)
        return
      }

      toast.success(vote === 'VERIFY' ? 'Attempt verified!' : 'Attempt rejected')
      router.push(`/attempt/${attemptId}`)
    } catch (error) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="container mx-auto max-w-3xl p-4 flex items-center justify-center min-h-[50vh]">
        <p>Loading...</p>
      </div>
    )
  }

  if (error || !attempt) {
    return (
      <div className="container mx-auto max-w-3xl p-4">
        <Alert variant="destructive">
          <AlertDescription>{error || 'Attempt not found'}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-3xl p-4">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">{attempt.status}</Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              {attempt.challenge.points} points
            </Badge>
          </div>
          <CardTitle>{attempt.challenge.title}</CardTitle>
          <CardDescription>{attempt.challenge.description}</CardDescription>
        </CardHeader>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Proof Submission</CardTitle>
        </CardHeader>
        <CardContent>
          {attempt.proofUrl && (
            <div className="mb-4">
              {attempt.proofType?.startsWith('video/') ? (
                <video src={attempt.proofUrl} controls className="w-full rounded-lg" />
              ) : (
                <img src={attempt.proofUrl} alt="Proof" className="w-full rounded-lg" />
              )}
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Submitted by {attempt.user.name || attempt.user.username}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cast Your Vote</CardTitle>
          <CardDescription>
            Does this submission successfully complete the challenge?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Add a comment about this attempt..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => handleVote('VERIFY')}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                Verify
              </Button>
              <Button
                onClick={() => handleVote('REJECT')}
                disabled={loading}
                variant="destructive"
                size="lg"
              >
                <XCircle className="mr-2 h-5 w-5" />
                Reject
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
