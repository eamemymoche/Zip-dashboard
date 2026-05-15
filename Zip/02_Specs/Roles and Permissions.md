# Roles and Permissions

Status: Active  
Last updated: 2026-05-14

## Intent

This note defines a small-business access model for Zipline. It intentionally avoids overbuilt enterprise RBAC at the current stage.

## Role Set

Use this starting role model:

- `Owner`
- `Accounting`
- `Officer`
- `Staff`
- `Driver`

`Head Manager` can be treated as `Owner` if the business uses that term operationally.

## Role Summaries

### Owner

Full operational and administrative control.

Primary capabilities:

- all dashboards
- role management
- master data changes
- sensitive operational edits
- audit visibility
- recovery oversight

### Accounting

Financial and reconciliation role.

Primary capabilities:

- payment and transfer review
- financial remarks
- voucher / money reconciliation
- export visibility for finance-related operations

Accounting should not automatically receive full transport or staffing edit power unless the business explicitly wants that.

### Officer

Primary day-to-day operations role.

Primary capabilities:

- booking intake and edits
- normalized order maintenance
- transport planning
- driver and vehicle assignment
- staffing planning
- operational notes
- job sheet generation

This is likely the most-used internal role.

### Staff

Field execution role with limited access.

Primary capabilities:

- view work relevant to assigned rounds or tasks
- update limited execution states if explicitly allowed
- avoid access to broad finance or master configuration screens

### Driver

Transport execution role with narrow visibility.

Primary capabilities:

- assigned pickup list
- assigned vehicle
- job sheet / route-relevant customer information
- minimal status update actions where appropriate

Drivers should not receive broad access to unrelated dashboards or full customer history.

## Dashboard Access Guidance

Recommended initial access pattern:

- Overview
  - Owner, Accounting, Officer
  - Staff and Driver only if a simplified operational view is created

- Order List
  - Owner, Officer
  - Accounting read-only only if financially relevant fields are shown safely

- Transport
  - Owner, Officer, Driver (restricted driver-facing subset)

- Staffing
  - Owner, Officer, Staff (restricted subset if needed)

- Personnel
  - Owner, Officer

- Master Ops / Reporting
  - Owner, Accounting, Officer

## Field-Level Editing Guidance

### Sensitive fields

Restrict broader editing of:

- payment and reconciliation fields
- role assignments
- audit-related controls
- master package definitions
- destructive deletes

### Operational fields

Officer should generally be able to edit:

- booking details
- pickup details
- dispatch round
- driver
- vehicle
- staffing assignments
- admin notes

### Driver-visible data

Drivers should see only what is needed to execute transport safely:

- round
- guest name
- hotel / pickup point
- phone if operationally necessary
- assigned vehicle
- job sheet notes relevant to pickup

Do not expose unnecessary financial or unrelated internal remarks.

## Audit Requirement

At minimum, log who changed:

- booking details
- transport assignment
- vehicle assignment
- staffing assignment
- payment / reconciliation
- role mappings

## Authentication Guidance

The first production auth system should stay simple:

- internal login
- role-based route and action gating
- auditable edits on important actions

Avoid overbuilding SSO, complex org hierarchies, or enterprise admin flows at the current business size unless the business explicitly asks for it.

## 2026-05-14 — Auth Model Update

### Two-Role Model

The system now has two separate role concepts:

- **`UserRole`** (business role, on `User` entity): ADMIN, ACCOUNTING, MANAGER, STAFF, DRIVER
- **`EmployeeRole`** (field role, on `Employee` entity): ADMIN, DRIVER, STAFF, MANAGER

These are intentionally separate. A `User` logs in and gets a business-role for access control. An `Employee` is a staffing record with a field-role for operational classification. They map cleanly — a User can be associated with an Employee via email or code if needed, but they are different entities.

### Auth Flow

- Login via `api/auth/login` with email + password
- Session token issued as httpOnly cookie `zcc_session`
- Middleware reads session, sets `x-user-id` and `x-user-role` headers
- AuthProvider exposes `{ userId, role, loading }` to React tree
- Login page redirects to `/` on success

### Role Access

Phase 1 (current): Auth presence gates access. Role-based route/action enforcement is not yet implemented.

Future Phase: Per-role access per [[Dashboard Access Guidance]] and [[Field-Level Editing Guidance]].

## Success Test

This model is correct if a future agent can decide:

- who can enter a given dashboard
- who can edit a given field
- what a driver can see without exposing too much
- what must be audited when changed
