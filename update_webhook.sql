UPDATE "SystemConfig" 
SET value = 'whsec_9N5sbzkctDo3xL5w5oyAY6uMYS5ULwGW' 
WHERE key = 'stripe_webhook_secret';

SELECT key, LEFT(value, 15) as prefix FROM "SystemConfig" WHERE key = 'stripe_webhook_secret';
