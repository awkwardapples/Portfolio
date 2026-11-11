# Decision dossier: Brindle Survey 0023 Ltd

## Header

Vendor: Brindle Survey 0023 Ltd
Decision: Escalate. A person must decide; the policy will not approve this case as it stands.
Tier: T3
Residual risk: 25
Confidence 85%.

## Analyst brief

Escalate to the TPRM lead: Brindle Survey 0023 Ltd says EU, but its contract (CTR-30023) shows US.

- Brindle Survey 0023 Ltd says EU, but its contract (CTR-30023) shows US.

Next steps:
- Open the service-desk ticket for the TPRM lead. Owner: tprm_lead.

## Evidence

| Source | Record | Field | Value | Quote | Request |
| --- | --- | --- | --- | --- | --- |
| Contract system (CLM) | CTR-30023 | hosting_region_clause | US |  |  |
| Vendor trust portal | vendor claim | residency.regions | EU |  |  |

## Controls

- MFA enforced for privileged and remote access: met. The cited evidence meets the control.
- Encryption at rest and in transit: met. The cited evidence meets the control.
- No unremediated material incident in 24 months: met. The cited evidence meets the control.
- Sanctions and watchlist clear: met. The cited evidence meets the control.
- No unmitigated exposure to known-exploited vulnerabilities: met. The cited evidence meets the control.

## What would change this decision

- Data residency or lawful transfer mechanism (not met to met). CLM hosting clause UK/EU; or a documented transfer mechanism (SCCs/IDTA); resolve contradiction on residency.regions Where will our data be hosted and processed? What mechanism governs international transfers?

## Drafts

To: tprm_lead
Subject: Escalation ticket: Brindle Survey 0023 Ltd

Summary: Brindle Survey 0023 Ltd needs a decision from the TPRM lead.

Evidence:
- Claim EU does not match the record US

Risk: residual risk 25 out of 100, tier T3.

Requested decision: continue, ask Brindle Survey 0023 Ltd for evidence, or decline.

## Approvals

Approvals required: none.
- ctr-f1ab42789cd9: state executed, intent vendor.onboarding.escalate, signature valid.

## Precedents

No precedents were considered.

## Integrity

Policy version: 1.0.0
Policy hash: d87244d91cacbd6a8c7119595311261a1205fc9019b00426b7d9c66fa06f4857
Calibration version: cal-2026-10-26-eb975166
Record hash: 2e56e7a57b08514907a608a47f12f5f825a0f7f17e60e7a56f6578ff83fa24ca
Replay command: python run.py replay CASE-0023
Trace id: run-ff3e3efd1dcc
Models served: none (deterministic brief)
