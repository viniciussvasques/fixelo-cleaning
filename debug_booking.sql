SELECT id, status, "scheduledDate", "stripePaymentIntentId", "createdAt"
FROM "Booking" 
ORDER BY "createdAt" DESC 
LIMIT 3;

SELECT id, status, "userId", type, "createdAt"
FROM "Notification"
ORDER BY "createdAt" DESC
LIMIT 5;
