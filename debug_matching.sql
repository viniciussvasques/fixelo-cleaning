-- Verificar cleaner availability
SELECT cp.id, cp.status, u.email, 
       (SELECT COUNT(*) FROM "CleanerAvailability" WHERE "cleanerId" = cp.id) as availability_count
FROM "CleanerProfile" cp 
JOIN "User" u ON cp."userId" = u.id;

-- Verificar availability details
SELECT * FROM "CleanerAvailability";

-- Verificar último booking
SELECT id, status, "scheduledDate", "stripePaymentIntentId" 
FROM "Booking" 
ORDER BY "createdAt" DESC 
LIMIT 3;

-- Verificar assignments
SELECT * FROM "CleanerAssignment" ORDER BY "createdAt" DESC LIMIT 3;
