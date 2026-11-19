-- AI usage log: one row per paid provider request and DeepSeek balance readings. Additive only.
-- CreateTable
CREATE TABLE "AiCall" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT '',
    "origin" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "billable" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT,
    "chargeId" TEXT,
    "status" TEXT NOT NULL,
    "httpStatus" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "cachedTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "reasoningTokens" INTEGER NOT NULL DEFAULT 0,
    "units" INTEGER NOT NULL DEFAULT 0,
    "costMicroUsd" INTEGER NOT NULL DEFAULT 0,
    "costBasis" TEXT NOT NULL DEFAULT 'none',
    "agent" TEXT,
    "requestId" TEXT,

    CONSTRAINT "AiCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiBalance" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provider" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "totalMicros" BIGINT NOT NULL,
    "environment" TEXT NOT NULL,

    CONSTRAINT "AiBalance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiCall_createdAt_idx" ON "AiCall"("createdAt");

-- CreateIndex
CREATE INDEX "AiCall_source_createdAt_idx" ON "AiCall"("source", "createdAt");

-- CreateIndex
CREATE INDEX "AiCall_userId_createdAt_idx" ON "AiCall"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AiBalance_provider_createdAt_idx" ON "AiBalance"("provider", "createdAt");
