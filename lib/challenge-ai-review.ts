export interface AiReviewResult {
  safe: boolean
  note: string
  autoApprove: boolean
}

const UNSAFE_KEYWORDS = ['alcohol', 'drunk', 'weapon', 'gun', 'drug', 'suicide', 'self-harm']

const REVIEW_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS ?? 90_000)

const DEFAULT_REJECTION_REASON = 'Content did not meet community guidelines.'

function isAutoApproveEnabled(): boolean {
  return (
    process.env.OLLAMA_AUTO_APPROVE !== 'false' && process.env.OLLAMA_AUTO_APPROVE !== '0'
  )
}

function rejectionReason(reason: string | undefined): string {
  const trimmed = reason?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : DEFAULT_REJECTION_REASON
}

function keywordRejectionReason(title: string, description: string): string | null {
  const lower = `${title} ${description}`.toLowerCase()
  const match = UNSAFE_KEYWORDS.find((k) => lower.includes(k))
  return match ? `Contains restricted content related to "${match}".` : null
}

export async function reviewChallengeWithAI(
  title: string,
  description: string
): Promise<AiReviewResult | null> {
  const ollamaUrl = process.env.OLLAMA_URL
  if (!ollamaUrl) return null

  const prompt = `You are a content moderator for a family-friendly challenge app.
Review this challenge and respond with JSON only (no markdown, no extra text).

Rules:
- If the challenge is NOT appropriate: {"safe":false,"reason":"A clear, specific explanation of why it was rejected"}
- If the challenge IS appropriate: {"safe":true,"reason":"Brief note on why it is acceptable"}

The "reason" field is required in both cases. For rejections, explain what policy the content violates.

Title: ${title}
Description: ${description}`

  try {
    const response = await fetch(`${ollamaUrl.replace(/\/$/, '')}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL ?? 'qwen2.5:7b',
        prompt,
        stream: false,
        format: 'json',
      }),
      signal: AbortSignal.timeout(REVIEW_TIMEOUT_MS),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      console.error('Ollama review HTTP error:', response.status, body)
      return { safe: true, note: 'AI review unavailable', autoApprove: false }
    }

    const data = (await response.json()) as { response?: string }
    const parsed = JSON.parse(data.response ?? '{}') as { safe?: boolean; reason?: string }
    const safe = parsed.safe !== false

    if (!safe) {
      return {
        safe: false,
        note: rejectionReason(parsed.reason),
        autoApprove: false,
      }
    }

    const autoApprove = isAutoApproveEnabled()
    return {
      safe: true,
      note: parsed.reason?.trim() || 'AI pre-check passed',
      autoApprove,
    }
  } catch (error) {
    const keywordReason = keywordRejectionReason(title, description)
    const timedOut = error instanceof Error && error.name === 'TimeoutError'
    console.error('Ollama review failed:', error)

    if (keywordReason) {
      return {
        safe: false,
        note: keywordReason,
        autoApprove: false,
      }
    }

    return {
      safe: true,
      note: timedOut
        ? 'AI review timed out (model may still be loading). A moderator will review this challenge.'
        : 'AI review failed to connect. A moderator will review this challenge.',
      autoApprove: false,
    }
  }
}
