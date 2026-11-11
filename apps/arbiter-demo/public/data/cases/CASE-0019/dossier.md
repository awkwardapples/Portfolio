# Decision dossier: Corvid Ledger Services Ltd

## Header

Vendor: Corvid Ledger Services Ltd
Decision: Decline. A hard gate failed. Do not onboard this vendor.
Tier: T3
Residual risk: 33
Confidence 100%.

## Analyst brief

Decline, and tell the business owner: Sanctions and watchlist clear is not met. What would satisfy it: GRC watchlist screening across all vendor aliases.

- Sanctions and watchlist clear is not met. What would satisfy it: GRC watchlist screening across all vendor aliases.

Next steps:
- Tell the business owner the vendor is declined. Owner: business_owner.

## Evidence

No claim disagreed with a system of record.

## Controls

- MFA enforced for privileged and remote access: met. The cited evidence meets the control.
- Encryption at rest and in transit: met. The cited evidence meets the control.
- No unremediated material incident in 24 months: met. The cited evidence meets the control.
- Sanctions and watchlist clear: not met. Would need GRC watchlist screening across all vendor aliases.
- No unmitigated exposure to known-exploited vulnerabilities: met. The cited evidence meets the control.

## What would change this decision

- Sanctions and watchlist clear (not met to met). GRC watchlist screening across all vendor aliases

## Drafts

To: business_owner
Subject: Decline memo: Corvid Ledger Services Ltd

Dear procurement.owner@example.com,

This memo is for the business owner of Corvid Ledger Services Ltd.
Do not onboard Corvid Ledger Services Ltd. The assessment declined the vendor because Sanctions and watchlist clear is not met.
No approval contract should be signed.

## Approvals

Approvals required: tprm_lead.
- ctr-ed96d73cc2cb: state pending_approval, intent vendor.onboarding.decline, signature valid.

## Precedents

No precedents were considered.

## Integrity

Policy version: 1.0.0
Policy hash: d87244d91cacbd6a8c7119595311261a1205fc9019b00426b7d9c66fa06f4857
Calibration version: cal-2026-10-26-eb975166
Record hash: b5fbaa069665b459d9cf96aa2317f10fe1621911e6b0d06a7468e365eb1b1280
Replay command: python run.py replay CASE-0019
Trace id: run-a6dde1fd2564
Models served: none (deterministic brief)
