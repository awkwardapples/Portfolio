# Decision dossier: Glimmer Relay 0031 Ltd

## Header

Vendor: Glimmer Relay 0031 Ltd
Decision: Escalate. A person must decide; the policy will not approve this case as it stands.
Tier: T1
Residual risk: 82
Confidence 90%. Unverified controls: C05 Current independent assurance (SOC 2 Type II or ISO 27001).

## Analyst brief

Escalate to the TPRM lead: Glimmer Relay 0031 Ltd runs FortiOS, which has 15 known-exploited vulnerabilities against a 30-day critical-patch SLA (policy limit 14 days).

- Glimmer Relay 0031 Ltd runs FortiOS, which has 15 known-exploited vulnerabilities against a 30-day critical-patch SLA (policy limit 14 days).
- Current independent assurance (SOC 2 Type II or ISO 27001) is unverified. What would satisfy it: SOC 2 Type II report summary issued ≤ 12 months before as_of; or ISO 27001 certificate with expires_on ≥ as_of.

Next steps:
- Open the service-desk ticket for the TPRM lead. Owner: tprm_lead.

## Evidence

No claim disagreed with a system of record.

## Controls

- MFA enforced for privileged and remote access: met. The cited evidence meets the control.
- Credential and secret hygiene: met. The cited evidence meets the control.
- Least privilege with periodic access reviews: met. The cited evidence meets the control.
- Encryption at rest and in transit: met. The cited evidence meets the control.
- Current independent assurance (SOC 2 Type II or ISO 27001): unverified. Would need SOC 2 Type II report summary issued ≤ 12 months before as_of; or ISO 27001 certificate with expires_on ≥ as_of.
- No unremediated material incident in 24 months: met. The cited evidence meets the control.
- Personal-data breach notification within 72 hours: met. The cited evidence meets the control.
- Data Processing Agreement executed: met. The cited evidence meets the control.
- Data residency or lawful transfer mechanism: met. The cited evidence meets the control.
- Sub-processor disclosure: met. The cited evidence meets the control.
- Sanctions and watchlist clear: met. The cited evidence meets the control.
- No unmitigated exposure to known-exploited vulnerabilities: not met. Would need Declared components checked against CISA KEV; or critical patch SLA ≤ 14 days with attestation.

## What would change this decision

- Current independent assurance (SOC 2 Type II or ISO 27001) (unverified to met). SOC 2 Type II report summary issued ≤ 12 months before as_of; or ISO 27001 certificate with expires_on ≥ as_of Which independent certifications or attestations do you hold?
- No unmitigated exposure to known-exploited vulnerabilities (not met to met). Declared components checked against CISA KEV; or critical patch SLA ≤ 14 days with attestation What is your patch SLA for critical vulnerabilities? How often do you run independent penetration tests?

## Drafts

To: tprm_lead
Subject: Escalation ticket: Glimmer Relay 0031 Ltd

Summary: Glimmer Relay 0031 Ltd needs a decision from the TPRM lead.

Evidence:
- Current independent assurance (SOC 2 Type II or ISO 27001) is unverified
- No unmitigated exposure to known-exploited vulnerabilities is not met

Risk: residual risk 82 out of 100, tier T1.

Requested decision: continue, ask Glimmer Relay 0031 Ltd for evidence, or decline.

## Approvals

Approvals required: none.
- ctr-5653f12a5e87: state executed, intent vendor.onboarding.escalate, signature valid.

## Precedents

No precedents were considered.

## Integrity

Policy version: 1.0.0
Policy hash: d87244d91cacbd6a8c7119595311261a1205fc9019b00426b7d9c66fa06f4857
Calibration version: cal-2026-10-26-eb975166
Record hash: 96afba54c0a05003d8197e0a7e20ccdc5686a0b6e04da47d33bfc50a490df5bc
Replay command: python run.py replay CASE-0031
Trace id: run-176b4fbebc9e
Models served: none (deterministic brief)
