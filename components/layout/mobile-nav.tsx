'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, PlusCircle, Compass, Bell, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MobileNav() {
  const { status } = useSession()
  const pathname = usePathname()

  if (status !== 'authenticated') {
    return null
  }

  const navItems = [
    { href: '/', label: 'Feed', icon: Home },
    { href: '/explore', label: 'Explore', icon: Compass },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
    { href: '/create', label: 'Create', icon: PlusCircle },
    { href: '/notifications', label: 'Alerts', icon: Bell },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-card" aria-label="Mobile navigation">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href === '/messages' && pathname.startsWith('/messages')) ||
            (item.href === '/explore' && pathname.startsWith('/explore'))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-2 px-2 min-w-[52px]',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
