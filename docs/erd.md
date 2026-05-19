# Database ERD

Source of truth: `packages/db/prisma/schema.prisma` and current migrations under `packages/db/prisma/migrations`.

```mermaid
erDiagram
    User {
        string id PK
        string username UK
        string email UK
        string passwordHash
        string displayName
        UserRole role
        boolean active
        string moduleAccessJson
        datetime createdAt
        datetime updatedAt
    }

    Employee {
        string id PK
        string code UK
        string name
        string nickname
        EmployeeRole role
        string phone
        string phone2
        datetime startDate
        string photo
        boolean active
        datetime createdAt
        datetime updatedAt
    }

    ProductPackage {
        string id PK
        string name UK
        string detail
        boolean active
        datetime createdAt
        datetime updatedAt
    }

    Booking {
        string id PK
        string bookingNumber UK
        datetime serviceDate
        string timeSlot
        string agentName
        string customerName
        string phone
        string hotel
        string room
        int pickupPax
        int joinCount
        string adminNote
        string sourceChannel
        BookingStatus status
        datetime createdAt
        datetime updatedAt
        string createdById FK
        string productPackageId FK
    }

    TransportAssignment {
        string id PK
        string bookingId UK, FK
        string driverId FK
        string vehicleId FK
        datetime assignedAt
        string assignedBy
    }

    Vehicle {
        string id PK
        string code UK
        string type
        int capacity
        boolean active
        string notes
        datetime createdAt
        datetime updatedAt
    }

    PickupStatusEvent {
        string id PK
        string bookingId FK
        BookingStatus status
        string note
        datetime createdAt
        string createdBy
    }

    StaffAssignment {
        string id PK
        string bookingId FK
        string employeeId FK
        datetime createdAt
    }

    AuditLog {
        string id PK
        string actorId FK
        string entityType
        string entityId
        string action
        string beforeJson
        string afterJson
        datetime createdAt
    }

    User ||--o{ Booking : creates
    User ||--o{ AuditLog : acts_in
    ProductPackage ||--o{ Booking : packages
    Booking ||--o| TransportAssignment : has_transport
    Employee ||--o{ TransportAssignment : drives
    Vehicle ||--o{ TransportAssignment : assigned_to
    Booking ||--o{ PickupStatusEvent : logs_status
    Booking ||--o{ StaffAssignment : needs_staff
    Employee ||--o{ StaffAssignment : assigned
```

## Notes

- Database provider is PostgreSQL via Prisma.
- `PickupStatusEvent.createdBy` is currently a plain string column, not a foreign key to `User`.
- `TransportAssignment.assignedBy` is currently a plain string column, not a foreign key to `User`.
- `TransportAssignment.bookingId` is unique, so one booking can have at most one transport assignment.
- `StaffAssignment` is a join table for many-to-many between `Booking` and `Employee`.
