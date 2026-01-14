-- AlterTable
ALTER TABLE "FinancialSettings" ADD COLUMN IF NOT EXISTS "requiredBeforePhotos" INTEGER NOT NULL DEFAULT 2;

-- AlterTable
ALTER TABLE "FinancialSettings" ADD COLUMN IF NOT EXISTS "requiredAfterPhotos" INTEGER NOT NULL DEFAULT 3;

-- AlterTable
ALTER TABLE "FinancialSettings" ADD COLUMN IF NOT EXISTS "geofenceRadiusMeters" INTEGER NOT NULL DEFAULT 100;

-- AlterTable (Stripe fees already exist but ensure they're there)
ALTER TABLE "FinancialSettings" ADD COLUMN IF NOT EXISTS "stripeFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 0.029;

-- AlterTable
ALTER TABLE "FinancialSettings" ADD COLUMN IF NOT EXISTS "stripeFeeFixed" DOUBLE PRECISION NOT NULL DEFAULT 0.30;
