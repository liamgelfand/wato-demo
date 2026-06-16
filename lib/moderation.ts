// Content moderation and safety utilities for Wato

// Banned categories
export const BANNED_CATEGORIES = [
  'alcohol',
  'drinking',
  'drugs',
  'selfharm',
  'self-harm',
  'violence',
  'weapons',
  'illegal',
  'harassment',
  'sexual',
  'dangerous',
]

// Banned words/phrases (case-insensitive)
const BANNED_WORDS = [
  'alcohol',
  'beer',
  'wine',
  'vodka',
  'drunk',
  'drinking',
  'drug',
  'cocaine',
  'heroin',
  'marijuana',
  'weed',
  'self-harm',
  'suicide',
  'kill yourself',
  'cut yourself',
  'weapon',
  'gun',
  'knife',
  'violence',
  'fight',
  'assault',
  'sexual',
  'nude',
  'naked',
  'harassment',
  'bully',
  'illegal',
  'steal',
  'robbery',
]

export function checkBannedWords(text: string): { isSafe: boolean; matches: string[] } {
  const lowerText = text.toLowerCase()
  const matches: string[] = []
  
  for (const word of BANNED_WORDS) {
    // Use word boundaries to avoid false positives
    const regex = new RegExp(`\\b${word}\\b`, 'i')
    if (regex.test(lowerText)) {
      matches.push(word)
    }
  }
  
  return {
    isSafe: matches.length === 0,
    matches,
  }
}

// Alias for tests
export function containsBannedWords(text: string): boolean {
  return !checkBannedWords(text).isSafe
}

export function validateCategory(category: string): boolean {
  const validCategories = ['FITNESS', 'SKILL', 'CREATIVITY', 'ADVENTURE', 'FUNNY']
  return validCategories.includes(category.toUpperCase())
}

// Alias for tests
export function isValidCategory(category: unknown): boolean {
  if (typeof category !== 'string') return false
  return validateCategory(category)
}

export interface ChallengeValidationResult {
  isValid: boolean
  errors: string[]
}

export function validateChallengeContent(data: {
  title: string
  description: string
  category: string
}): ChallengeValidationResult {
  const errors: string[] = []
  
  // Check title for banned words
  const titleCheck = checkBannedWords(data.title)
  if (!titleCheck.isSafe) {
    errors.push(`Title contains prohibited content: ${titleCheck.matches.join(', ')}`)
  }
  
  // Check description for banned words
  const descCheck = checkBannedWords(data.description)
  if (!descCheck.isSafe) {
    errors.push(`Description contains prohibited content: ${descCheck.matches.join(', ')}`)
  }
  
  // Check category
  if (!validateCategory(data.category)) {
    errors.push('Invalid category selected')
  }
  
  // Check for banned category mentions in text
  const combinedText = `${data.title} ${data.description}`.toLowerCase()
  for (const banned of BANNED_CATEGORIES) {
    if (combinedText.includes(banned)) {
      errors.push(`Content references banned category: ${banned}`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}

export const SAFETY_GUIDELINES = `
## Wato Safety Guidelines

### Our Commitment
Wato is dedicated to providing a safe, positive, and fun environment for all users to participate in challenges.

### Prohibited Content
The following types of challenges and content are strictly prohibited:

1. **Alcohol & Substances**: No challenges involving alcohol, drugs, or any controlled substances
2. **Self-Harm**: No challenges that could result in physical or mental harm to yourself
3. **Violence**: No challenges involving fighting, assault, or violent behavior
4. **Weapons**: No challenges involving guns, knives, or other weapons
5. **Illegal Activities**: No challenges involving theft, trespassing, or any illegal activity
6. **Harassment**: No challenges targeting, bullying, or harassing others
7. **Sexual Content**: No challenges of a sexual or inappropriate nature
8. **Dangerous Stunts**: No challenges that pose serious risk of injury or death

### Reporting
If you see content that violates these guidelines, please report it immediately. Our moderation team reviews all reports within 24 hours.

### Consequences
Users who violate these guidelines may face:
- Challenge removal
- Account suspension
- Permanent ban for severe or repeated violations

### Stay Safe
- Never attempt a challenge that makes you uncomfortable
- Consider your safety and the safety of others
- Use common sense and good judgment
- Have fun, but be responsible!
`
