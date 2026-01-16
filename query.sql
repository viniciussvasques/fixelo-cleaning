-- Sync FinancialSettings with the value from SystemConfig (0.20 = 20%)
UPDATE "FinancialSettings" 
SET "platformFeePercent" = 0.20;

-- Verify the update
SELECT "platformFeePercent", "insuranceFeePercent", "stripeFeePercent" 
FROM "FinancialSettings" 
LIMIT 1;
