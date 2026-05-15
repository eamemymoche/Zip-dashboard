-- CreateVehicleTable
CREATE TABLE IF NOT EXISTS "Vehicle" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT,
    "capacity" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateVehicleCodeUniqueIndex (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Vehicle_code_key') THEN
        CREATE UNIQUE INDEX "Vehicle_code_key" ON "Vehicle"("code");
    END IF;
END $$;

-- AddVehicleIdToTransportAssignment (idempotent - only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'TransportAssignment' AND column_name = 'vehicleId'
    ) THEN
        ALTER TABLE "TransportAssignment" ADD COLUMN "vehicleId" TEXT;
    END IF;
END $$;

-- AddTransportAssignmentVehicleForeignKey (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'TransportAssignment_vehicleId_fkey'
    ) THEN
        ALTER TABLE "TransportAssignment" ADD CONSTRAINT "TransportAssignment_vehicleId_fkey"
            FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;