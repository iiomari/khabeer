
-- CreateTable
CREATE TABLE "RewardVoucher" (
    "id" TEXT NOT NULL,
    "expertId" TEXT NOT NULL,
    "tierKey" TEXT NOT NULL,
    "partner" TEXT NOT NULL,
    "valueSar" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "redeemedAt" TIMESTAMP(3),
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RewardVoucher_code_key" ON "RewardVoucher"("code");

-- CreateIndex
CREATE INDEX "RewardVoucher_expertId_earnedAt_idx" ON "RewardVoucher"("expertId", "earnedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RewardVoucher_expertId_tierKey_key" ON "RewardVoucher"("expertId", "tierKey");

-- AddForeignKey
ALTER TABLE "RewardVoucher" ADD CONSTRAINT "RewardVoucher_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

