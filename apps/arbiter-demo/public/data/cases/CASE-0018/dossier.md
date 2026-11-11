# Decision dossier: Harbor Survey 0018 Ltd

## Header

Vendor: Harbor Survey 0018 Ltd
Decision: Request information. Required evidence is missing, so the vendor must reply before a decision.
Tier: T3
Residual risk: 30
Confidence 88%. Unverified controls: C01 MFA enforced for privileged and remote access, C04 Encryption at rest and in transit.

## Analyst brief

Ask the vendor for more information: MFA enforced for privileged and remote access is unverified. What would satisfy it: Q01 and Q02 affirmative, naming the mechanism; or assurance report noting the MFA control without exception.

- MFA enforced for privileged and remote access is unverified. What would satisfy it: Q01 and Q02 affirmative, naming the mechanism; or assurance report noting the MFA control without exception.
- Encryption at rest and in transit is unverified. What would satisfy it: Q05 naming the standard (e.g. AES-256); Q06 confirming TLS 1.2+.

Next steps:
- Send the clarification email and wait for the vendor's reply. Owner: tprm_analyst.

## Evidence

No claim disagreed with a system of record.

## Controls

- MFA enforced for privileged and remote access: unverified. Would need Q01 and Q02 affirmative, naming the mechanism; or assurance report noting the MFA control without exception.
- Encryption at rest and in transit: unverified. Would need Q05 naming the standard (e.g. AES-256); Q06 confirming TLS 1.2+.
- No unremediated material incident in 24 months: met. The cited evidence meets the control.
- Sanctions and watchlist clear: met. The cited evidence meets the control.
- No unmitigated exposure to known-exploited vulnerabilities: met. The cited evidence meets the control.

## What would change this decision

- MFA enforced for privileged and remote access (unverified to met). Q01 and Q02 affirmative, naming the mechanism; or assurance report noting the MFA control without exception Is MFA enforced for all administrative and privileged accounts? Is MFA enforced for all remote and employee access to systems processing our data?
- Encryption at rest and in transit (unverified to met). Q05 naming the standard (e.g. AES-256); Q06 confirming TLS 1.2+ Is customer data encrypted at rest? Which standard? Is data encrypted in transit (TLS 1.2+)?

## Drafts

To: vendor
Subject: Information requested for Harbor Survey 0018 Ltd (CASE-0018)

Please send the following so we can finish the assessment of Harbor Survey 0018 Ltd.

Is MFA enforced for all administrative and privileged accounts?
Evidence that would satisfy this: Q01 and Q02 affirmative, naming the mechanism; or assurance report noting the MFA control without exception

Is MFA enforced for all remote and employee access to systems processing our data?
Evidence that would satisfy this: Q01 and Q02 affirmative, naming the mechanism; or assurance report noting the MFA control without exception

Is customer data encrypted at rest? Which standard?
Evidence that would satisfy this: Q05 naming the standard (e.g. AES-256); Q06 confirming TLS 1.2+

Is data encrypted in transit (TLS 1.2+)?
Evidence that would satisfy this: Q05 naming the standard (e.g. AES-256); Q06 confirming TLS 1.2+

## Approvals

Approvals required: none.
- ctr-774bbd2215da: state executed, intent vendor.onboarding.request_info, signature valid.

## Precedents

No precedents were considered.

## Integrity

Policy version: 1.0.0
Policy hash: d87244d91cacbd6a8c7119595311261a1205fc9019b00426b7d9c66fa06f4857
Calibration version: cal-2026-10-26-eb975166
Record hash: 2d4135ba6d7d5cfe1428fd8feab22a9cb001e5f4f4feb092e5ecf1857ae145b4
Replay command: python run.py replay CASE-0018
Trace id: run-b9a1e2872b52
Models served: none (deterministic brief)
