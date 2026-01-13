-- 1. Set the default value for is_legacy to FALSE (so new logs are visible)
ALTER TABLE "public"."audit_logs" ALTER COLUMN "is_legacy" SET DEFAULT FALSE;

-- 2. Backfill existing NULL values to FALSE (to recover "invisible" logs)
UPDATE "public"."audit_logs" 
SET "is_legacy" = FALSE 
WHERE "is_legacy" IS NULL;
