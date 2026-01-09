-- Create admin user with password: password123 (bcrypt hash)
INSERT INTO "User" (id, email, "passwordHash", "firstName", "lastName", role, "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'admin@fixelo.app', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.Y46akNCJTZwJo0kn9W', 'System', 'Admin', 'ADMIN', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "User" WHERE email='admin@fixelo.app');

-- Create cleaner user with password: password123 (bcrypt hash)
INSERT INTO "User" (id, email, "passwordHash", "firstName", "lastName", role, "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'cleaner@fixelo.app', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.Y46akNCJTZwJo0kn9W', 'John', 'Cleaner', 'CLEANER', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "User" WHERE email='cleaner@fixelo.app');
