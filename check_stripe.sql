SELECT key, 
       LEFT(value, 10) as prefix, 
       LENGTH(value) as len 
FROM "SystemConfig" 
WHERE key IN ('stripe_secret_key', 'stripe_webhook_secret', 'stripe_publishable_key');
