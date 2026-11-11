# Decision dossier: Kettle Relay 0024 Ltd

## Header

Vendor: Kettle Relay 0024 Ltd
Decision: Escalate. A person must decide; the policy will not approve this case as it stands.
Tier: T3
Residual risk: 37
Confidence 85%.

## Analyst brief

Escalate to the TPRM lead: Kettle Relay 0024 Ltd says 0.0, but Service desk (ITSM) record INC900002 shows 1.0.

- Kettle Relay 0024 Ltd says 0.0, but Service desk (ITSM) record INC900002 shows 1.0.

Next steps:
- Open the service-desk ticket for the TPRM lead. Owner: tprm_lead.

## Evidence

| Source | Record | Field | Value | Quote | Request |
| --- | --- | --- | --- | --- | --- |
| Service desk (ITSM) | INC900002 | category | 1.0 |  |  |
| Vendor trust portal | vendor claim | incidents.vendor_reported_24m | 0.0 |  |  |

## Controls

- MFA enforced for privileged and remote access: met. The cited evidence meets the control.
- Encryption at rest and in transit: met. The cited evidence meets the control.
- No unremediated material incident in 24 months: not met. Would need ITSM incident history (system of record) with RCA for material incidents; resolve contradiction on incidents.vendor_reported_24m.
- Sanctions and watchlist clear: met. The cited evidence meets the control.
- No unmitigated exposure to known-exploited vulnerabilities: met. The cited evidence meets the control.

## What would change this decision

- No unremediated material incident in 24 months (not met to met). ITSM incident history (system of record) with RCA for material incidents; resolve contradiction on incidents.vendor_reported_24m Have you had any security incidents affecting customer data in the last 24 months?

## Drafts

To: tprm_lead
Subject: Escalation ticket: Kettle Relay 0024 Ltd

Summary: Kettle Relay 0024 Ltd needs a decision from the TPRM lead.

Evidence:
- No unremediated material incident in 24 months is not met
- Claim 0.0 does not match the record 1.0

Risk: residual risk 37 out of 100, tier T3.

Requested decision: continue, ask Kettle Relay 0024 Ltd for evidence, or decline.

## Approvals

Approvals required: none.
- ctr-a9c2ca146832: state executed, intent vendor.onboarding.escalate, signature valid.

## Precedents

No precedents were considered.

## Integrity

Policy version: 1.0.0
Policy hash: d87244d91cacbd6a8c7119595311261a1205fc9019b00426b7d9c66fa06f4857
Calibration version: cal-2026-10-26-eb975166
Record hash: aebcd2047c68a3dddf4d7c1b0bd4a236c10ecc44877834a0be97e1aeb0d4034d
Replay command: python run.py replay CASE-0024
Trace id: run-39e094e78d34
Models served: none (deterministic brief)
