-- Create missing tables for Fixelo

CREATE TABLE IF NOT EXISTS "Payout" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "cleanerId" TEXT NOT NULL,
    amount FLOAT NOT NULL,
    currency TEXT DEFAULT 'usd',
    status TEXT NOT NULL,
    "periodStart" TIMESTAMP NOT NULL,
    "periodEnd" TIMESTAMP NOT NULL,
    "stripePayoutId" TEXT,
    "paidAt" TIMESTAMP,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Referral" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "referrerId" TEXT NOT NULL,
    "referredId" TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL,
    "bonusAmount" FLOAT DEFAULT 20,
    "paidAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Message" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "bookingId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "FinancialSettings" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "platformFeePercent" FLOAT DEFAULT 0.15,
    "stripeFeePercent" FLOAT DEFAULT 0.029,
    "stripeFeeFixed" FLOAT DEFAULT 0.30,
    "insuranceFeePercent" FLOAT DEFAULT 0.02,
    "autoPayoutEnabled" BOOLEAN DEFAULT true,
    "payoutSchedule" TEXT DEFAULT 'WEEKLY',
    "payoutDay" TEXT DEFAULT 'FRIDAY',
    "minPayoutAmount" FLOAT DEFAULT 50,
    "holdDaysAfterService" INTEGER DEFAULT 2,
    "requireCustomerReview" BOOLEAN DEFAULT true,
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "CleanerReference" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "cleanerId" TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    relationship TEXT NOT NULL,
    contacted BOOLEAN DEFAULT false,
    "contactedAt" TIMESTAMP,
    "contactedBy" TEXT,
    verified BOOLEAN DEFAULT false,
    notes TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "Payout_cleanerId_idx" ON "Payout"("cleanerId");
CREATE INDEX IF NOT EXISTS "Message_bookingId_idx" ON "Message"("bookingId");
CREATE INDEX IF NOT EXISTS "CleanerReference_cleanerId_idx" ON "CleanerReference"("cleanerId");
