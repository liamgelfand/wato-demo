import { render, screen } from '@testing-library/react'
import ChallengeCard from '@/components/challenge/challenge-card'
import { ChallengeCategory, ChallengeDifficulty } from '@prisma/client'

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>
})

describe('ChallengeCard', () => {
  const mockChallenge = {
    id: 'test-challenge-1',
    title: 'Test Challenge',
    description: 'This is a test challenge description',
    category: ChallengeCategory.FITNESS,
    difficulty: ChallengeDifficulty.MEDIUM,
    points: 150,
    basePoints: 100,
    status: 'ACTIVE' as const,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    creatorId: 'user-1',
    creator: {
      username: 'testuser',
      avatarUrl: null,
    },
  }

  it('should render challenge title', () => {
    render(<ChallengeCard challenge={mockChallenge} />)
    expect(screen.getByText('Test Challenge')).toBeInTheDocument()
  })

  it('should render challenge description', () => {
    render(<ChallengeCard challenge={mockChallenge} />)
    expect(screen.getByText('This is a test challenge description')).toBeInTheDocument()
  })

  it('should render challenge points', () => {
    render(<ChallengeCard challenge={mockChallenge} />)
    expect(screen.getByText(/150/)).toBeInTheDocument()
  })

  it('should render creator username', () => {
    render(<ChallengeCard challenge={mockChallenge} />)
    expect(screen.getByText(/testuser/)).toBeInTheDocument()
  })

  it('should render category', () => {
    render(<ChallengeCard challenge={mockChallenge} />)
    expect(screen.getByText('FITNESS')).toBeInTheDocument()
  })

  it('should have link to challenge detail page', () => {
    render(<ChallengeCard challenge={mockChallenge} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/challenge/test-challenge-1')
  })
})
