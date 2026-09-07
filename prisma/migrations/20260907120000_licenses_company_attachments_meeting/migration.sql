-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "meetingNote" TEXT,
ADD COLUMN     "meetingProvider" TEXT,
ADD COLUMN     "meetingUrl" TEXT;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "requiresLicense" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ClientProfile" ADD COLUMN     "commercialRegistration" TEXT,
ADD COLUMN     "contactTitle" TEXT,
ADD COLUMN     "crExpiry" TIMESTAMP(3),
ADD COLUMN     "employeeCount" TEXT,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "ExpertProfile" ADD COLUMN     "licenseDocUrl" TEXT,
ADD COLUMN     "licenseExpiry" TIMESTAMP(3),
ADD COLUMN     "licenseIssuer" TEXT,
ADD COLUMN     "licenseNumber" TEXT,
ADD COLUMN     "licenseRejectionReason" TEXT,
ADD COLUMN     "licenseStatus" TEXT NOT NULL DEFAULT 'NOT_REQUIRED';

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "attachmentName" TEXT,
ADD COLUMN     "attachmentSize" INTEGER,
ADD COLUMN     "attachmentType" TEXT,
ADD COLUMN     "attachmentUrl" TEXT;
