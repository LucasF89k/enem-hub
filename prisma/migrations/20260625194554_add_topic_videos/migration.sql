-- CreateEnum
CREATE TYPE "TrailType" AS ENUM ('EXTENSIVA', 'SEMI_EXTENSIVA', 'INTENSIVA', 'SPRINT');

-- CreateEnum
CREATE TYPE "InsightType" AS ENUM ('ERROR_ANALYSIS', 'WEAK_POINT', 'STREAK_RISK', 'PLAN_SUGGESTION');

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "trail" "TrailType" NOT NULL DEFAULT 'EXTENSIVA';

-- CreateTable
CREATE TABLE "AgentInsight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "InsightType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "topicIds" TEXT[],
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicVideo" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "youtubeId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "duration" INTEGER,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isHighlight" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopicVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoWatched" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "watchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoWatched_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentInsight_userId_read_idx" ON "AgentInsight"("userId", "read");

-- CreateIndex
CREATE INDEX "AgentInsight_userId_createdAt_idx" ON "AgentInsight"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "TopicVideo_topicId_idx" ON "TopicVideo"("topicId");

-- CreateIndex
CREATE INDEX "TopicVideo_topicId_order_idx" ON "TopicVideo"("topicId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "TopicVideo_youtubeId_key" ON "TopicVideo"("youtubeId");

-- CreateIndex
CREATE INDEX "VideoWatched_userId_idx" ON "VideoWatched"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoWatched_userId_videoId_key" ON "VideoWatched"("userId", "videoId");

-- AddForeignKey
ALTER TABLE "AgentInsight" ADD CONSTRAINT "AgentInsight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicVideo" ADD CONSTRAINT "TopicVideo_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoWatched" ADD CONSTRAINT "VideoWatched_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoWatched" ADD CONSTRAINT "VideoWatched_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "TopicVideo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
