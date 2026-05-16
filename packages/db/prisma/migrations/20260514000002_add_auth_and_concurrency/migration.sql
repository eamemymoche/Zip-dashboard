-- AddUserRoleEnum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
        CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'ACCOUNTING', 'MANAGER', 'STAFF', 'DRIVER');
    END IF;
END $$;

-- AddPasswordHashToUser
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'User' AND column_name = 'passwordHash'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;
    END IF;
END $$;

-- ChangeUserRoleType
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'User' AND column_name = 'role'
        AND udt_name <> 'UserRole'
    ) THEN
        ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole" USING "role"::text::"UserRole";
    END IF;
END $$;
