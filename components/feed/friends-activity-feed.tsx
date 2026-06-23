import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ProofDisplay } from '@/components/attempt/proof-display'
import { Trophy } from 'lucide-react'

interface FriendsActivityFeedProps {
  attempts: Array<{
    id: string
    proofUrl: string | null
    proofType: string | null
    updatedAt: Date
    user: {
      username: string
      name: string | null
      avatarUrl: string | null
    }
    challenge: {
      id: string
      title: string
      points: number
    }
  }>
  emptyTitle?: string
  emptyDescription?: string
}

export function FriendsActivityFeed({
  attempts,
  emptyTitle = 'No activity yet',
  emptyDescription = 'When friends and other users complete challenges, their proof posts will show up here.',
}: FriendsActivityFeedProps) {
  if (attempts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-2">{emptyTitle}</p>
        <p className="text-sm text-muted-foreground">{emptyDescription}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {attempts.map((attempt) => {
        const initials = attempt.user.name
          ? attempt.user.name.split(' ').map((n) => n[0]).join('').toUpperCase()
          : attempt.user.username.substring(0, 2).toUpperCase()

        return (
          <Card key={attempt.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={attempt.user.avatarUrl || undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {attempt.user.name || attempt.user.username}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    completed {attempt.challenge.title} ·{' '}
                    {formatDistanceToNow(new Date(attempt.updatedAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-sm font-medium text-primary shrink-0">
                  <Trophy className="h-4 w-4" />
                  +{attempt.challenge.points}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {attempt.proofUrl && (
                <div className="rounded-lg overflow-hidden bg-muted">
                  <ProofDisplay
                    proofUrl={attempt.proofUrl}
                    proofType={attempt.proofType}
                    className="w-full max-h-[480px] object-contain"
                  />
                </div>
              )}
              <Button variant="outline" size="sm" asChild>
                <Link href={`/attempt/${attempt.id}`}>View attempt</Link>
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
