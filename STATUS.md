# Stewardship status

Evidence snapshot: 2026-09-13, surveyed `main`
`477d62305943049f638be8fd46d74bd89f4d582f`.
This is the starting record; later receipts must name their tested commit.

## Purpose and release boundary

Evolved ETCETER4 exhibition connecting albums, visual work, words, manuscripts,
and interactive editions. Preserve the original website as a distinct historical
restoration in its original repository. A released edition can be complete while
the underlying work continues to change. Artist-authored text and source lineage
remain explicit; unavailable recordings, scans, transcriptions and approval are
not implied by placeholders or code.

## Verified baseline and open proof

| Surface                        | Starting evidence                                                                     | Meaning                                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Lint/format                    | Pass; lint has 66 warnings                                                            | Existing configured source paths pass; broader runtime proof still required                                             |
| Unit suite                     | 1,222 tests in 40 files pass                                                          | Local baseline only; does not establish complete browser behavior                                                       |
| Targeted homepage HTML         | 0 errors, 5 warnings                                                                  | Targeted validation, not every page                                                                                     |
| Full dependency audit          | 10 vulnerabilities: 7 high, 3 moderate                                                | Foundation repair remains required; production-only audit is insufficient evidence for dev tooling                      |
| Remote application CI          | Workflow 184284863 is manually disabled; exact-head application-suite proof is absent | Enable the existing CI/CD Pipeline through authenticated workflow maintenance; do not rename it to evade disabled state |
| Remote Pages build/deploy      | Recorded success for surveyed source head                                             | Requires separate served-content/playback verification                                                                  |
| Stewardship protocol candidate | 10 Node tests pass locally                                                            | Merge-only automation no longer closes issues in the candidate; adoption and remote run are separate                    |
| Protection                     | Main reports protected; detailed settings unavailable to the integration              | Required-check enforcement cannot be claimed from workflow files alone                                                  |

## Current queue

1. **Wave 0, dependency/runtime family:** repair compatible dependency/CI failures,
   prove exact-head installs, application tests, real browser paths and audit.
2. **Wave 0, stewardship:** install the constitution/instructions and tested
   pending-verification automation; provision only adopted recurring lanes;
   observe the remote protocol check and inspect required-check enforcement.
3. **Wave 1, exhibition revival:** recover `etceter4-revival`, visual-home PR #100,
   and unique preservation residue on one coherent successor.
4. **Wave 1, coverage:** reconcile meaningful unique cases from PRs #102/#103/#104
   and their review findings into one tested suite.
5. **Wave 2 onward:** verified album/source catalogue; per-album audiovisual
   editions; handwritten and original-text experiences; shareable work/edition
   routes; actual source ingestion and later remaster/remix/recording editions.

Activation issue #94 remains the coordination lineage. Dependency/runtime successor #133 and governance successor #134 track separate intentions. Preserve dependency,
coverage, gallery, and capture members until successor work is verified on default
and each member receives its own evidence-backed disposition.

## Operational truth

The governance change does not claim dependencies healed, album media recovered,
manuscripts transcribed, the website restored, the new edition published, remote
checks passing, required-check settings changed, or artistic approval obtained.
`lane/verify-heal` and `lane/editions` remain proposed until remote creation is
recorded. No automatic issue closure, age-based cleanup, or history deletion is
authorized by this status file.

## Governance publication and executable blockers

The complete inventory, family verdicts, queue and edition boundaries are in
[the dated report](docs/stewardship/INVENTORY-VERDICTS-WAVES-2026-09-13.md) and
[the edition plan](docs/stewardship/EDITION-EXECUTION-PLAN-2026-09-13.md).

Project Board Automation ID229586162 is also manually disabled. Its repaired
source preserves the existing workflow identity; it cannot run metadata/closure
policy until normal authenticated maintenance enables it. The current connector
has no callable workflow-enable endpoint, and the inspected browser session is
signed out. This is an executable capability blocker with user authorization
already present, documented in [the capability receipt](docs/stewardship/CI-ENABLEMENT-CAPABILITY-2026-09-13.md).

This branch publishes a reviewable governance implementation for #134 and passes
10 local protocol tests. Exact-head remote checks, merge, enabled metadata execution,
required-check enforcement, proposed lane provisioning and the independent
application/dependency finish line remain pending. No tracked intention is closed.

### Partial branch-protection evidence refreshed before publication

The normal branch metadata endpoint now exposes `protected=true` and a partial
required-status summary: enforcement level `non_admins`, context
`validate-dependencies`, and `app_id: null`. The dedicated protection endpoint
still returns 403; reviewer counts, strictness and the complete policy remain
unverified. This partial record does not establish application or stewardship
checks as protected requirements, and no setting was changed.
