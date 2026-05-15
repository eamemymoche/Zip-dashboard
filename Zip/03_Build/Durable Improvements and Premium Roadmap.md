# Durable Improvements and Premium Roadmap

Status: Active  
Last updated: 2026-05-14

## Intent

This note separates durable next-step improvements from optional premium features. The goal is to keep the core system sustainable before adding higher-cost or higher-complexity ideas.

## Durable Improvements

These improvements should strengthen real operations without overcomplicating the stack.

### Structured Intake

- normalize common source templates
- support better source-channel tagging
- preserve raw-source references for troubleshooting

### Booking Quality

- stronger normalized booking model
- clearer distinction between booking time, pickup window, and dispatch round
- better handling of guest requests and pickup instructions

### Dispatch Quality

- system-generated round boards that match real whiteboard usage
- clearer driver + vehicle assignment flow
- better handling of moved rounds, no-show, and reassignment

### Staffing Quality

- stronger staffing board
- visible coverage warnings
- slot load visibility
- better KPI integrity

### Closure Quality

- structured reconciliation workflow
- better remark discipline
- photo / reference attachment tracking
- clearer operational end-of-day reporting

### Reporting Quality

- per-round reporting
- per-source reporting
- per-package reporting
- per-driver and per-vehicle reporting
- per-staff reporting

## Premium Features

These are useful, but should come after the core system is stable.

### Automated Mailbox Intake

- mailbox parsing
- auto-draft order creation
- source-specific extraction rules

### Smarter Dispatch Assistance

- pickup / slot recommendation
- route grouping assistance
- vehicle-capacity suggestion

### Staffing Recommendation

- suggested staff allocation
- language-aware pairing
- overload warning and rebalance suggestions

### Advanced Analytics

- richer trend dashboards
- source performance tracking
- no-show pattern analysis
- staffing efficiency trends

### Communication Integrations

- WhatsApp / LINE operational messaging
- guest confirmation workflows
- internal dispatch notifications

### Risk / Anomaly Detection

- suspicious booking pattern detection
- deadline breach alerts
- no-show risk heuristics
- operational bottleneck alerts

## Implementation Rule

Future agents should prioritize:

1. durable operational correctness
2. persistence and recovery
3. safe multi-user behavior
4. premium automation

If a premium feature makes the core workflow less reliable, the priority is wrong.
