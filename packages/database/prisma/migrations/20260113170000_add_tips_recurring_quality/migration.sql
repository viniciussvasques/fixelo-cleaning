-- Migration: Add Tips, Recurring Bookings, Quality Guarantee, and Cancellation Features
-- Date: 2026-01-13

-- ============================================
-- ENUMS
-- ============================================

-- RecurringFrequency enum
DO $$ BEGIN
    CREATE TYPE "RecurringFrequency" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- QualityIssueStatus enum
DO $$ BEGIN
    CREATE TYPE "QualityIssueStatus" AS ENUM ('OPEN', 'RECLEAN_SCHEDULED', 'REFUNDED', 'RESOLVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- BOOKING TABLE UPDATES
-- ============================================

-- Tips
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "tipAmount" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "tipPaidAt" TIMESTAMP(3);

-- Recurring Booking Link
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "recurringId" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "discountPercent" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "discountAmount" DOUBLE PRECISION DEFAULT 0;

-- Cancellation Fee
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "cancellationFee" DOUBLE PRECISION DEFAULT 0;

-- Quality Guarantee
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "recleanRequested" BOOLEAN DEFAULT false;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "recleanRequestedAt" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "recleanReason" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "recleanBookingId" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "qualityIssueRefunded" BOOLEAN DEFAULT false;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "refundReason" TEXT;

-- ============================================
-- CLEANER PROFILE UPDATES (Strikes System)
-- ============================================

ALTER TABLE "CleanerProfile" ADD COLUMN IF NOT EXISTS "strikes" INTEGER DEFAULT 0;
ALTER TABLE "CleanerProfile" ADD COLUMN IF NOT EXISTS "lastStrikeAt" TIMESTAMP(3);
ALTER TABLE "CleanerProfile" ADD COLUMN IF NOT EXISTS "strikeReasons" TEXT;

-- ============================================
-- FINANCIAL SETTINGS UPDATES
-- ============================================

-- Minimum Booking
ALTER TABLE "FinancialSettings" ADD COLUMN IF NOT EXISTS "minBookingAmount" DOUBLE PRECISION DEFAULT 60;

-- Recurring Discounts
ALTER TABLE "FinancialSettings" ADD COLUMN IF NOT EXISTS "weeklyDiscount" DOUBLE PRECISION DEFAULT 0.15;
ALTER TABLE "FinancialSettings" ADD COLUMN IF NOT EXISTS "biweeklyDiscount" DOUBLE PRECISION DEFAULT 0.10;
ALTER TABLE "FinancialSettings" ADD COLUMN IF NOT EXISTS "monthlyDiscount" DOUBLE PRECISION DEFAULT 0.05;

-- Cancellation Policy
ALTER TABLE "FinancialSettings" ADD COLUMN IF NOT EXISTS "freeCancelHours" INTEGER DEFAULT 24;
ALTER TABLE "FinancialSettings" ADD COLUMN IF NOT EXISTS "lateCancelFeePercent" DOUBLE PRECISION DEFAULT 0.50;
ALTER TABLE "FinancialSettings" ADD COLUMN IF NOT EXISTS "cleanerStrikePenalty" DOUBLE PRECISION DEFAULT 25;
ALTER TABLE "FinancialSettings" ADD COLUMN IF NOT EXISTS "maxStrikes" INTEGER DEFAULT 3;

-- Quality Guarantee
ALTER TABLE "FinancialSettings" ADD COLUMN IF NOT EXISTS "autoRefundThreshold" INTEGER DEFAULT 2;
ALTER TABLE "FinancialSettings" ADD COLUMN IF NOT EXISTS "recleanWindowHours" INTEGER DEFAULT 48;

-- ============================================
-- NEW TABLES
-- ============================================

-- RecurringBooking Table
CREATE TABLE IF NOT EXISTS "RecurringBooking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceTypeId" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "hasPets" BOOLEAN NOT NULL DEFAULT false,
    "specialInstructions" TEXT,
    "preferredDay" "DayOfWeek" NOT NULL,
    "preferredTime" TEXT NOT NULL,
    "frequency" "RecurringFrequency" NOT NULL,
    "discountPercent" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "nextBookingDate" TIMESTAMP(3),
    "lastBookingDate" TIMESTAMP(3),
    "totalBookings" INTEGER NOT NULL DEFAULT 0,
    "preferredCleanerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecurringBooking_pkey" PRIMARY KEY ("id")
);

-- QualityIssue Table
CREATE TABLE IF NOT EXISTS "QualityIssue" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "issueType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "photos" TEXT,
    "status" "QualityIssueStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolutionNotes" TEXT,
    "refundAmount" DOUBLE PRECISION,
    "creditAmount" DOUBLE PRECISION,
    "recleanBookingId" TEXT,
    "assignedTo" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QualityIssue_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS "RecurringBooking_userId_idx" ON "RecurringBooking"("userId");
CREATE INDEX IF NOT EXISTS "RecurringBooking_isActive_idx" ON "RecurringBooking"("isActive");
CREATE INDEX IF NOT EXISTS "QualityIssue_bookingId_idx" ON "QualityIssue"("bookingId");
CREATE INDEX IF NOT EXISTS "QualityIssue_userId_idx" ON "QualityIssue"("userId");
CREATE INDEX IF NOT EXISTS "QualityIssue_cleanerId_idx" ON "QualityIssue"("cleanerId");
CREATE INDEX IF NOT EXISTS "QualityIssue_status_idx" ON "QualityIssue"("status");

-- ============================================
-- FOREIGN KEYS
-- ============================================

-- Add foreign key for recurringId in Booking (if not exists)
DO $$ BEGIN
    ALTER TABLE "Booking" ADD CONSTRAINT "Booking_recurringId_fkey" 
    FOREIGN KEY ("recurringId") REFERENCES "RecurringBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
