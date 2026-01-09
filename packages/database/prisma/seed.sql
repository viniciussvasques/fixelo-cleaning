-- Seed ServiceTypes (usando jsonb para arrays)
INSERT INTO "ServiceType" (id, name, slug, description, "basePrice", inclusions, exclusions, "isActive", "createdAt", "updatedAt", "baseTime", "timePerBed", "timePerBath")
SELECT gen_random_uuid(), 'Standard Cleaning', 'standard', 'Regular home cleaning service', 109, 
       '["Dusting all surfaces", "Vacuum all floors", "Mop hard floors", "Bathroom cleaning", "Kitchen surface cleaning", "Trash removal"]'::jsonb, 
       '["Inside oven", "Inside fridge"]'::jsonb, true, NOW(), NOW(), 120, 45, 30
WHERE NOT EXISTS (SELECT 1 FROM "ServiceType" WHERE slug='standard');

INSERT INTO "ServiceType" (id, name, slug, description, "basePrice", inclusions, exclusions, "isActive", "createdAt", "updatedAt", "baseTime", "timePerBed", "timePerBath")
SELECT gen_random_uuid(), 'Deep Cleaning', 'deep', 'Thorough deep cleaning service', 169, 
       '["Everything in Standard", "Inside oven cleaning", "Inside fridge cleaning", "Baseboards", "Cabinet exteriors"]'::jsonb, 
       '[]'::jsonb, true, NOW(), NOW(), 180, 60, 45
WHERE NOT EXISTS (SELECT 1 FROM "ServiceType" WHERE slug='deep');

INSERT INTO "ServiceType" (id, name, slug, description, "basePrice", inclusions, exclusions, "isActive", "createdAt", "updatedAt", "baseTime", "timePerBed", "timePerBath")
SELECT gen_random_uuid(), 'Airbnb / Vacation Rental', 'airbnb', 'Turnover cleaning for vacation rentals', 129, 
       '["Turnover cleaning", "Bed linens change", "Trash removal", "Bathroom reset", "Kitchen reset"]'::jsonb, 
       '[]'::jsonb, true, NOW(), NOW(), 90, 30, 20
WHERE NOT EXISTS (SELECT 1 FROM "ServiceType" WHERE slug='airbnb');

-- Seed AddOns
INSERT INTO "AddOn" (id, name, slug, description, price, "timeAdded", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Inside Oven Cleaning', 'inside-oven', 'Deep clean inside oven', 25, 30, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "AddOn" WHERE slug='inside-oven');

INSERT INTO "AddOn" (id, name, slug, description, price, "timeAdded", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Inside Fridge Cleaning', 'inside-fridge', 'Deep clean inside refrigerator', 25, 30, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "AddOn" WHERE slug='inside-fridge');

INSERT INTO "AddOn" (id, name, slug, description, price, "timeAdded", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Eco-Friendly Products', 'eco-products', 'Use green cleaning products', 10, 0, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "AddOn" WHERE slug='eco-products');

INSERT INTO "AddOn" (id, name, slug, description, price, "timeAdded", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Window Cleaning', 'window-cleaning', 'Interior window cleaning', 35, 45, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "AddOn" WHERE slug='window-cleaning');
