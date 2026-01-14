-- Add NO_SHOW to AssignmentStatus enum
ALTER TYPE "AssignmentStatus" ADD VALUE IF NOT EXISTS 'NO_SHOW';

-- Add noShowCount to CleanerProfile
ALTER TABLE "CleanerProfile" ADD COLUMN IF NOT EXISTS "noShowCount" INTEGER NOT NULL DEFAULT 0;
