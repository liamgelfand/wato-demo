-- User bio
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bio" VARCHAR(280);

-- Comment replies
ALTER TABLE "AttemptComment" ADD COLUMN IF NOT EXISTS "parentId" TEXT;
CREATE INDEX IF NOT EXISTS "AttemptComment_parentId_idx" ON "AttemptComment"("parentId");
ALTER TABLE "AttemptComment" DROP CONSTRAINT IF EXISTS "AttemptComment_parentId_fkey";
ALTER TABLE "AttemptComment" ADD CONSTRAINT "AttemptComment_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "AttemptComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Comment upvotes
CREATE TABLE IF NOT EXISTS "AttemptCommentUpvote" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AttemptCommentUpvote_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AttemptCommentUpvote_commentId_userId_key"
  ON "AttemptCommentUpvote"("commentId", "userId");
CREATE INDEX IF NOT EXISTS "AttemptCommentUpvote_commentId_idx" ON "AttemptCommentUpvote"("commentId");
ALTER TABLE "AttemptCommentUpvote" DROP CONSTRAINT IF EXISTS "AttemptCommentUpvote_commentId_fkey";
ALTER TABLE "AttemptCommentUpvote" ADD CONSTRAINT "AttemptCommentUpvote_commentId_fkey"
  FOREIGN KEY ("commentId") REFERENCES "AttemptComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AttemptCommentUpvote" DROP CONSTRAINT IF EXISTS "AttemptCommentUpvote_userId_fkey";
ALTER TABLE "AttemptCommentUpvote" ADD CONSTRAINT "AttemptCommentUpvote_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
