# Decision dossier: Halberd Identity Ltd

## Header

Vendor: Halberd Identity Ltd
Decision: Escalate. A person must decide; the policy will not approve this case as it stands.
Tier: T3
Residual risk: 37
Confidence 85%.

## Analyst brief

Escalate to the TPRM lead: Halberd Identity Ltd says 0.0, but Service desk (ITSM) record INC900003 shows 1.0.

- Halberd Identity Ltd says 0.0, but Service desk (ITSM) record INC900003 shows 1.0.

Next steps:
- Open the service-desk ticket for the TPRM lead. Owner: tprm_lead.

## Evidence

| Source | Record | Field | Value | Quote | Request |
| --- | --- | --- | --- | --- | --- |
| Service desk (ITSM) | INC900003 | category | 1.0 |  |  |
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
Subject: Escalation ticket: Halberd Identity Ltd

Summary: Halberd Identity Ltd needs a decision from the TPRM lead.

Evidence:
- No unremediated material incident in 24 months is not met
- Claim 0.0 does not match the record 1.0

Risk: residual risk 37 out of 100, tier T3.

Requested decision: continue, ask Halberd Identity Ltd for evidence, or decline.

## Approvals

Approvals required: none.
- ctr-5e77c5196ec6: state executed, intent vendor.onboarding.escalate, signature valid.

## Precedents

No precedents were considered.

## Integrity

Policy version: 1.0.0
Policy hash: d87244d91cacbd6a8c7119595311261a1205fc9019b00426b7d9c66fa06f4857
Calibration version: cal-2026-10-26-eb975166
Record hash: 2d97922195b12b4d1592da45c260a72af2e74397579feaeb3f2ccd41d608e05f
Replay command: python run.py replay CASE-0026
Trace id: run-f8f9eab3f92c
Models served: none (deterministic brief)
