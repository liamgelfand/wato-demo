'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Bell, User, LogOut, MessageSquare, Users, Shield, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { hasPermission, Permissions } from '@/lib/permissions'

export function Navbar() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (session?.user) {
      const fetchUnreadCount = async () => {
        try {
          const response = await fetch('/api/notifications/unread-count')
          if (response.ok) {
            const data = await response.json()
            setUnreadCount(data.count)
          }
        } catch (error) {
          console.error('Failed to fetch unread count:', error)
        }
      }

      fetchUnreadCount()
      const interval = setInterval(fetchUnreadCount, 10000)
      return () => clearInterval(interval)
    }
  }, [session])

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/login')
  }

  const userInitials = session?.user?.name
    ? session.user.name.split(' ').map((n) => n[0]).join('').toUpperCase()
    : session?.user?.username?.substring(0, 2).toUpperCase() || 'U'

  const navLinks = [
    { href: '/', label: 'Feed' },
    { href: '/create', label: 'Create' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/friends', label: 'Friends' },
    { href: '/messages', label: 'Messages' },
  ]

  if (status === 'loading') {
    return (
      <nav className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Zap className="h-6 w-6 text-primary" />
          <span className="ml-2 text-xl font-bold text-primary">Wato</span>
        </div>
      </nav>
    )
  }

  return (
    <nav className="border-b bg-card sticky top-0 z-50" aria-label="Main navigation">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-primary">Wato</span>
          </Link>

          {status === 'authenticated' && (
            <div className="hidden md:flex items-center gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'text-sm transition-colors',
                    pathname === link.href
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground hover:text-primary'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {status === 'authenticated' ? (
            <>
              <Link href="/notifications" className="relative">
                <Button variant="ghost" size="icon" aria-label="Notifications">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full" aria-label="User menu">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={session.user.avatarUrl ?? undefined} />
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-sm">
                    <p className="font-medium">{session.user.name || session.user.username}</p>
                    <p className="text-xs text-muted-foreground">{session.user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/friends" className="cursor-pointer">
                      <Users className="mr-2 h-4 w-4" />
                      Friends
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/messages" className="cursor-pointer">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Messages
                    </Link>
                  </DropdownMenuItem>
                  {hasPermission(session.user.role, Permissions.ATTEMPTS_VERIFY) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer">
                          <Shield className="mr-2 h-4 w-4" />
                          {hasPermission(session.user.role, Permissions.REPORTS_VIEW)
                            ? 'Admin Dashboard'
                            : 'Review Dashboard'}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
