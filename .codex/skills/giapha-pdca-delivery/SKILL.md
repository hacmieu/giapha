---
name: giapha-pdca-delivery
description: Use this skill when implementing or reviewing the giapha_django roadmap. Enforces PDCA (Plan-Do-Check-Act), creates handover-ready reports, and keeps execution consistent for Phase 1-2 (data foundation, security, import pipeline).
---

# Giapha PDCA Delivery

Use this skill for all implementation work on `giapha_django` where consistency, fast handover, and auditable progress are required.

## Scope

- In scope: Phase 1 and Phase 2.
- Out of scope for now: Phase 3 (collaboration UX/features).

## Mandatory workflow (PDCA)

For every task, execute in this exact order:

1. Plan
- State objective, scope, assumptions, and risks.
- Define affected files, migrations, APIs, and rollback strategy.
- Create or update a report file under `reports/pdca/`.

2. Do
- Implement in small, reviewable commits/chunks.
- Keep schema changes backward-compatible where possible.
- Add/update tests for changed behavior.

3. Check
- Run relevant tests and sanity checks.
- Validate data isolation by `family`.
- Validate import behavior with valid + invalid sample payloads.
- Record evidence (commands run, outcomes, residual risks) in report.

4. Act
- Document follow-up actions and technical debt.
- Propose next iteration tasks.
- Update memory file for reusable lessons.

## Required outputs per task

- `reports/pdca/<date>-<task-slug>.md` updated with PDCA sections.
- Explicit list of changed files and migration impacts.
- Verification summary: passed, failed, not-run.
- Handover note with next actions.

## Working rules

- Never merge code without a PDCA report update.
- Never add schema changes without migration + rollback notes.
- Never close a task without explicit "Act" items.
- Prioritize tenant isolation and safety over feature speed.

## References

- PDCA checklist and report structure: `references/pdca-checklists.md`
- Team memory process: `/home/ubuntu/vhosts/giapha_django/.codex/memory/giapha-pdca-memory.md`
