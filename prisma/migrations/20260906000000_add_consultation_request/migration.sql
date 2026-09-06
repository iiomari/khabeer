-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "requestId" TEXT;

-- CreateTable
CREATE TABLE "ConsultationRequest" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "rawText" TEXT NOT NULL,
    "textHash" TEXT NOT NULL,
    "categoryId" TEXT,
    "reframedQuestion" TEXT NOT NULL,
    "keySkills" TEXT[],
    "questionsToAsk" TEXT[],
    "suggestedMinutes" INTEGER NOT NULL,
    "budgetMinSar" INTEGER NOT NULL,
    "budgetMaxSar" INTEGER NOT NULL,
    "engine" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsultationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsultationRequest_textHash_createdAt_idx" ON "ConsultationRequest"("textHash", "createdAt");

-- CreateIndex
CREATE INDEX "ConsultationRequest_categoryId_createdAt_idx" ON "ConsultationRequest"("categoryId", "createdAt");

-- CreateIndex
CREATE INDEX "ConsultationRequest_clientId_createdAt_idx" ON "ConsultationRequest"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "Booking_requestId_idx" ON "Booking"("requestId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ConsultationRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationRequest" ADD CONSTRAINT "ConsultationRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationRequest" ADD CONSTRAINT "ConsultationRequest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
