# Requirements

Source: [[ChatGPT Share Capture]]

## Functional Requirements

- Booking/order management with create, edit, cancel, search, and filters.
- Booking fields should include booking number, date, time slot, agent, package, customer name, phone, hotel, room, join count, pickup pax, notes, source channel, creator, and updater.
- Transport assignment by date, round, hotel, customer, pax, and driver.
- Pickup recheck status tracking: Waiting, Boarded, No Show, Cancelled, Rescheduled.
- No Show move-to-later-round workflow.
- Driver job sheet generation and A4 print view.
- Personnel database for drivers and field staff.
- Staffing assignment for active orders.
- Staff board and staff KPI views.
- Master operations log across bookings, transport, staffing, status, and notes.
- Pivot/reporting by agent, package, date, round, pax, join count, driver, and staff.
- Product/package master data.
- Operational report export.

## Non-Functional Requirements

- Replace mock browser data with persistent backend/database storage.
- Use authentication and role-based authorization for internal operations.
- Record audit logs for operational changes.
- Support large tables with server-side pagination or virtualization.
- Provide clear loading, empty, and error states.
- Keep admin workflows keyboard-friendly and fast.
- Project should have clear setup instructions.
- Build command should be documented and verified.
- Core data and user flows should be traceable back to source notes.

## Data / Content

- Existing mock arrays in `code.txt`: `orders`, `employees`, `productPackets`.
- Prototype initialization function: `initSystem()`.
- Current source has no `fetch`, `axios`, Supabase, Firebase, MySQL, MongoDB, or backend API calls.

## Acceptance Criteria

- [x] Requirements are specific enough to begin planning.
- [ ] Each major feature has a testable outcome.
- [ ] Unknowns are moved to [[Task Board]] or [[Decision Log]].
