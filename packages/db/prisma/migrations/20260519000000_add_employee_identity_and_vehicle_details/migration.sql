ALTER TABLE "Employee"
ADD COLUMN IF NOT EXISTS "englishFirstName" TEXT,
ADD COLUMN IF NOT EXISTS "englishLastName" TEXT,
ADD COLUMN IF NOT EXISTS "englishNickname" TEXT,
ADD COLUMN IF NOT EXISTS "defaultUsername" TEXT;

ALTER TABLE "Vehicle"
ADD COLUMN IF NOT EXISTS "licensePlate" TEXT,
ADD COLUMN IF NOT EXISTS "adminNote" TEXT;

UPDATE "Employee"
SET
  "englishFirstName" = COALESCE(
    NULLIF("englishFirstName", ''),
    NULLIF(split_part("name", ' ', 1), '')
  ),
  "englishLastName" = COALESCE(
    NULLIF("englishLastName", ''),
    NULLIF(
      CASE
        WHEN strpos(trim("name"), ' ') > 0 THEN regexp_replace(trim("name"), '^.*\s+', '')
        ELSE ''
      END,
      ''
    )
  )
WHERE "role" IN ('STAFF', 'DRIVER', 'MANAGER', 'ADMIN');

UPDATE "Employee"
SET "defaultUsername" = lower(
  regexp_replace(COALESCE("englishFirstName", ''), '[^a-zA-Z0-9]', '', 'g') ||
  CASE
    WHEN regexp_replace(COALESCE("englishFirstName", ''), '[^a-zA-Z0-9]', '', 'g') <> ''
     AND left(regexp_replace(COALESCE("englishLastName", ''), '[^a-zA-Z0-9]', '', 'g'), 3) <> ''
      THEN '.'
    ELSE ''
  END ||
  left(regexp_replace(COALESCE("englishLastName", ''), '[^a-zA-Z0-9]', '', 'g'), 3)
)
WHERE COALESCE("defaultUsername", '') = ''
  AND "role" IN ('STAFF', 'DRIVER');
