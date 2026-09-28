-- CreateEnum
CREATE TYPE "PlanoTipo" AS ENUM ('FREE', 'PRO_MENSAL', 'PRO_ANUAL');

-- CreateEnum
CREATE TYPE "AssinaturaStatus" AS ENUM ('ATIVA', 'CANCELADA', 'INADIMPLENTE', 'TRIAL');

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plano" "PlanoTipo" NOT NULL DEFAULT 'FREE',
    "status" "AssinaturaStatus" NOT NULL DEFAULT 'ATIVA',
    "abacateCustomerId" TEXT,
    "abacateSubscriptionId" TEXT,
    "periodoFim" TIMESTAMP(3),
    "canceladoEm" TIMESTAMP(3),
    "ultimaCobrancaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_abacateSubscriptionId_idx" ON "Subscription"("abacateSubscriptionId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
