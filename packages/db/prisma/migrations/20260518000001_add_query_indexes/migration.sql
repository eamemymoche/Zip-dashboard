-- Add query indexes for high-traffic dashboard/API read paths and FK joins.
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_active_idx" ON "User"("active");

CREATE INDEX IF NOT EXISTS "Employee_role_active_idx" ON "Employee"("role", "active");
CREATE INDEX IF NOT EXISTS "ProductPackage_active_idx" ON "ProductPackage"("active");

CREATE INDEX IF NOT EXISTS "Booking_serviceDate_timeSlot_idx" ON "Booking"("serviceDate", "timeSlot");
CREATE INDEX IF NOT EXISTS "Booking_status_serviceDate_idx" ON "Booking"("status", "serviceDate");
CREATE INDEX IF NOT EXISTS "Booking_createdById_idx" ON "Booking"("createdById");
CREATE INDEX IF NOT EXISTS "Booking_productPackageId_idx" ON "Booking"("productPackageId");

CREATE INDEX IF NOT EXISTS "TransportAssignment_driverId_idx" ON "TransportAssignment"("driverId");
CREATE INDEX IF NOT EXISTS "TransportAssignment_vehicleId_idx" ON "TransportAssignment"("vehicleId");
CREATE INDEX IF NOT EXISTS "Vehicle_active_idx" ON "Vehicle"("active");

CREATE INDEX IF NOT EXISTS "PickupStatusEvent_bookingId_createdAt_idx" ON "PickupStatusEvent"("bookingId", "createdAt");
CREATE INDEX IF NOT EXISTS "PickupStatusEvent_createdBy_idx" ON "PickupStatusEvent"("createdBy");

CREATE INDEX IF NOT EXISTS "StaffAssignment_employeeId_idx" ON "StaffAssignment"("employeeId");

CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_createdAt_idx" ON "AuditLog"("entityType", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_entityId_idx" ON "AuditLog"("entityId");
CREATE INDEX IF NOT EXISTS "AuditLog_actorId_idx" ON "AuditLog"("actorId");
