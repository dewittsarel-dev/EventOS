# EventOS launch rehearsal checklist

EventOS is not launch-ready until every blocking gate below has dated evidence. Package tests are necessary but do not replace an environment rehearsal.

## Performance

- Run the complete catalogue and event lifecycle at the intended 50-business launch profile.
- Repeat above the 150-business simulator baseline with recorded response-time percentiles and error rates.
- Confirm ClientOS navigation, Marketplace search and image loading remain usable on mobile and constrained networks.

## Security and privacy

- Confirm Marketplace responses never contain ClientOS cost prices, internal notes, reservations, organization-private documents or cross-organization records.
- Exercise every role boundary with both permitted and denied requests.
- Complete dependency, secret, authorization and independent penetration reviews before accepting real customer data.

## Accessibility

- Complete keyboard-only journeys for customer discovery/enquiry and operator event/procurement/finance work.
- Run automated WCAG checks and verify focus order, labels, contrast, error announcements and responsive zoom.
- Complete an independent WCAG 2.2 AA review before public launch.

## Backup and restore

- Take a managed PostgreSQL backup and restore it into a new isolated rehearsal database.
- Run migrations against the restored copy, execute deterministic scenario reconciliation and record row/evidence totals.
- Never test restoration by overwriting the live production database.

## Zero-disruption upgrade

- Use backward-compatible migrations and deploy additive database changes before code that depends on them.
- Verify the health endpoint and critical read/write journeys before shifting traffic.
- Confirm accepted enquiries and operational work survive the deployment.
- Rehearse application rollback separately from database rollback and record the recovery time.

## Release record

Store the date, environment, commit, operator, evidence links, measured results and exceptions for `PERF-001`, `SEC-001`, `A11Y-001`, `REC-001` and `UPG-001`. Any missing gate blocks launch.
