import { render, screen } from '@testing-library/react'
import ChallengeCard from '@/components/challenge/challenge-card'

function MockLink({
  children,
  href,
}: {
  children: React.ReactNode
  href: string
}) {
  return <a href={href}>{children}</a>
}

jest.mock('next/link', () => ({
  __esModule: true,
  default: MockLink,
}))

jest.mock('@/lib/db', () => ({
  prisma: {
    $on: jest.fn(),
    $disconnect: jest.fn(),
  },
}))

describe('ChallengeCard', () => {
  const mockChallenge = {
    id: 'test-challenge-1',
    title: 'Test Challenge',
    description: 'This is a test challenge description',
    category: 'FITNESS',
    difficulty: 3,
    points: 30,
    createdAt: new Date('2024-01-01'),
    creator: {
      username: 'testuser',
      name: 'Test User',
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
    expect(screen.getByText(/30/)).toBeInTheDocument()
  })

  it('should render creator username', () => {
    render(<ChallengeCard challenge={mockChallenge} />)
    expect(screen.getByText(/testuser/)).toBeInTheDocument()
  })

  it('should render category badge', () => {
    render(<ChallengeCard challenge={mockChallenge} />)
    expect(screen.getByText('Fitness')).toBeInTheDocument()
  })

  it('should render difficulty', () => {
    render(<ChallengeCard challenge={mockChallenge} />)
    expect(screen.getByText(/3\/5/)).toBeInTheDocument()
  })
})
