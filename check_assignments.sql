-- Verificar últimos bookings e seus assignments
SELECT b.id, b.status, 
       (SELECT COUNT(*) FROM "CleanerAssignment" WHERE "bookingId" = b.id) as assignment_count
FROM "Booking" b
ORDER BY b."createdAt" DESC 
LIMIT 5;
