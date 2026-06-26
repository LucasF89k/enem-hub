-- CreateEnum
CREATE TYPE "FlashcardType" AS ENUM ('BASIC', 'CLOZE', 'IMAGE', 'FORMULA');

-- CreateEnum
CREATE TYPE "ReviewState" AS ENUM ('NEW', 'LEARNING', 'REVIEW', 'RELEARNING');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'VERY_HARD');

-- CreateEnum
CREATE TYPE "SimuladoType" AS ENUM ('FULL', 'AREA', 'DISCIPLINE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SimuladoStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('CONTENT', 'FLASHCARDS', 'QUESTIONS', 'SIMULADO', 'REDACAO', 'REVISION');

-- CreateEnum
CREATE TYPE "AchievementCategory" AS ENUM ('STREAK', 'STUDY', 'QUESTIONS', 'FLASHCARDS', 'SIMULADO', 'REDACAO', 'SCORE', 'SPECIAL');

-- CreateEnum
CREATE TYPE "FavoriteType" AS ENUM ('CONTENT', 'QUESTION', 'FLASHCARD', 'NOTE', 'SIMULADO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetScore" DOUBLE PRECISION NOT NULL DEFAULT 950,
    "targetCourse" TEXT NOT NULL DEFAULT 'Medicina',
    "examDate" TIMESTAMP(3),
    "dailyStudyGoal" INTEGER NOT NULL DEFAULT 120,
    "currentLevel" INTEGER NOT NULL DEFAULT 1,
    "totalXP" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastStudyDate" TIMESTAMP(3),
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "language" TEXT NOT NULL DEFAULT 'pt-BR',
    "estimatedScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discipline" (
    "id" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Discipline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "disciplineId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "importance" INTEGER NOT NULL DEFAULT 3,
    "frequency" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subtopic" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subtopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL,
    "topicId" TEXT,
    "subtopicId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "keyConcepts" TEXT[],
    "tips" TEXT[],
    "formulas" TEXT[],
    "tricks" TEXT[],
    "importance" INTEGER NOT NULL DEFAULT 3,
    "frequency" INTEGER NOT NULL DEFAULT 3,
    "readTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlashcardDeck" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "topicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlashcardDeck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flashcard" (
    "id" TEXT NOT NULL,
    "deckId" TEXT,
    "topicId" TEXT,
    "contentId" TEXT,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "type" "FlashcardType" NOT NULL DEFAULT 'BASIC',
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flashcard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlashcardReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "flashcardId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "stability" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "difficulty" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "elapsed" INTEGER NOT NULL DEFAULT 0,
    "scheduled" INTEGER NOT NULL DEFAULT 1,
    "nextReview" TIMESTAMP(3) NOT NULL,
    "state" "ReviewState" NOT NULL DEFAULT 'NEW',
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlashcardReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "topicId" TEXT,
    "subtopicId" TEXT,
    "contentId" TEXT,
    "source" TEXT,
    "year" INTEGER,
    "areaSlug" TEXT,
    "number" INTEGER,
    "statement" TEXT NOT NULL,
    "images" TEXT[],
    "correctId" TEXT,
    "explanation" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "letter" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "image" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserQuestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedId" TEXT,
    "isCorrect" BOOLEAN NOT NULL,
    "timeSpent" INTEGER NOT NULL,
    "mode" TEXT,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Simulado" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "SimuladoType" NOT NULL,
    "duration" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Simulado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimuladoQuestion" (
    "id" TEXT NOT NULL,
    "simuladoId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "SimuladoQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSimulado" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "simuladoId" TEXT NOT NULL,
    "status" "SimuladoStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "scoreTotal" DOUBLE PRECISION,
    "scoreCN" DOUBLE PRECISION,
    "scoreCH" DOUBLE PRECISION,
    "scoreLCT" DOUBLE PRECISION,
    "scoreMT" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "timeSpent" INTEGER,

    CONSTRAINT "UserSimulado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSimuladoAnswer" (
    "id" TEXT NOT NULL,
    "userSimuladoId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedId" TEXT,
    "isCorrect" BOOLEAN NOT NULL,
    "timeSpent" INTEGER NOT NULL,
    "markedForReview" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserSimuladoAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudySession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT,
    "areaSlug" TEXT,
    "type" "SessionType" NOT NULL,
    "duration" INTEGER NOT NULL,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Plano ENEM',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "dailyGoal" INTEGER NOT NULL,
    "weeklyGoal" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyPlanItem" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "topicId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "SessionType" NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "priority" INTEGER NOT NULL DEFAULT 3,

    CONSTRAINT "StudyPlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteFolder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoteFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "folderId" TEXT,
    "topicId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "tags" TEXT[],
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Essay" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "comp1Score" INTEGER,
    "comp2Score" INTEGER,
    "comp3Score" INTEGER,
    "comp4Score" INTEGER,
    "comp5Score" INTEGER,
    "totalScore" INTEGER,
    "feedback" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "wordCount" INTEGER,
    "lineCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Essay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "category" "AchievementCategory" NOT NULL,
    "condition" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "FavoriteType" NOT NULL,
    "itemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Area_slug_key" ON "Area"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Discipline_slug_key" ON "Discipline"("slug");

-- CreateIndex
CREATE INDEX "Discipline_areaId_idx" ON "Discipline"("areaId");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_slug_key" ON "Topic"("slug");

-- CreateIndex
CREATE INDEX "Topic_disciplineId_idx" ON "Topic"("disciplineId");

-- CreateIndex
CREATE INDEX "Topic_importance_frequency_idx" ON "Topic"("importance", "frequency");

-- CreateIndex
CREATE UNIQUE INDEX "Subtopic_slug_key" ON "Subtopic"("slug");

-- CreateIndex
CREATE INDEX "Subtopic_topicId_idx" ON "Subtopic"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "Content_slug_key" ON "Content"("slug");

-- CreateIndex
CREATE INDEX "Content_topicId_idx" ON "Content"("topicId");

-- CreateIndex
CREATE INDEX "Content_subtopicId_idx" ON "Content"("subtopicId");

-- CreateIndex
CREATE INDEX "FlashcardDeck_userId_idx" ON "FlashcardDeck"("userId");

-- CreateIndex
CREATE INDEX "Flashcard_topicId_idx" ON "Flashcard"("topicId");

-- CreateIndex
CREATE INDEX "Flashcard_deckId_idx" ON "Flashcard"("deckId");

-- CreateIndex
CREATE INDEX "FlashcardReview_userId_nextReview_idx" ON "FlashcardReview"("userId", "nextReview");

-- CreateIndex
CREATE INDEX "FlashcardReview_userId_flashcardId_idx" ON "FlashcardReview"("userId", "flashcardId");

-- CreateIndex
CREATE INDEX "Question_topicId_idx" ON "Question"("topicId");

-- CreateIndex
CREATE INDEX "Question_areaSlug_idx" ON "Question"("areaSlug");

-- CreateIndex
CREATE INDEX "Question_year_idx" ON "Question"("year");

-- CreateIndex
CREATE INDEX "Question_difficulty_idx" ON "Question"("difficulty");

-- CreateIndex
CREATE INDEX "QuestionOption_questionId_idx" ON "QuestionOption"("questionId");

-- CreateIndex
CREATE INDEX "UserQuestion_userId_idx" ON "UserQuestion"("userId");

-- CreateIndex
CREATE INDEX "UserQuestion_userId_questionId_idx" ON "UserQuestion"("userId", "questionId");

-- CreateIndex
CREATE INDEX "UserQuestion_userId_isCorrect_idx" ON "UserQuestion"("userId", "isCorrect");

-- CreateIndex
CREATE INDEX "SimuladoQuestion_simuladoId_idx" ON "SimuladoQuestion"("simuladoId");

-- CreateIndex
CREATE UNIQUE INDEX "SimuladoQuestion_simuladoId_questionId_key" ON "SimuladoQuestion"("simuladoId", "questionId");

-- CreateIndex
CREATE INDEX "UserSimulado_userId_idx" ON "UserSimulado"("userId");

-- CreateIndex
CREATE INDEX "UserSimulado_userId_status_idx" ON "UserSimulado"("userId", "status");

-- CreateIndex
CREATE INDEX "UserSimuladoAnswer_userSimuladoId_idx" ON "UserSimuladoAnswer"("userSimuladoId");

-- CreateIndex
CREATE INDEX "StudySession_userId_idx" ON "StudySession"("userId");

-- CreateIndex
CREATE INDEX "StudySession_userId_date_idx" ON "StudySession"("userId", "date");

-- CreateIndex
CREATE INDEX "StudyPlan_userId_idx" ON "StudyPlan"("userId");

-- CreateIndex
CREATE INDEX "StudyPlanItem_planId_idx" ON "StudyPlanItem"("planId");

-- CreateIndex
CREATE INDEX "StudyPlanItem_planId_scheduledAt_idx" ON "StudyPlanItem"("planId", "scheduledAt");

-- CreateIndex
CREATE INDEX "StudyPlanItem_planId_completed_idx" ON "StudyPlanItem"("planId", "completed");

-- CreateIndex
CREATE INDEX "NoteFolder_userId_idx" ON "NoteFolder"("userId");

-- CreateIndex
CREATE INDEX "Note_userId_idx" ON "Note"("userId");

-- CreateIndex
CREATE INDEX "Note_userId_folderId_idx" ON "Note"("userId", "folderId");

-- CreateIndex
CREATE INDEX "Essay_userId_idx" ON "Essay"("userId");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_idx" ON "UserAchievement"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- CreateIndex
CREATE INDEX "Favorite_userId_type_idx" ON "Favorite"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_type_itemId_key" ON "Favorite"("userId", "type", "itemId");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discipline" ADD CONSTRAINT "Discipline_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "Discipline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subtopic" ADD CONSTRAINT "Subtopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_subtopicId_fkey" FOREIGN KEY ("subtopicId") REFERENCES "Subtopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlashcardDeck" ADD CONSTRAINT "FlashcardDeck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flashcard" ADD CONSTRAINT "Flashcard_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "FlashcardDeck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flashcard" ADD CONSTRAINT "Flashcard_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flashcard" ADD CONSTRAINT "Flashcard_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlashcardReview" ADD CONSTRAINT "FlashcardReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlashcardReview" ADD CONSTRAINT "FlashcardReview_flashcardId_fkey" FOREIGN KEY ("flashcardId") REFERENCES "Flashcard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_subtopicId_fkey" FOREIGN KEY ("subtopicId") REFERENCES "Subtopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuestion" ADD CONSTRAINT "UserQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuestion" ADD CONSTRAINT "UserQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimuladoQuestion" ADD CONSTRAINT "SimuladoQuestion_simuladoId_fkey" FOREIGN KEY ("simuladoId") REFERENCES "Simulado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimuladoQuestion" ADD CONSTRAINT "SimuladoQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSimulado" ADD CONSTRAINT "UserSimulado_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSimulado" ADD CONSTRAINT "UserSimulado_simuladoId_fkey" FOREIGN KEY ("simuladoId") REFERENCES "Simulado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSimuladoAnswer" ADD CONSTRAINT "UserSimuladoAnswer_userSimuladoId_fkey" FOREIGN KEY ("userSimuladoId") REFERENCES "UserSimulado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyPlan" ADD CONSTRAINT "StudyPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyPlanItem" ADD CONSTRAINT "StudyPlanItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "StudyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyPlanItem" ADD CONSTRAINT "StudyPlanItem_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteFolder" ADD CONSTRAINT "NoteFolder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "NoteFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Essay" ADD CONSTRAINT "Essay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
