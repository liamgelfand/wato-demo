import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ProofDisplay } from '@/components/attempt/proof-display'
import { Shield } from 'lucide-react'

interface ModReviewQueueProps {
  attempts: Array<{
    id: string
    proofUrl: string | null
    proofType: string | null
    user: {
      username: string
      name: string | null
      avatarUrl: string | null
    }
    challenge: {
      title: string
      points: number
    }
  }>
}

export function ModReviewQueue({ attempts }: ModReviewQueueProps) {
  if (attempts.length === 0) return null

  return (
    <Card className="mb-6 border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-primary" />
          Pending review ({attempts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {attempts.map((attempt) => {
          const initials = attempt.user.name
            ? attempt.user.name.split(' ').map((n) => n[0]).join('').toUpperCase()
            : attempt.user.username.substring(0, 2).toUpperCase()

          return (
            <div
              key={attempt.id}
              className="flex flex-col sm:flex-row gap-4 p-3 rounded-lg bg-card border"
            >
              {attempt.proofUrl && (
                <div className="sm:w-32 shrink-0 rounded-md overflow-hidden bg-muted">
                  <ProofDisplay
                    proofUrl={attempt.proofUrl}
                    proofType={attempt.proofType}
                    className="w-full h-24 sm:h-20 object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={attempt.user.avatarUrl || undefined} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">
                    {attempt.user.name || attempt.user.username}
                  </span>
                </div>
                <p className="text-sm font-semibold">{attempt.challenge.title}</p>
                <p className="text-xs text-muted-foreground">
                  {attempt.challenge.points} points · Awaiting moderator review
                </p>
              </div>
              <Button asChild className="shrink-0 self-start sm:self-center">
                <Link href={`/attempt/${attempt.id}/verify`}>Review</Link>
              </Button>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
