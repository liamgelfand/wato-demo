import 'dotenv/config'
import { PrismaClient, ChallengeCategory } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'
import { existsSync } from 'fs'
import path from 'path'
import {
  ensureDemoAvatars,
  ensureDemoProofFiles,
  proofForChallenge,
  STALE_DEMO_PROOF_URLS,
  type DemoProofAsset,
} from './demo-proofs'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

function uploadsRoot(): string {
  return process.env.UPLOADS_DIR?.trim() || path.join(process.cwd(), 'public', 'uploads')
}

function proofFileMissing(proofUrl: string | null): boolean {
  if (!proofUrl) return true
  if (STALE_DEMO_PROOF_URLS.includes(proofUrl)) return true
  if (!proofUrl.startsWith('/uploads/')) return false
  const relative = proofUrl.replace(/^\/uploads\//, '')
  return !existsSync(path.join(uploadsRoot(), relative))
}

async function ensureApprovedAttempt(
  userId: string,
  challengeId: string,
  points: number,
  proof: DemoProofAsset
) {
  let attempt = await prisma.attempt.findFirst({
    where: { userId, challengeId, status: 'APPROVED' },
  })

  if (!attempt) {
    attempt = await prisma.attempt.create({
      data: {
        userId,
        challengeId,
        status: 'APPROVED',
        proofUrl: proof.url,
        proofType: proof.proofType,
      },
    })

    const ledgerExists = await prisma.pointsLedger.findFirst({
      where: { attemptId: attempt.id },
    })
    if (!ledgerExists) {
      await prisma.pointsLedger.create({
        data: { userId, attemptId: attempt.id, points },
      })
      await prisma.user.update({
        where: { id: userId },
        data: { totalPoints: { increment: points } },
      })
    }
  } else if (proofFileMissing(attempt.proofUrl)) {
    attempt = await prisma.attempt.update({
      where: { id: attempt.id },
      data: { proofUrl: proof.url, proofType: proof.proofType },
    })
  }

  return attempt
}

async function backfillMissingProofs(assets: DemoProofAsset[]) {
  const attempts = await prisma.attempt.findMany({
    where: {
      status: { in: ['APPROVED', 'PENDING'] },
    },
    include: {
      challenge: { select: { title: true, category: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  let fixed = 0
  for (const attempt of attempts) {
    if (!proofFileMissing(attempt.proofUrl)) continue
    const proof = proofForChallenge(
      assets,
      attempt.challenge.title,
      attempt.challenge.category
    )
    await prisma.attempt.update({
      where: { id: attempt.id },
      data: { proofUrl: proof.url, proofType: proof.proofType },
    })
    fixed++
  }

  if (fixed > 0) {
    console.log(`✓ Backfilled proof media on ${fixed} attempt(s)`)
  }
}

async function cleanupDuplicateApprovedAttempts() {
  const attempts = await prisma.attempt.findMany({
    where: { status: 'APPROVED' },
    include: { challenge: { select: { title: true } } },
    orderBy: { updatedAt: 'desc' },
  })

  const seen = new Set<string>()
  const deleteIds: string[] = []

  for (const attempt of attempts) {
    const key = `${attempt.userId}::${attempt.challenge.title}`
    if (seen.has(key)) {
      deleteIds.push(attempt.id)
    } else {
      seen.add(key)
    }
  }

  if (deleteIds.length === 0) return

  await prisma.pointsLedger.deleteMany({ where: { attemptId: { in: deleteIds } } })
  await prisma.attempt.deleteMany({ where: { id: { in: deleteIds } } })
  console.log(`✓ Removed ${deleteIds.length} duplicate approved attempt(s)`)
}

async function ensureFollow(followerId: string, followingId: string) {
  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId, followingId } },
    update: {},
    create: { followerId, followingId },
  })
}

async function syncDemoProofImages(assets: DemoProofAsset[]) {
  const attempts = await prisma.attempt.findMany({
    where: {
      status: { in: ['APPROVED', 'PENDING'] },
      user: { email: { endsWith: '@test.com' } },
    },
    include: {
      challenge: { select: { title: true, category: true } },
    },
  })

  let updated = 0
  for (const attempt of attempts) {
    const proof = proofForChallenge(
      assets,
      attempt.challenge.title,
      attempt.challenge.category
    )
    if (attempt.proofUrl === proof.url) continue
    await prisma.attempt.update({
      where: { id: attempt.id },
      data: { proofUrl: proof.url, proofType: proof.proofType },
    })
    updated++
  }

  if (updated > 0) {
    console.log(`✓ Matched ${updated} demo proof image(s) to challenges`)
  }
}

async function main() {
  console.log('🌱 Starting seed...')

  await cleanupDuplicateApprovedAttempts()

  // Create demo users
  const password = await bcrypt.hash('password123', 10)

  console.log('📷 Ensuring demo avatars…')
  const demoAvatars = await ensureDemoAvatars()

  const users = []
  for (let i = 1; i <= 5; i++) {
    const user = await prisma.user.upsert({
      where: { email: `demo${i}@test.com` },
      update: {
        avatarUrl: demoAvatars.get(`demo${i}`) ?? undefined,
        role: i === 1 ? 'ADMIN' : i === 2 ? 'MODERATOR' : 'USER',
      },
      create: {
        email: `demo${i}@test.com`,
        username: `demo${i}`,
        name: `Demo User ${i}`,
        password,
        avatarUrl: demoAvatars.get(`demo${i}`),
        role: i === 1 ? 'ADMIN' : i === 2 ? 'MODERATOR' : 'USER',
      },
    })
    users.push(user)
    console.log(`✓ Created user: ${user.username}`)
  }

  // Create friendships
  const friendships = [
    [0, 1], [0, 2], [0, 3], // demo1 friends with demo2, 3, 4
    [1, 2], [1, 3], // demo2 friends with demo3, 4
    [2, 3], [2, 4], // demo3 friends with demo4, 5
    [3, 4], // demo4 friends with demo5
  ]

  for (const [a, b] of friendships) {
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: users[a].id, addresseeId: users[b].id },
          { requesterId: users[b].id, addresseeId: users[a].id },
        ],
      },
    })
    if (!existing) {
      await prisma.friendship.create({
        data: {
          requesterId: users[a].id,
          addresseeId: users[b].id,
          status: 'ACCEPTED',
        },
      })
    }
  }
  console.log('✓ Created friendships')

  // Mutual follows = friends (demo1 ↔ demo2/3/4, etc.)
  for (const [a, b] of friendships) {
    await ensureFollow(users[a].id, users[b].id)
    await ensureFollow(users[b].id, users[a].id)
  }
  console.log('✓ Created mutual follows')

  // Create challenges (reuse existing seed challenges by title)
  const challenges = [
    {
      title: '30 Pushups in 1 Minute',
      description: 'Do 30 pushups within 60 seconds. Proper form required!',
      category: 'FITNESS',
      difficulty: 3,
    },
    {
      title: 'Draw a Self-Portrait',
      description: 'Create a drawing of yourself using any medium. Show your artistic side!',
      category: 'CREATIVITY',
      difficulty: 2,
    },
    {
      title: 'Learn 10 Words in a New Language',
      description: 'Pick a language you don\'t know and learn 10 new words. Quiz yourself!',
      category: 'SKILL',
      difficulty: 2,
    },
    {
      title: 'Visit a New Coffee Shop',
      description: 'Find a local coffee shop you\'ve never been to and try their specialty drink.',
      category: 'ADVENTURE',
      difficulty: 1,
    },
    {
      title: 'Tell 5 Dad Jokes',
      description: 'Tell 5 different dad jokes to friends or family. Record their reactions!',
      category: 'FUNNY',
      difficulty: 1,
    },
    {
      title: 'Plank for 2 Minutes',
      description: 'Hold a plank position for 2 full minutes without breaking form.',
      category: 'FITNESS',
      difficulty: 4,
    },
    {
      title: 'Write a Haiku About Your Day',
      description: 'Compose an original haiku (5-7-5 syllables) about something from your day.',
      category: 'CREATIVITY',
      difficulty: 2,
    },
    {
      title: 'Solve a Rubiks Cube',
      description: 'Complete a Rubik\'s cube from a scrambled state. Any method counts!',
      category: 'SKILL',
      difficulty: 5,
    },
    {
      title: 'Take a Photo at Sunrise',
      description: 'Wake up early and capture a beautiful sunrise photo.',
      category: 'ADVENTURE',
      difficulty: 2,
    },
    {
      title: 'Wear Mismatched Socks All Day',
      description: 'Wear two completely different socks all day and see who notices!',
      category: 'FUNNY',
      difficulty: 1,
    },
    {
      title: '100 Jumping Jacks',
      description: 'Complete 100 jumping jacks in one session. Take breaks if needed!',
      category: 'FITNESS',
      difficulty: 2,
    },
    {
      title: 'Origami Crane',
      description: 'Fold a traditional origami crane using just paper. No cutting allowed!',
      category: 'CREATIVITY',
      difficulty: 3,
    },
    {
      title: 'Cook a New Recipe',
      description: 'Try cooking a recipe you\'ve never made before. Share the results!',
      category: 'SKILL',
      difficulty: 3,
    },
    {
      title: 'Random Act of Kindness',
      description: 'Do something kind for a stranger. Pay it forward!',
      category: 'ADVENTURE',
      difficulty: 1,
    },
    {
      title: 'Speak in Rhymes for 10 Minutes',
      description: 'Have a conversation where everything you say rhymes for 10 minutes.',
      category: 'FUNNY',
      difficulty: 4,
    },
  ]

  const createdChallenges = []
  for (let i = 0; i < challenges.length; i++) {
    const challenge = challenges[i]
    const creator = users[i % users.length]
    const points = 10 * challenge.difficulty

    const existing = await prisma.challenge.findFirst({
      where: {
        title: challenge.title,
        creator: { email: { endsWith: '@test.com' } },
      },
      orderBy: { createdAt: 'asc' },
    })

    const created =
      existing ??
      (await prisma.challenge.create({
        data: {
          ...challenge,
          category: challenge.category as ChallengeCategory,
          creatorId: creator.id,
          basePoints: 10,
          points,
          status: 'ACTIVE',
        },
      }))
    createdChallenges.push(created)
  }
  console.log(`✓ Created ${createdChallenges.length} challenges`)

  console.log('📷 Ensuring demo proof images…')
  const demoProofs = await ensureDemoProofFiles()
  console.log(`✓ ${demoProofs.length} demo proof images ready`)

  // Friend completions for the activity feed (demo2–demo5)
  const friendCompletions = [
    { userIndex: 1, challengeIndex: 0 },
    { userIndex: 2, challengeIndex: 1 },
    { userIndex: 3, challengeIndex: 2 },
    { userIndex: 4, challengeIndex: 3 },
  ]

  for (let i = 0; i < friendCompletions.length; i++) {
    const { userIndex, challengeIndex } = friendCompletions[i]
    const challenge = createdChallenges[challengeIndex]
    await ensureApprovedAttempt(
      users[userIndex].id,
      challenge.id,
      challenge.points,
      proofForChallenge(demoProofs, challenge.title, challenge.category)
    )
  }
  console.log('✓ Created sample attempts and points')

  // Create a message thread
  const [userAId, userBId] =
    users[0].id < users[1].id ? [users[0].id, users[1].id] : [users[1].id, users[0].id]
  const thread = await prisma.messageThread.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    update: {},
    create: { userAId, userBId, lastMessageAt: new Date() },
  })

  const existingMessages = await prisma.message.count({ where: { threadId: thread.id } })
  if (existingMessages === 0) {
    await prisma.message.create({
      data: {
        threadId: thread.id,
        senderId: users[0].id,
        body: 'Hey! Ready for today\'s challenges?',
      },
    })

    await prisma.message.create({
      data: {
        threadId: thread.id,
        senderId: users[1].id,
        body: 'Absolutely! Let\'s do this! 💪',
      },
    })
  }

  console.log('✓ Created sample messages')

  // Explore-only users (not friends with demo1)
  const exploreUsers = []
  for (let i = 6; i <= 10; i++) {
    const exploreUser = await prisma.user.upsert({
      where: { email: `demo${i}@test.com` },
      update: {
        bio: `Explorer account ${i} — here for the Explore feed demo.`,
        avatarUrl: demoAvatars.get(`demo${i}`) ?? undefined,
      },
      create: {
        email: `demo${i}@test.com`,
        username: `demo${i}`,
        name: `Demo User ${i}`,
        password,
        bio: `Explorer account ${i} — here for the Explore feed demo.`,
        avatarUrl: demoAvatars.get(`demo${i}`),
        role: 'USER',
      },
    })
    exploreUsers.push(exploreUser)
    console.log(`✓ Explore user: ${exploreUser.username}`)
  }

  for (let i = 0; i < exploreUsers.length; i++) {
    const exploreUser = exploreUsers[i]
    const challenge = createdChallenges[(i + 3) % createdChallenges.length]
    const proof = proofForChallenge(
      demoProofs,
      challenge.title,
      challenge.category
    )
    await ensureApprovedAttempt(
      exploreUser.id,
      challenge.id,
      challenge.points,
      proof
    )
  }
  console.log('✓ Created explore-only user completions')

  await backfillMissingProofs(demoProofs)
  await syncDemoProofImages(demoProofs)

  console.log('🎉 Seed completed successfully!')
  console.log('\n📝 Test accounts:')
  console.log('Email: demo1@test.com (ADMIN)')
  console.log('Email: demo2@test.com (MODERATOR)')
  console.log('Email: demo3@test.com')
  console.log('Email: demo4@test.com')
  console.log('Email: demo5@test.com')
  console.log('Email: demo6@test.com – demo10@test.com (Explore only, not friends with demo1)')
  console.log('Password for all: password123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
