-- Check user data
SELECT email, role, "isActive", left("passwordHash", 10) as hash_start FROM "User";

-- Delete users to recreate via signup
DELETE FROM "User" WHERE email IN ('admin@fixelo.app', 'cleaner@fixelo.app');

-- Verify deletion
SELECT COUNT(*) as user_count FROM "User";
