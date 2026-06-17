import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'
import { AddFriendForm } from '@/components/friends/add-friend-form'
import { MessageFriendButton } from '@/components/friends/message-friend-button'

async function acceptFriendRequest(requestId: string) {
  'use server'
  await prisma.friendship.update({
    where: { id: requestId },
    data: { status: 'ACCEPTED' },
  })
}

async function declineFriendRequest(requestId: string) {
  'use server'
  await prisma.friendship.update({
    where: { id: requestId },
    data: { status: 'DECLINED' },
  })
}

async function removeFriend(friendshipId: string) {
  'use server'
  await prisma.friendship.delete({
    where: { id: friendshipId },
  })
}

export default async function FriendsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const userId = session.user.id

  // Get accepted friends
  const friends = await prisma.friendship.findMany({
    where: {
      OR: [
        { requesterId: userId, status: 'ACCEPTED' },
        { addresseeId: userId, status: 'ACCEPTED' },
      ],
    },
    include: {
      requester: {
        select: {
          id: true,
          username: true,
          name: true,
          avatarUrl: true,
          totalPoints: true,
        },
      },
      addressee: {
        select: {
          id: true,
          username: true,
          name: true,
          avatarUrl: true,
          totalPoints: true,
        },
      },
    },
  })

  const friendsList = friends.map(f => {
    const friend = f.requesterId === userId ? f.addressee : f.requester
    return { ...friend, friendshipId: f.id }
  })

  // Get pending requests received
  const pendingRequests = await prisma.friendship.findMany({
    where: {
      addresseeId: userId,
      status: 'PENDING',
    },
    include: {
      requester: {
        select: {
          id: true,
          username: true,
          name: true,
          avatarUrl: true,
          totalPoints: true,
        },
      },
    },
  })

  // Get pending requests sent
  const sentRequests = await prisma.friendship.findMany({
    where: {
      requesterId: userId,
      status: 'PENDING',
    },
    include: {
      addressee: {
        select: {
          id: true,
          username: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
  })

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8" />
          Friends
        </h1>
        <p className="text-muted-foreground">
          Connect with friends and cheer on their challenge completions
        </p>
      </div>

      <Tabs defaultValue="friends">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends">
            Friends {friendsList.length > 0 && `(${friendsList.length})`}
          </TabsTrigger>
          <TabsTrigger value="requests">
            Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
          </TabsTrigger>
          <TabsTrigger value="add">Add Friend</TabsTrigger>
        </TabsList>

        <TabsContent value="friends">
          <Card>
            <CardHeader>
              <CardTitle>Your Friends</CardTitle>
            </CardHeader>
            <CardContent>
              {friendsList.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No friends yet. Send a friend request to get started!
                </p>
              ) : (
                <div className="space-y-4">
                  {friendsList.map((friend) => {
                    const initials = friend.name
                      ? friend.name.split(' ').map(n => n[0]).join('').toUpperCase()
                      : friend.username.substring(0, 2).toUpperCase()

                    return (
                      <div key={friend.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={friend.avatarUrl || undefined} />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{friend.name || friend.username}</p>
                            <p className="text-sm text-muted-foreground">@{friend.username}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{friend.totalPoints} pts</Badge>
                          <MessageFriendButton
                            friendId={friend.id}
                            friendName={friend.name || friend.username}
                          />
                          <form action={removeFriend.bind(null, friend.friendshipId)}>
                            <Button type="submit" variant="ghost" size="sm">
                              Unfriend
                            </Button>
                          </form>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No pending requests
                </p>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => {
                    const initials = request.requester.name
                      ? request.requester.name.split(' ').map(n => n[0]).join('').toUpperCase()
                      : request.requester.username.substring(0, 2).toUpperCase()

                    return (
                      <div key={request.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={request.requester.avatarUrl || undefined} />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{request.requester.name || request.requester.username}</p>
                            <p className="text-sm text-muted-foreground">@{request.requester.username}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <form action={acceptFriendRequest.bind(null, request.id)}>
                            <Button type="submit" size="sm">Accept</Button>
                          </form>
                          <form action={declineFriendRequest.bind(null, request.id)}>
                            <Button type="submit" variant="ghost" size="sm">Decline</Button>
                          </form>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {sentRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Sent Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sentRequests.map((request) => {
                    const initials = request.addressee.name
                      ? request.addressee.name.split(' ').map(n => n[0]).join('').toUpperCase()
                      : request.addressee.username.substring(0, 2).toUpperCase()

                    return (
                      <div key={request.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={request.addressee.avatarUrl || undefined} />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{request.addressee.name || request.addressee.username}</p>
                            <p className="text-sm text-muted-foreground">@{request.addressee.username}</p>
                          </div>
                        </div>
                        <Badge variant="secondary">Pending</Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>Add Friend</CardTitle>
            </CardHeader>
            <CardContent>
              <AddFriendForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
