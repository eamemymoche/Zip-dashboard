ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT;

UPDATE "User"
SET "username" = split_part("email", '@', 1)
WHERE "username" IS NULL OR "username" = '';

ALTER TABLE "User"
ALTER COLUMN "username" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'User_username_key'
  ) THEN
    CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
  END IF;
END $$;
