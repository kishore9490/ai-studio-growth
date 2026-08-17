/*
  Warnings:

  - Added the required column `secretMasked` to the `webhooks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "persons" ALTER COLUMN "emailHash" DROP NOT NULL;

-- AlterTable
ALTER TABLE "verification_checks" ADD COLUMN     "resultId" TEXT;

-- AlterTable
ALTER TABLE "verification_requests" ADD COLUMN     "assessmentId" TEXT,
ADD COLUMN     "credentialId" TEXT;

-- AlterTable
ALTER TABLE "verification_results" ADD COLUMN     "evidenceId" TEXT;

-- AlterTable
ALTER TABLE "webhooks" ADD COLUMN     "secretMasked" TEXT NOT NULL,
ALTER COLUMN "secretHash" DROP NOT NULL;
