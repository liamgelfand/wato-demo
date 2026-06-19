import { reviewChallengeWithAI } from '@/lib/challenge-ai-review'

describe('reviewChallengeWithAI', () => {
  const originalFetch = global.fetch
  const originalOllamaUrl = process.env.OLLAMA_URL
  const originalAbortTimeout = AbortSignal.timeout

  beforeAll(() => {
    AbortSignal.timeout = () => new AbortController().signal
  })

  afterAll(() => {
    AbortSignal.timeout = originalAbortTimeout
  })

  afterEach(() => {
    global.fetch = originalFetch
    if (originalOllamaUrl === undefined) {
      delete process.env.OLLAMA_URL
    } else {
      process.env.OLLAMA_URL = originalOllamaUrl
    }
  })

  it('returns null when OLLAMA_URL is not configured', async () => {
    delete process.env.OLLAMA_URL
    await expect(reviewChallengeWithAI('Title', 'Description')).resolves.toBeNull()
  })

  it('returns a rejection reason when the model marks content unsafe', async () => {
    process.env.OLLAMA_URL = 'http://localhost:11434'
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        response: JSON.stringify({
          safe: false,
          reason: 'References alcohol consumption, which is not allowed.',
        }),
      }),
    }) as typeof fetch

    const result = await reviewChallengeWithAI('Drink party', 'Have beers with friends')

    expect(result).toEqual({
      safe: false,
      note: 'References alcohol consumption, which is not allowed.',
      autoApprove: false,
    })
  })

  it('uses a default rejection reason when the model omits one', async () => {
    process.env.OLLAMA_URL = 'http://localhost:11434'
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        response: JSON.stringify({ safe: false }),
      }),
    }) as typeof fetch

    const result = await reviewChallengeWithAI('Bad challenge', 'Not okay')

    expect(result?.safe).toBe(false)
    expect(result?.note).toBe('Content did not meet community guidelines.')
  })
})
