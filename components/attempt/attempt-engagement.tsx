'use client'

import { useState, useTransition } from 'react'
import { formatDistanceToNow } from 'date-fns'
import type { AttemptReactionType } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { REACTION_OPTIONS } from '@/lib/attempt-engagement'
import { toast } from 'sonner'
import { ArrowBigUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommentItem {
  id: string
  body: string
  createdAt: string
  user: {
    username: string
    name: string | null
    avatarUrl: string | null
  }
}

interface AttemptEngagementProps {
  attemptId: string
  initialUpvoteCount: number
  initialUserUpvoted: boolean
  initialComments: CommentItem[]
  initialReactionCounts: Partial<Record<AttemptReactionType, number>>
  initialUserReaction: AttemptReactionType | null
}

export function AttemptEngagement({
  attemptId,
  initialUpvoteCount,
  initialUserUpvoted,
  initialComments,
  initialReactionCounts,
  initialUserReaction,
}: AttemptEngagementProps) {
  const [upvoteCount, setUpvoteCount] = useState(initialUpvoteCount)
  const [userUpvoted, setUserUpvoted] = useState(initialUserUpvoted)
  const [comments, setComments] = useState(initialComments)
  const [reactionCounts, setReactionCounts] = useState(initialReactionCounts)
  const [userReaction, setUserReaction] = useState(initialUserReaction)
  const [commentBody, setCommentBody] = useState('')
  const [pending, startTransition] = useTransition()

  const toggleUpvote = () => {
    startTransition(async () => {
      const response = await fetch(`/api/attempts/${attemptId}/upvote`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error || 'Failed to upvote')
        return
      }
      setUpvoteCount(data.count)
      setUserUpvoted(data.upvoted)
    })
  }

  const setReaction = (type: AttemptReactionType) => {
    startTransition(async () => {
      const response = await fetch(`/api/attempts/${attemptId}/reaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error || 'Failed to react')
        return
      }
      setReactionCounts(data.counts)
      setUserReaction(data.userReaction)
    })
  }

  const submitComment = () => {
    if (!commentBody.trim()) return
    startTransition(async () => {
      const response = await fetch(`/api/attempts/${attemptId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: commentBody.trim() }),
      })
      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error || 'Failed to comment')
        return
      }
      setComments((prev) => [
        {
          ...data.comment,
          createdAt: data.comment.createdAt,
        },
        ...prev,
      ])
      setCommentBody('')
    })
  }

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={userUpvoted ? 'default' : 'outline'}
          size="sm"
          disabled={pending}
          onClick={toggleUpvote}
          className="gap-1"
        >
          <ArrowBigUp className={cn('h-4 w-4', userUpvoted && 'fill-current')} />
          {upvoteCount}
        </Button>

        {REACTION_OPTIONS.map((option) => {
          const count = reactionCounts[option.type] ?? 0
          const active = userReaction === option.type
          return (
            <Button
              key={option.type}
              type="button"
              variant={active ? 'secondary' : 'outline'}
              size="sm"
              disabled={pending}
              onClick={() => setReaction(option.type)}
              className="gap-1"
            >
              <span role="img" aria-label={option.label}>{option.emoji}</span>
              {count > 0 && <span className="text-xs">{count}</span>}
            </Button>
          )
        })}
      </div>

      <div className="space-y-2">
        <Textarea
          placeholder="Add a comment..."
          value={commentBody}
          onChange={(e) => setCommentBody(e.target.value)}
          maxLength={500}
          rows={2}
          disabled={pending}
        />
        <Button
          type="button"
          size="sm"
          disabled={pending || !commentBody.trim()}
          onClick={submitComment}
        >
          Comment
        </Button>
      </div>

      {comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((comment) => {
            const initials = comment.user.name
              ? comment.user.name.split(' ').map((n) => n[0]).join('').toUpperCase()
              : comment.user.username.substring(0, 2).toUpperCase()

            return (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={comment.user.avatarUrl || undefined} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {comment.user.name || comment.user.username}
                    <span className="text-muted-foreground font-normal ml-2">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </p>
                  <p className="text-sm text-foreground/90">{comment.body}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
