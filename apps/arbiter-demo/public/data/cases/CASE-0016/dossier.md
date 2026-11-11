# Decision dossier: Brindle Analytics 0016 Ltd

## Header

Vendor: Brindle Analytics 0016 Ltd
Decision: Request information. Required evidence is missing, so the vendor must reply before a decision.
Tier: T2
Residual risk: 50
Confidence 85%. Unverified controls: C05 Current independent assurance (SOC 2 Type II or ISO 27001), C07 Personal-data breach notification within 72 hours, C08 Data Processing Agreement executed.

## Analyst brief

Ask the vendor for more information: Current independent assurance (SOC 2 Type II or ISO 27001) is unverified. What would satisfy it: SOC 2 Type II report summary issued ≤ 12 months before as_of; or ISO 27001 certificate with expires_on ≥ as_of.

- Current independent assurance (SOC 2 Type II or ISO 27001) is unverified. What would satisfy it: SOC 2 Type II report summary issued ≤ 12 months before as_of; or ISO 27001 certificate with expires_on ≥ as_of.
- Personal-data breach notification within 72 hours is unverified. What would satisfy it: CLM contract clause ≤ 72h; or Q09 commitment ≤ 72h while the contract is not yet signed.

Next steps:
- Send the clarification email and wait for the vendor's reply. Owner: tprm_analyst.

## Evidence

No claim disagreed with a system of record.

## Controls

- MFA enforced for privileged and remote access: met. The cited evidence meets the control.
- Credential and secret hygiene: met. The cited evidence meets the control.
- Least privilege with periodic access reviews: met. The cited evidence meets the control.
- Encryption at rest and in transit: met. The cited evidence meets the control.
- Current independent assurance (SOC 2 Type II or ISO 27001): unverified. Would need SOC 2 Type II report summary issued ≤ 12 months before as_of; or ISO 27001 certificate with expires_on ≥ as_of.
- No unremediated material incident in 24 months: met. The cited evidence meets the control.
- Personal-data breach notification within 72 hours: unverified. Would need CLM contract clause ≤ 72h; or Q09 commitment ≤ 72h while the contract is not yet signed.
- Data Processing Agreement executed: met. The cited evidence meets the control.
- Data residency or lawful transfer mechanism: met. The cited evidence meets the control.
- Sub-processor disclosure: met. The cited evidence meets the control.
- Sanctions and watchlist clear: met. The cited evidence meets the control.
- No unmitigated exposure to known-exploited vulnerabilities: met. The cited evidence meets the control.

## What would change this decision

- Current independent assurance (SOC 2 Type II or ISO 27001) (unverified to met). SOC 2 Type II report summary issued ≤ 12 months before as_of; or ISO 27001 certificate with expires_on ≥ as_of Which independent certifications or attestations do you hold?
- Personal-data breach notification within 72 hours (unverified to met). CLM contract clause ≤ 72h; or Q09 commitment ≤ 72h while the contract is not yet signed Within how many hours will you notify us of a personal-data breach?

## Drafts

To: vendor
Subject: Information requested for Brindle Analytics 0016 Ltd (CASE-0016)

Please send the following so we can finish the assessment of Brindle Analytics 0016 Ltd.

Which independent certifications or attestations do you hold?
Evidence that would satisfy this: SOC 2 Type II report summary issued ≤ 12 months before as_of; or ISO 27001 certificate with expires_on ≥ as_of

Within how many hours will you notify us of a personal-data breach?
Evidence that would satisfy this: CLM contract clause ≤ 72h; or Q09 commitment ≤ 72h while the contract is not yet signed

## Approvals

Approvals required: none.
- ctr-ef7ac3b56485: state executed, intent vendor.onboarding.request_info, signature valid.

## Precedents

No precedents were considered.

## Integrity

Policy version: 1.0.0
Policy hash: d87244d91cacbd6a8c7119595311261a1205fc9019b00426b7d9c66fa06f4857
Calibration version: cal-2026-10-26-eb975166
Record hash: 30f536aeb0f75991b3487cc296c2eecedb81ed0f5560db28d6a4def4436cb6f4
Replay command: python run.py replay CASE-0016
Trace id: run-566869b542c5
Models served: none (deterministic brief)
