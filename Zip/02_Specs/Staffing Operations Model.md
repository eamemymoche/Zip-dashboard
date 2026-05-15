# Staffing Operations Model

Status: Active  
Last updated: 2026-05-14

## Intent

This note explains how staffing should work in real Zipline operations. It is deliberately written from a dispatch perspective, not from a generic CRUD or HR scheduling perspective.

## Core Principle

Staffing is slot-first and round-first.

The main question is not "who exists in the staff table?" The main question is "is this round properly covered for today’s actual guest load and package mix?"

## Reference Model

The whiteboard dispatch pattern is the reference UX model:

- rounds are visible first
- each round shows grouped workload
- staff load and gaps are obvious at a glance
- adjustments can be made quickly during live operations

The digital product should preserve this clarity, even if the data model becomes richer underneath.

## Staffing Inputs

Staffing decisions should consider:

- operational round
- total pax
- join count
- package complexity
- special handling requirements
- language needs
- transport timing and handoff constraints
- no-show and reschedule changes

Future agents should not derive staffing from raw guest count alone.

## Recommended Staffing Concepts

Minimum concepts for the staffing domain:

- `round`
- `assigned staff`
- `role in round` if needed later
- `load count`
- `special flags`
- `coverage status`
- `assignment status`

Special flags may include:

- high pax load
- mixed-language guests
- VIP / sensitive guest handling
- special package complexity
- late move from another round

## Primary Staffing UX

The primary staffing screen should be a board, not only a table.

The board should make the following obvious:

- each active round
- who is assigned
- which rounds are under-assigned
- which rounds are overloaded
- where no-show or moved bookings changed workload

Secondary list views and KPI views are useful, but they should not replace the board as the operational control surface.

## Required Behaviors

Future implementation should preserve these behaviors:

- slot totals are first-class
- special cases are first-class
- moved bookings immediately affect staffing calculations
- no-show bookings reduce active workload
- draft assignments and final confirmed assignments are distinguishable
- staffing changes should be auditable

## KPI Guidance

Staff KPI calculations should use:

- completed, valid assignments
- attended rounds
- confirmed operational contributions

They should not rely on:

- temporary draft assignments
- cancelled tasks
- stale assignments left behind by reschedules

## UX/UI Guidance

Staffing UI should optimize for speed and clarity:

- strong round grouping
- visible totals
- visible warnings
- minimal unnecessary modal depth
- low-friction reassignment
- clear distinction between current day execution and historical reporting

Avoid turning the staffing module into a generic staff-directory experience. Personnel management and staffing operations are related but not the same screen.

## Recommended Future Enhancements

As the product matures, staffing can support:

- skill tags
- language tags
- preferred roles
- fatigue/load balancing
- suggested reassignment

These should be layered on top of the core slot-based model, not replace it.

## Implementation Rule

When future agents change staffing behavior, they must verify:

1. does the board still make round coverage obvious?
2. do no-show and moved bookings change the visible load correctly?
3. is the result understandable to an officer in a live operational day?

If the answer is no, the implementation is not operationally correct.
