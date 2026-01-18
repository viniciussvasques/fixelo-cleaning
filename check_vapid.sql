SELECT key, LEFT(value, 50) as value_preview, LENGTH(value) as value_length FROM "SystemConfig" WHERE key LIKE '%vapid%';
