-- Update admin user password with bcrypt hash for 'password123' (round 12)
-- This hash was generated using: bcrypt.hash('password123', 12)
UPDATE "User" 
SET "passwordHash" = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdO.g.0JH3Rkq'
WHERE email = 'admin@fixelo.app';

UPDATE "User" 
SET "passwordHash" = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdO.g.0JH3Rkq'
WHERE email = 'cleaner@fixelo.app';

-- Verify
SELECT email, role, "isActive" FROM "User";
