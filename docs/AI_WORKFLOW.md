# AI Workflow

## Workflow

1. Product Owner defines the desired outcome and success criteria.
2. Technical Lead creates a focused package with clear scope, acceptance criteria and verification expectations.
3. Coding agent inspects the repository before making changes.
4. The agent implements one vertical slice and keeps the work narrowly scoped.
5. The agent builds, tests and lints the affected package.
6. The agent fixes any failures that appear and re-runs verification.
7. The agent submits a completion summary with evidence and any follow-up notes.
8. Human review performs a Keep/Undo checkpoint before the change is accepted.
9. Changes are reviewed and committed once the scope and verification are satisfactory.
10. The next package starts in a new session with fresh context.

## Collaboration rules

- Autopilot may handle routine workspace operations such as file inspection, search and repeated verification commands.
- Human review remains required for destructive operations, secrets, force pushes, database resets and production deployment.
- Parallel agents must use isolated branches or worktrees.
- Two agents must never edit the same files simultaneously.
- A review agent should verify scope, correctness, security and tests before merge.

## Completion expectations

- Keep the implementation aligned with the package definition.
- Prefer small, reviewable changes.
- Do not begin the next package until the current package is verified and documented.

## Related documents

- [../AGENTS.md](../AGENTS.md)
- [../DEVELOPMENT_RULES.md](../DEVELOPMENT_RULES.md)
- [../ROADMAP.md](../ROADMAP.md)
- [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md)
- [PRODUCTION_PACKAGE_TEMPLATE.md](PRODUCTION_PACKAGE_TEMPLATE.md)
