# Project Brief

## One-Line Goal

Build a production-grade Zipline Command Center for managing bookings, pickup transport, field staffing, job sheets, personnel, packages, KPIs, and operational reports.

## Problem

The existing prototype is a single HTML/JavaScript page with mock data generated in the browser. It has useful screens and workflows, but it does not persist data, connect to APIs, enforce user roles, or support real operations at scale.

## Target Users

- Operations admins who create and manage bookings.
- Transport coordinators who assign drivers and monitor pickup status.
- Drivers who need clear printable job sheets.
- Field staff/guides who need assignment boards.
- Managers who track workload, KPIs, agents, packages, and reports.

## Primary Workflow

1. Admin creates or imports a booking.
2. Transport team assigns a driver by date and pickup round.
3. Driver pickup status is rechecked as Waiting, Boarded, or No Show.
4. No Show customers can be moved to later rounds.
5. Field staff are assigned to active guests.
6. Managers review master logs, pivot analysis, KPI views, and exports.

## Success Criteria

- [ ] Bookings persist in a real database.
- [ ] Transport assignments persist and can be filtered by date, round, and driver.
- [ ] Pickup status updates are saved and auditable.
- [ ] Job sheets are printable in A4 format.
- [ ] Personnel and package master data can be maintained.
- [ ] Project can be built locally from documented commands.
- [ ] First milestone is small enough to implement and test.

## Non-Goals

- Do not treat the current mock data as production data.
- Do not ship browser-only state as the final system.
- Do not build advanced realtime infrastructure until the basic persisted workflow is stable.
