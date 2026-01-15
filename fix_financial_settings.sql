-- Adicionar colunas faltando no FinancialSettings
ALTER TABLE "FinancialSettings" 
ADD COLUMN IF NOT EXISTS "requiredBeforePhotos" INTEGER DEFAULT 2;

ALTER TABLE "FinancialSettings" 
ADD COLUMN IF NOT EXISTS "requiredAfterPhotos" INTEGER DEFAULT 3;

ALTER TABLE "FinancialSettings" 
ADD COLUMN IF NOT EXISTS "geofenceRadiusMeters" INTEGER DEFAULT 100;

ALTER TABLE "FinancialSettings" 
ADD COLUMN IF NOT EXISTS "stripeFeePercent" FLOAT DEFAULT 0.029;

ALTER TABLE "FinancialSettings" 
ADD COLUMN IF NOT EXISTS "stripeFeeFixed" FLOAT DEFAULT 0.30;

-- Verificar colunas
SELECT column_name FROM information_schema.columns WHERE table_name = 'FinancialSettings';
