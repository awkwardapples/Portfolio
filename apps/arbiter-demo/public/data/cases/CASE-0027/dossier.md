# Decision dossier: Ember Payroll 0027 Ltd

## Header

Vendor: Ember Payroll 0027 Ltd
Decision: Escalate. A person must decide; the policy will not approve this case as it stands.
Tier: T3
Residual risk: 33
Confidence 100%.

## Analyst brief

Escalate to the TPRM lead: MFA enforced for privileged and remote access is not met. What would satisfy it: Q01 and Q02 affirmative, naming the mechanism; or assurance report noting the MFA control without exception.

- MFA enforced for privileged and remote access is not met. What would satisfy it: Q01 and Q02 affirmative, naming the mechanism; or assurance report noting the MFA control without exception.

Next steps:
- Open the service-desk ticket for the TPRM lead. Owner: tprm_lead.

## Evidence

No claim disagreed with a system of record.

## Controls

- MFA enforced for privileged and remote access: not met. Would need Q01 and Q02 affirmative, naming the mechanism; or assurance report noting the MFA control without exception.
- Encryption at rest and in transit: met. The cited evidence meets the control.
- No unremediated material incident in 24 months: met. The cited evidence meets the control.
- Sanctions and watchlist clear: met. The cited evidence meets the control.
- No unmitigated exposure to known-exploited vulnerabilities: met. The cited evidence meets the control.

## What would change this decision

- MFA enforced for privileged and remote access (not met to met). Q01 and Q02 affirmative, naming the mechanism; or assurance report noting the MFA control without exception Is MFA enforced for all administrative and privileged accounts? Is MFA enforced for all remote and employee access to systems processing our data?

## Drafts

To: tprm_lead
Subject: Escalation ticket: Ember Payroll 0027 Ltd

Summary: Ember Payroll 0027 Ltd needs a decision from the TPRM lead.

Evidence:
- MFA enforced for privileged and remote access is not met

Risk: residual risk 33 out of 100, tier T3.

Requested decision: continue, ask Ember Payroll 0027 Ltd for evidence, or decline.

## Approvals

Approvals required: none.
- ctr-3b280af2f791: state executed, intent vendor.onboarding.escalate, signature valid.

## Precedents

No precedents were considered.

## Integrity

Policy version: 1.0.0
Policy hash: d87244d91cacbd6a8c7119595311261a1205fc9019b00426b7d9c66fa06f4857
Calibration version: cal-2026-10-26-eb975166
Record hash: 11d2bf67e6706da4c0593ccd289f21776374c1d47736cdd27407205271289108
Replay command: python run.py replay CASE-0027
Trace id: run-e5528dbd6994
Models served: none (deterministic brief)
