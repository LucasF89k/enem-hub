-- CreateEnum
CREATE TYPE "LeagueTier" AS ENUM ('INICIANTE', 'VESTIBULANDO', 'APROVADO', 'MEDALHISTA', 'ELITE');

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN "currentTier" "LeagueTier" NOT NULL DEFAULT 'INICIANTE';

-- CreateTable
CREATE TABLE "LeagueRoom" (
    "id" TEXT NOT NULL,
    "tier" "LeagueTier" NOT NULL,
    "season" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeagueRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueMembership" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "monthlyXP" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeagueMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueSeason" (
    "season" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeagueSeason_pkey" PRIMARY KEY ("season")
);

-- CreateIndex
CREATE INDEX "LeagueRoom_tier_season_idx" ON "LeagueRoom"("tier", "season");

-- CreateIndex
CREATE INDEX "LeagueMembership_roomId_idx" ON "LeagueMembership"("roomId");

-- CreateIndex
CREATE INDEX "LeagueMembership_userId_idx" ON "LeagueMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueMembership_userId_season_key" ON "LeagueMembership"("userId", "season");

-- AddForeignKey
ALTER TABLE "LeagueMembership" ADD CONSTRAINT "LeagueMembership_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "LeagueRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueMembership" ADD CONSTRAINT "LeagueMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
