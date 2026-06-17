import 'dotenv/config'
import { PrismaClient, ChallengeCategory } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Starting seed...')

  // Create demo users
  const password = await bcrypt.hash('password123', 10)

  const users = []
  for (let i = 1; i <= 5; i++) {
    const user = await prisma.user.upsert({
      where: { email: `demo${i}@test.com` },
      update: {},
      create: {
        email: `demo${i}@test.com`,
        username: `demo${i}`,
        name: `Demo User ${i}`,
        password,
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
    await prisma.friendship.create({
      data: {
        requesterId: users[a].id,
        addresseeId: users[b].id,
        status: 'ACCEPTED',
      },
    })
  }
  console.log('✓ Created friendships')

  // Create challenges
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

    const created = await prisma.challenge.create({
      data: {
        ...challenge,
        category: challenge.category as ChallengeCategory,
        creatorId: creator.id,
        basePoints: 10,
        points,
        status: 'ACTIVE',
      },
    })
    createdChallenges.push(created)
  }
  console.log(`✓ Created ${createdChallenges.length} challenges`)

  // Create some attempts and points
  const attempt1 = await prisma.attempt.create({
    data: {
      userId: users[1].id,
      challengeId: createdChallenges[0].id,
      status: 'APPROVED',
      proofUrl: '/uploads/demo-proof.jpg',
      proofType: 'image/jpeg',
    },
  })

  await prisma.pointsLedger.create({
    data: {
      userId: users[1].id,
      attemptId: attempt1.id,
      points: createdChallenges[0].points,
    },
  })

  await prisma.user.update({
    where: { id: users[1].id },
    data: {
      totalPoints: createdChallenges[0].points,
    },
  })

  console.log('✓ Created sample attempts and points')

  // Create a message thread
  const thread = await prisma.messageThread.create({
    data: {
      userAId: users[0].id,
      userBId: users[1].id,
      lastMessageAt: new Date(),
    },
  })

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

  console.log('✓ Created sample messages')

  console.log('🎉 Seed completed successfully!')
  console.log('\n📝 Test accounts:')
  console.log('Email: demo1@test.com (ADMIN)')
  console.log('Email: demo2@test.com (MODERATOR)')
  console.log('Email: demo3@test.com')
  console.log('Email: demo4@test.com')
  console.log('Email: demo5@test.com')
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
