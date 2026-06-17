'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function updatePrivacyAction(isPrivate: boolean): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user) {
    return { error: 'Unauthorized' }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { isPrivate },
  })

  revalidatePath('/profile')
  revalidatePath('/')

  return {}
}
