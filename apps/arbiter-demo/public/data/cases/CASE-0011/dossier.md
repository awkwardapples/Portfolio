# Decision dossier: Marrowgate Analytics Ltd

## Header

Vendor: Marrowgate Analytics Ltd
Decision: Escalate. A person must decide; the policy will not approve this case as it stands.
Tier: T2
Residual risk: 53
Confidence 92%.

## Analyst brief

Escalate to the TPRM lead: Current independent assurance (SOC 2 Type II or ISO 27001) is not met. What would satisfy it: SOC 2 Type II report summary issued ≤ 12 months before as_of; or ISO 27001 certificate with expires_on ≥ as_of.

- Current independent assurance (SOC 2 Type II or ISO 27001) is not met. What would satisfy it: SOC 2 Type II report summary issued ≤ 12 months before as_of; or ISO 27001 certificate with expires_on ≥ as_of.

Next steps:
- Open the service-desk ticket for the TPRM lead. Owner: tprm_lead.

## Evidence

No claim disagreed with a system of record.

## Controls

- MFA enforced for privileged and remote access: met. The cited evidence meets the control.
- Credential and secret hygiene: met. The cited evidence meets the control.
- Least privilege with periodic access reviews: met. The cited evidence meets the control.
- Encryption at rest and in transit: met. The cited evidence meets the control.
- Current independent assurance (SOC 2 Type II or ISO 27001): not met. Would need SOC 2 Type II report summary issued ≤ 12 months before as_of; or ISO 27001 certificate with expires_on ≥ as_of.
- No unremediated material incident in 24 months: met. The cited evidence meets the control.
- Personal-data breach notification within 72 hours: met. The cited evidence meets the control.
- Data Processing Agreement executed: met. The cited evidence meets the control.
- Data residency or lawful transfer mechanism: met. The cited evidence meets the control.
- Sub-processor disclosure: met. The cited evidence meets the control.
- Sanctions and watchlist clear: met. The cited evidence meets the control.
- No unmitigated exposure to known-exploited vulnerabilities: met. The cited evidence meets the control.

## What would change this decision

- Current independent assurance (SOC 2 Type II or ISO 27001) (not met to met). SOC 2 Type II report summary issued ≤ 12 months before as_of; or ISO 27001 certificate with expires_on ≥ as_of Which independent certifications or attestations do you hold?

## Drafts

To: tprm_lead
Subject: Escalation ticket: Marrowgate Analytics Ltd

Summary: Marrowgate Analytics Ltd needs a decision from the TPRM lead.

Evidence:
- Current independent assurance (SOC 2 Type II or ISO 27001) is not met

Risk: residual risk 53 out of 100, tier T2.

Requested decision: continue, ask Marrowgate Analytics Ltd for evidence, or decline.

## Approvals

Approvals required: none.
- ctr-2323ac9e4db7: state executed, intent vendor.onboarding.escalate, signature valid.

## Precedents

No precedents were considered.

## Integrity

Policy version: 1.0.0
Policy hash: d87244d91cacbd6a8c7119595311261a1205fc9019b00426b7d9c66fa06f4857
Calibration version: cal-2026-10-26-eb975166
Record hash: d00fc797d4d106d54d5406d5d8a7aa9e2dbabb32c2f89a58811172330e8313f3
Replay command: python run.py replay CASE-0011
Trace id: run-cf8788a12685
Models served: none (deterministic brief)
