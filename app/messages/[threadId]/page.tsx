'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface ThreadUser {
  id: string
  username: string
  name: string | null
  avatarUrl: string | null
}

interface ThreadMessage {
  id: string
  body: string
  createdAt: string
  senderId: string
  sender: {
    id: string
    username: string
    name: string | null
    avatarUrl: string | null
  }
}

interface ThreadDetails {
  id: string
  userAId: string
  userBId: string
  userA: ThreadUser
  userB: ThreadUser
}

export default function ThreadPage() {
  const router = useRouter()
  const params = useParams<{ threadId: string }>()
  const threadId = params.threadId
  const { data: session, status } = useSession()
  const [thread, setThread] = useState<ThreadDetails | null>(null)
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [messageBody, setMessageBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      fetchThread()
      const interval = setInterval(fetchThread, 5000) // Poll every 5s
      return () => clearInterval(interval)
    }
  }, [status, threadId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchThread = async () => {
    try {
      const response = await fetch(`/api/messages/${threadId}`)
      if (!response.ok) {
        setFetchError(
          response.status === 404
            ? 'Conversation not found.'
            : 'Could not load this conversation.'
        )
        setThread(null)
        return
      }
      const data = await response.json()
      setFetchError(null)
      setThread(data.thread)
      setMessages(data.messages)
    } catch {
      setFetchError('Could not load this conversation.')
      setThread(null)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageBody.trim()) return

    setLoading(true)

    try {
      const response = await fetch(`/api/messages/${threadId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: messageBody }),
      })

      if (!response.ok) throw new Error('Failed to send message')

      setMessageBody('')
      await fetchThread()
    } catch (error) {
      toast.error('Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || (status === 'authenticated' && !thread && !fetchError)) {
    return (
      <div className="container mx-auto max-w-4xl p-4 flex items-center justify-center min-h-[50vh]">
        <p>Loading...</p>
      </div>
    )
  }

  if (fetchError || !thread || !session) {
    return (
      <div className="container mx-auto max-w-4xl p-4 flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-muted-foreground">{fetchError ?? 'Conversation not found.'}</p>
        <Button variant="outline" onClick={() => router.push('/messages')}>
          Back to messages
        </Button>
      </div>
    )
  }

  const otherUser = thread.userAId === session.user.id ? thread.userB : thread.userA
  const initials = otherUser.name
    ? otherUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : otherUser.username.substring(0, 2).toUpperCase()

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <Card className="flex flex-col h-[calc(100vh-12rem)]">
        {/* Header */}
        <div className="border-b p-4 flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherUser.avatarUrl || undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{otherUser.name || otherUser.username}</p>
            <p className="text-xs text-muted-foreground">@{otherUser.username}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.senderId === session.user.id
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                    <div
                      className={`inline-block p-3 rounded-lg ${
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.body}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="border-t p-4 flex gap-2">
          <Input
            placeholder="Type a message..."
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            disabled={loading}
            maxLength={1000}
          />
          <Button type="submit" disabled={loading || !messageBody.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </Card>
    </div>
  )
}
