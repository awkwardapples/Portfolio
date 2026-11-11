# Decision dossier: Kestrel Docs Ltd

## Header

Vendor: Kestrel Docs Ltd
Decision: Request information. Required evidence is missing, so the vendor must reply before a decision.
Tier: T2
Residual risk: 53
Confidence 88%. Unverified controls: C05 Current independent assurance (SOC 2 Type II or ISO 27001), C08 Data Processing Agreement executed.

## Analyst brief

Ask the vendor for more information: Current independent assurance (SOC 2 Type II or ISO 27001) is unverified. What would satisfy it: SOC 2 Type II report summary issued ≤ 12 months before as_of; or ISO 27001 certificate with expires_on ≥ as_of.

- Current independent assurance (SOC 2 Type II or ISO 27001) is unverified. What would satisfy it: SOC 2 Type II report summary issued ≤ 12 months before as_of; or ISO 27001 certificate with expires_on ≥ as_of.
- Data Processing Agreement executed is unverified. What would satisfy it: CLM shows DPA signed with a signature date.
- Data quality flagged a contract record (CTR-30028).

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
- Personal-data breach notification within 72 hours: met. The cited evidence meets the control.
- Data Processing Agreement executed: unverified. Would need CLM shows DPA signed with a signature date.
- Data residency or lawful transfer mechanism: met. The cited evidence meets the control.
- Sub-processor disclosure: met. The cited evidence meets the control.
- Sanctions and watchlist clear: met. The cited evidence meets the control.
- No unmitigated exposure to known-exploited vulnerabilities: met. The cited evidence meets the control.

## What would change this decision

- Current independent assurance (SOC 2 Type II or ISO 27001) (unverified to met). SOC 2 Type II report summary issued ≤ 12 months before as_of; or ISO 27001 certificate with expires_on ≥ as_of Which independent certifications or attestations do you hold?
- Data Processing Agreement executed (unverified to met). CLM shows DPA signed with a signature date Will you sign our Data Processing Agreement?

## Drafts

To: vendor
Subject: Information requested for Kestrel Docs Ltd (CASE-0028)

Please send the following so we can finish the assessment of Kestrel Docs Ltd.

Which independent certifications or attestations do you hold?
Evidence that would satisfy this: SOC 2 Type II report summary issued ≤ 12 months before as_of; or ISO 27001 certificate with expires_on ≥ as_of

Will you sign our Data Processing Agreement?
Evidence that would satisfy this: CLM shows DPA signed with a signature date

## Approvals

Approvals required: none.
- ctr-c51b0ce7981e: state executed, intent vendor.onboarding.request_info, signature valid.

## Precedents

No precedents were considered.

## Integrity

Policy version: 1.0.0
Policy hash: d87244d91cacbd6a8c7119595311261a1205fc9019b00426b7d9c66fa06f4857
Calibration version: cal-2026-10-26-eb975166
Record hash: 591b4555a84c9423b54db09d5d906a5c8b6419115aed90adc8ff8dbb58acb019
Replay command: python run.py replay CASE-0028
Trace id: run-a9d145e2beed
Models served: none (deterministic brief)
