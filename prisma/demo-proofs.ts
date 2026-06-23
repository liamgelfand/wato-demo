import { existsSync } from 'fs'
import { copyFile, mkdir, writeFile } from 'fs/promises'
import path from 'path'
import type { ChallengeCategory } from '@prisma/client'

/** Tiny valid JPEG used when offline or fetch fails. */
const FALLBACK_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
  'base64'
)

export type DemoProofAsset = {
  file: string
  url: string
  proofType: string
  category?: ChallengeCategory
}

const DEMO_PROOF_SPECS: Array<{
  file: string
  seed: string
  proofType: string
  category: ChallengeCategory
}> = [
  { file: 'fitness.jpg', seed: 'wato-gym-pushup-workout', category: 'FITNESS', proofType: 'image/jpeg' },
  { file: 'creative.jpg', seed: 'wato-art-drawing-sketch', category: 'CREATIVITY', proofType: 'image/jpeg' },
  { file: 'skill.jpg', seed: 'wato-learning-study-books', category: 'SKILL', proofType: 'image/jpeg' },
  { file: 'adventure.jpg', seed: 'wato-travel-coffee-city', category: 'ADVENTURE', proofType: 'image/jpeg' },
  { file: 'funny.jpg', seed: 'wato-comedy-laugh-smile', category: 'FUNNY', proofType: 'image/jpeg' },
  { file: 'sunrise.jpg', seed: 'wato-sunrise-morning-sky', category: 'ADVENTURE', proofType: 'image/jpeg' },
]

const CHALLENGE_TITLE_PROOF: Record<string, string> = {
  '30 Pushups in 1 Minute': 'fitness.jpg',
  'Plank for 2 Minutes': 'fitness.jpg',
  '100 Jumping Jacks': 'fitness.jpg',
  'Draw a Self-Portrait': 'creative.jpg',
  'Write a Haiku About Your Day': 'creative.jpg',
  'Origami Crane': 'creative.jpg',
  'Learn 10 Words in a New Language': 'skill.jpg',
  "Solve a Rubiks Cube": 'skill.jpg',
  'Cook a New Recipe': 'skill.jpg',
  'Visit a New Coffee Shop': 'adventure.jpg',
  'Take a Photo at Sunrise': 'sunrise.jpg',
  'Random Act of Kindness': 'adventure.jpg',
  'Tell 5 Dad Jokes': 'funny.jpg',
  'Wear Mismatched Socks All Day': 'funny.jpg',
  'Speak in Rhymes for 10 Minutes': 'funny.jpg',
}

function uploadsRoot(): string {
  return process.env.UPLOADS_DIR?.trim() || path.join(process.cwd(), 'public', 'uploads')
}

async function downloadImage(seed: string, width = 800, height = 1000): Promise<Buffer> {
  const res = await fetch(`https://picsum.photos/seed/${seed}/${width}/${height}.jpg`, {
    redirect: 'follow',
  })
  if (!res.ok) {
    throw new Error(`Failed to download image (${res.status})`)
  }
  const buffer = Buffer.from(await res.arrayBuffer())
  if (buffer.length < 500) {
    throw new Error('Downloaded image was too small')
  }
  return buffer
}

/** Write demo proof images to disk and return their public URL paths. */
export async function ensureDemoProofFiles(): Promise<DemoProofAsset[]> {
  const demoDir = path.join(uploadsRoot(), 'demo')
  await mkdir(demoDir, { recursive: true })

  const assets: DemoProofAsset[] = []

  for (const spec of DEMO_PROOF_SPECS) {
    const filePath = path.join(demoDir, spec.file)
    if (!existsSync(filePath)) {
      let buffer: Buffer
      try {
        buffer = await downloadImage(spec.seed)
      } catch {
        buffer = FALLBACK_JPEG
      }
      await writeFile(filePath, buffer)
    }

    assets.push({
      file: spec.file,
      url: `/uploads/demo/${spec.file}`,
      proofType: spec.proofType,
      category: spec.category,
    })
  }

  const legacyPath = path.join(uploadsRoot(), 'demo-proof.jpg')
  if (!existsSync(legacyPath)) {
    const legacySource = path.join(demoDir, DEMO_PROOF_SPECS[0].file)
    if (existsSync(legacySource)) {
      await copyFile(legacySource, legacyPath)
    } else {
      await writeFile(legacyPath, FALLBACK_JPEG)
    }
  }

  return assets
}

export async function ensureDemoAvatars(): Promise<Map<string, string>> {
  const demoDir = path.join(uploadsRoot(), 'demo')
  await mkdir(demoDir, { recursive: true })
  const urls = new Map<string, string>()

  for (let i = 1; i <= 10; i++) {
    const file = `avatar-demo${i}.jpg`
    const filePath = path.join(demoDir, file)
    if (!existsSync(filePath)) {
      let buffer: Buffer
      try {
        buffer = await downloadImage(`wato-profile-demo${i}-face`, 400, 400)
      } catch {
        buffer = FALLBACK_JPEG
      }
      await writeFile(filePath, buffer)
    }
    urls.set(`demo${i}`, `/uploads/demo/${file}`)
  }

  return urls
}

export function pickDemoProof(assets: DemoProofAsset[], index: number): DemoProofAsset {
  return assets[index % assets.length]
}

export function proofForCategory(
  assets: DemoProofAsset[],
  category: ChallengeCategory
): DemoProofAsset {
  return assets.find((a) => a.category === category) ?? assets[0]
}

export function proofForChallenge(
  assets: DemoProofAsset[],
  title: string,
  category: ChallengeCategory
): DemoProofAsset {
  const file = CHALLENGE_TITLE_PROOF[title]
  if (file) {
    const match = assets.find((a) => a.file === file)
    if (match) return match
  }
  return proofForCategory(assets, category)
}

/** Paths that point at missing or placeholder demo files. */
export const STALE_DEMO_PROOF_URLS = [
  '/uploads/demo-proof.jpg',
  '/uploads/demo-proof.png',
  '/uploads/demo-proof.jpeg',
]
