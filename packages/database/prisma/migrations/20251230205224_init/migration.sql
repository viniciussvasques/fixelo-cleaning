-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'CLEANER', 'ADMIN');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('DRAFT', 'PENDING', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'DISPUTED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "CleanerStatus" AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'BUSY', 'UNAVAILABLE', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SMS', 'EMAIL', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "emailVerified" TIMESTAMP(3),
    "phoneVerified" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleanerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "CleanerStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalRatings" INTEGER NOT NULL DEFAULT 0,
    "jobsCompleted" INTEGER NOT NULL DEFAULT 0,
    "jobsCancelled" INTEGER NOT NULL DEFAULT 0,
    "cancellationsLast30" INTEGER NOT NULL DEFAULT 0,
    "stripeAccountId" TEXT,
    "backgroundCheckStatus" TEXT,
    "backgroundCheckId" TEXT,
    "insuranceVerified" BOOLEAN NOT NULL DEFAULT false,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "serviceRadius" INTEGER NOT NULL DEFAULT 25,
    "acceptsStandard" BOOLEAN NOT NULL DEFAULT true,
    "acceptsDeep" BOOLEAN NOT NULL DEFAULT true,
    "acceptsAirbnb" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleanerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleanerAvailability" (
    "id" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleanerAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "inclusions" JSONB NOT NULL,
    "exclusions" JSONB,
    "baseTime" INTEGER NOT NULL,
    "timePerBed" INTEGER NOT NULL,
    "timePerBath" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddOn" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "timeAdded" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AddOn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceTypeId" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "timeWindow" TEXT NOT NULL,
    "estimatedDuration" INTEGER NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "squareFootage" INTEGER,
    "hasPets" BOOLEAN NOT NULL DEFAULT false,
    "specialInstructions" TEXT,
    "addressId" TEXT,
    "addressSnapshot" JSONB NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "addOnsTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "stripeFee" DOUBLE PRECISION NOT NULL,
    "platformReserve" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "stripePaymentIntentId" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingAddOn" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "addOnId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingAddOn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleanerAssignment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "matchScore" DOUBLE PRECISION,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "distanceKm" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleanerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "stripeFee" DOUBLE PRECISION NOT NULL,
    "platformReserve" DOUBLE PRECISION NOT NULL,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "stripePaymentIntentId" TEXT,
    "stripeChargeId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "cleanerId" TEXT,
    "cleanerAmount" DOUBLE PRECISION,
    "platformAmount" DOUBLE PRECISION,
    "stripeTransferId" TEXT,
    "paidOutAt" TIMESTAMP(3),
    "refundedAmount" DOUBLE PRECISION,
    "refundedAt" TIMESTAMP(3),
    "stripeRefundId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "qualityRating" INTEGER,
    "punctualityRating" INTEGER,
    "friendlinessRating" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT,
    "street" TEXT NOT NULL,
    "unit" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'US',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "accessInstructions" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "twilioSid" TEXT,
    "sendgridId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "CleanerProfile_userId_key" ON "CleanerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CleanerProfile_stripeAccountId_key" ON "CleanerProfile"("stripeAccountId");

-- CreateIndex
CREATE INDEX "CleanerProfile_status_idx" ON "CleanerProfile"("status");

-- CreateIndex
CREATE INDEX "CleanerProfile_latitude_longitude_idx" ON "CleanerProfile"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "CleanerAvailability_cleanerId_isActive_idx" ON "CleanerAvailability"("cleanerId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CleanerAvailability_cleanerId_dayOfWeek_startTime_key" ON "CleanerAvailability"("cleanerId", "dayOfWeek", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceType_name_key" ON "ServiceType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceType_slug_key" ON "ServiceType"("slug");

-- CreateIndex
CREATE INDEX "ServiceType_slug_idx" ON "ServiceType"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AddOn_name_key" ON "AddOn"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AddOn_slug_key" ON "AddOn"("slug");

-- CreateIndex
CREATE INDEX "AddOn_isActive_idx" ON "AddOn"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_stripePaymentIntentId_key" ON "Booking"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_scheduledDate_idx" ON "Booking"("scheduledDate");

-- CreateIndex
CREATE INDEX "Booking_serviceTypeId_idx" ON "Booking"("serviceTypeId");

-- CreateIndex
CREATE INDEX "BookingAddOn_bookingId_idx" ON "BookingAddOn"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingAddOn_bookingId_addOnId_key" ON "BookingAddOn"("bookingId", "addOnId");

-- CreateIndex
CREATE INDEX "CleanerAssignment_bookingId_idx" ON "CleanerAssignment"("bookingId");

-- CreateIndex
CREATE INDEX "CleanerAssignment_cleanerId_idx" ON "CleanerAssignment"("cleanerId");

-- CreateIndex
CREATE INDEX "CleanerAssignment_status_idx" ON "CleanerAssignment"("status");

-- CreateIndex
CREATE INDEX "CleanerAssignment_expiresAt_idx" ON "CleanerAssignment"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_bookingId_key" ON "Payment"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeChargeId_key" ON "Payment"("stripeChargeId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeTransferId_key" ON "Payment"("stripeTransferId");

-- CreateIndex
CREATE INDEX "Payment_bookingId_idx" ON "Payment"("bookingId");

-- CreateIndex
CREATE INDEX "Payment_cleanerId_idx" ON "Payment"("cleanerId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_key" ON "Review"("bookingId");

-- CreateIndex
CREATE INDEX "Review_cleanerId_idx" ON "Review"("cleanerId");

-- CreateIndex
CREATE INDEX "Review_rating_idx" ON "Review"("rating");

-- CreateIndex
CREATE INDEX "Address_userId_idx" ON "Address"("userId");

-- CreateIndex
CREATE INDEX "Address_latitude_longitude_idx" ON "Address"("latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_twilioSid_key" ON "Notification"("twilioSid");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_sendgridId_key" ON "Notification"("sendgridId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "Notification"("status");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog"("entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");

-- CreateIndex
CREATE INDEX "SystemConfig_key_idx" ON "SystemConfig"("key");

-- AddForeignKey
ALTER TABLE "CleanerProfile" ADD CONSTRAINT "CleanerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanerAvailability" ADD CONSTRAINT "CleanerAvailability_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "CleanerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "ServiceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAddOn" ADD CONSTRAINT "BookingAddOn_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAddOn" ADD CONSTRAINT "BookingAddOn_addOnId_fkey" FOREIGN KEY ("addOnId") REFERENCES "AddOn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanerAssignment" ADD CONSTRAINT "CleanerAssignment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanerAssignment" ADD CONSTRAINT "CleanerAssignment_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "CleanerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "CleanerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "CleanerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
