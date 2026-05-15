-- AddEmployeeOptionalFields
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Employee' AND column_name = 'nickname'
    ) THEN
        ALTER TABLE "Employee" ADD COLUMN "nickname" TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Employee' AND column_name = 'phone'
    ) THEN
        ALTER TABLE "Employee" ADD COLUMN "phone" TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Employee' AND column_name = 'phone2'
    ) THEN
        ALTER TABLE "Employee" ADD COLUMN "phone2" TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Employee' AND column_name = 'startDate'
    ) THEN
        ALTER TABLE "Employee" ADD COLUMN "startDate" TIMESTAMP(3);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Employee' AND column_name = 'photo'
    ) THEN
        ALTER TABLE "Employee" ADD COLUMN "photo" TEXT;
    END IF;
END $$;