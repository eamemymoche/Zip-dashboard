# Real Workflow Model

Status: Active  
Last updated: 2026-05-14

## Intent

This note converts the observed booking emails, vouchers, pickup instructions, whiteboards, spreadsheet snapshot, and printed job order examples into one canonical workflow model for the Zipline system.

This note should be treated as the business workflow reference for implementation decisions.

## Core Principle

The business does not operate on one source format. It operates on a normalized internal order that is built from multiple source channels and then transformed into dispatch and execution artifacts.

## Source Intake

Observed intake channels include:

- Klook merchant emails and vouchers
- Trip.com booking notifications
- Ticket2Attraction request emails
- manual booking entry by officer
- voucher PDFs and screenshots
- merchant confirmation pages

Future agents should assume more sources may be added later, but these sources are already enough to define the intake model.

## Minimum Extraction Layer

Every source booking should be parsed or entered into an internal structure that captures at least:

- source channel
- source booking id or invoice id
- agent or merchant name
- package / product code
- service date
- supplier booking time or play time
- pickup time or pickup window
- pickup point
- drop-off point
- customer / lead guest name
- guest count: join / pax / visitor where applicable
- room / hotel / location details
- phone / contact method / language
- guest request text
- payment hints or commercial notes
- attachments or reference artifacts

Do not assume all fields exist in all channels. The system should store missing values as missing, not fabricate them.

## Normalization Layer

All source-specific labels should be mapped into one canonical order model.

Examples:

- `Booking No.`, `Invoice`, `Merchant booking code`, and `Confirmation No.` may all map to normalized source identifiers
- `Service Date`, `Date of use`, and Thai fields such as `วันที่ต้องการเข้าร่วม` all map to service date
- `Time`, `Play time`, `Booking time`, and `เวลาที่ต้องการเข้าร่วม` must be separated carefully from pickup time
- `Guest request` may contain pickup, drop-off, or messaging instructions and must not be treated as low-value free text

## Time Model

The system must explicitly distinguish four different time concepts:

1. `Supplier booking time`
   - the activity/play slot confirmed by the source channel
   - example: `14:00`

2. `Guest pickup time/window`
   - the transport expectation communicated to the guest
   - example: `13:15-13:30`

3. `Operational dispatch round`
   - the internal planning bucket used for transport and staffing execution
   - example: `13:00-13:30`

4. `On-site execution slot`
   - the effective activity grouping used once guests are physically processed on site

These are related, but not identical. Future agents must never collapse them into one field.

## Dispatch Planning

After normalization, each order should be assigned into an operational round such as:

- `07:00-07:30`
- `08:00-08:30`
- `09:00-09:30`
- `11:00-11:30`
- `12:00-12:30`
- `13:00-13:30`

These round buckets match the real-world whiteboard planning pattern seen in the image evidence.

Each round entry should support:

- round code / slot
- booking reference
- guest / agent summary
- pax / join counts
- pickup point and hotel
- driver assignment
- vehicle assignment
- staff assignment
- admin note
- status flags

## Transport Planning

Transport planning is not just choosing a driver.

The operational transport record should support:

- driver
- vehicle
- round
- pickup ordering or sequence when needed
- customer-facing pickup note
- internal admin note
- live status such as `Waiting`, `Boarded`, `No Show`, `Cancelled`, `Rescheduled`, `Completed`

Vehicle must be a separate resource because one driver may use different vehicles across days or rounds.

## Staffing Planning

Staff planning should happen after or alongside dispatch planning, not as an isolated back-office task.

The staffing model should consider:

- total pax / join load
- package complexity
- language needs
- round density
- no-show / reschedule effects
- transport coupling for handoff timing

The whiteboard evidence shows that slot-based balancing is operationally more important than flat alphabetical assignment.

## Execution

Once the day is active, each order may move through statuses such as:

- `Waiting`
- `Boarded`
- `No Show`
- `Rescheduled`
- `Cancelled`
- `Completed`

Status changes should be treated as operational events with timestamps and actors, not only as current-state replacements.

## Closure

The closure layer should support:

- payment state
- voucher / transfer / cash / discount notes
- remarks
- photo references
- reconciliation status
- exception handling

The spreadsheet evidence shows that operational closure is broader than guest status alone. Finance and proof artifacts matter.

## Reporting

The reporting model should support breakdowns by:

- day
- round
- source / agent
- package
- driver
- vehicle
- staff
- pax / join
- status
- payment / reconciliation

## UX Implication

The product should be designed around the real operational transitions above, not around isolated data tables.

The most important screens for daily work are:

- order intake / normalized order list
- transport dispatch board
- staffing board
- driver job sheet
- closure / reporting views

## Implementation Rule

When future agents introduce new fields or data models, they should first decide which workflow layer the field belongs to:

- source intake
- normalization
- dispatch planning
- transport planning
- staffing planning
- execution
- closure
- reporting

If the layer is unclear, the implementation is not ready yet.
