INSERT INTO "SystemConfig" (id, key, value, "createdAt", "updatedAt") 
VALUES (gen_random_uuid(), 'cron_secret', '57865f8ef494d8f0d618b96e0e7d078c69f3aa8b626d998bc5d522ed32673563d', NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW();

SELECT key, LEFT(value, 20) as value_preview FROM "SystemConfig" WHERE key = 'cron_secret';
