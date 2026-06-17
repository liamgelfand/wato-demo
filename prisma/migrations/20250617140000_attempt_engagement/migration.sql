-- CreateEnum
CREATE TYPE "AttemptReactionType" AS ENUM ('FIRE', 'CLAP', 'LAUGH', 'WOW', 'STRONG');

-- CreateTable
CREATE TABLE "AttemptComment" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttemptComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttemptUpvote" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttemptUpvote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttemptReaction" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AttemptReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttemptReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AttemptComment_attemptId_idx" ON "AttemptComment"("attemptId");
CREATE INDEX "AttemptComment_userId_idx" ON "AttemptComment"("userId");
CREATE INDEX "AttemptComment_createdAt_idx" ON "AttemptComment"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AttemptUpvote_attemptId_userId_key" ON "AttemptUpvote"("attemptId", "userId");
CREATE INDEX "AttemptUpvote_attemptId_idx" ON "AttemptUpvote"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "AttemptReaction_attemptId_userId_key" ON "AttemptReaction"("attemptId", "userId");
CREATE INDEX "AttemptReaction_attemptId_idx" ON "AttemptReaction"("attemptId");

-- AddForeignKey
ALTER TABLE "AttemptComment" ADD CONSTRAINT "AttemptComment_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AttemptComment" ADD CONSTRAINT "AttemptComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptUpvote" ADD CONSTRAINT "AttemptUpvote_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AttemptUpvote" ADD CONSTRAINT "AttemptUpvote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptReaction" ADD CONSTRAINT "AttemptReaction_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AttemptReaction" ADD CONSTRAINT "AttemptReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
