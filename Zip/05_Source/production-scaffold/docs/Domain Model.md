# Domain Model Draft

## Booking

- id
- bookingNumber
- serviceDate
- timeSlot
- agentName
- packageId
- customerName
- phone
- hotel
- room
- pickupPax
- joinCount
- status
- adminNote
- createdBy
- updatedBy

## Employee

- id
- code
- name
- role
- active

## ProductPackage

- id
- name
- detail
- active

## TransportAssignment

- id
- bookingId
- driverId
- assignedAt
- assignedBy

## PickupStatusEvent

- id
- bookingId
- status
- note
- createdAt
- createdBy

## AuditLog

- id
- actorId
- entityType
- entityId
- action
- before
- after
- createdAt

