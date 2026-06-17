import { z } from 'zod'
import { resolveProofMimeType } from '@/lib/proof-files'

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  name: z.string().min(1, 'Name is required').max(50, 'Name is too long').optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Challenge schemas
export const createChallengeSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
  category: z.enum(['FITNESS', 'SKILL', 'CREATIVITY', 'ADVENTURE', 'FUNNY'], {
    message: 'Please select a valid category',
  }),
  difficulty: z
    .number()
    .int()
    .min(1, 'Difficulty must be at least 1')
    .max(5, 'Difficulty must be at most 5'),
})

export type CreateChallengeInput = z.infer<typeof createChallengeSchema>

// Attempt schemas
export const createAttemptSchema = z.object({
  challengeId: z.string().cuid('Invalid challenge ID'),
})

export type CreateAttemptInput = z.infer<typeof createAttemptSchema>

export const uploadProofSchema = z.object({
  attemptId: z.string().cuid(),
  file: z.instanceof(File).refine(
    (file) => resolveProofMimeType(file.name, file.type) !== null,
    'Invalid file type. Only images (JPG, PNG, GIF, WebP) and videos (MP4, MOV, WebM) are allowed'
  ).refine(
    (file) => file.size <= 50 * 1024 * 1024, // 50MB
    'File size must be less than 50MB'
  ),
})

// Verification schemas
export const submitVerificationVoteSchema = z.object({
  attemptId: z.string().cuid(),
  vote: z.enum(['VERIFY', 'REJECT']),
  reason: z.string().max(500, 'Reason is too long').optional(),
})

export type SubmitVerificationVoteInput = z.infer<typeof submitVerificationVoteSchema>

export const attemptCommentSchema = z.object({
  body: z.string().min(1, 'Comment cannot be empty').max(500, 'Comment is too long'),
})

export const attemptReactionSchema = z.object({
  type: z.enum(['FIRE', 'CLAP', 'LAUGH', 'WOW', 'STRONG']),
})

// Friend schemas
export const sendFriendRequestSchema = z.object({
  username: z.string().min(3).max(20),
})

export const acceptFriendRequestSchema = z.object({
  requestId: z.string().cuid(),
})

export const removeFriendSchema = z.object({
  friendshipId: z.string().cuid(),
})

// Message schemas
export const sendMessageSchema = z.object({
  threadId: z.string().cuid(),
  body: z.string().min(1, 'Message cannot be empty').max(1000, 'Message is too long'),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>

export const createThreadSchema = z.object({
  friendId: z.string().cuid(),
})

// Report schemas
export const submitReportSchema = z.object({
  targetType: z.enum(['CHALLENGE', 'ATTEMPT']),
  targetId: z.string().cuid(),
  reason: z.enum(['INAPPROPRIATE', 'SPAM', 'DANGEROUS', 'HARASSMENT', 'OTHER']),
  details: z.string().max(1000, 'Details are too long').optional(),
})

export type SubmitReportInput = z.infer<typeof submitReportSchema>

// Admin schemas
export const resolveReportSchema = z.object({
  reportId: z.string().cuid(),
  action: z.enum(['DISMISS', 'HIDE_CONTENT']),
})

export const hideChallengeSchema = z.object({
  challengeId: z.string().cuid(),
})

export const adminApproveAttemptSchema = z.object({
  attemptId: z.string().cuid(),
})

export const adminRejectAttemptSchema = z.object({
  attemptId: z.string().cuid(),
  reason: z.string().min(1).max(500),
})
