# TestSprite setup and first run — October 22, 2026

## Current status — October 22, about 10:10 PM Pacific

Production runs tested PR #202 application code from `e6339b1`. TEM-005 passed in the resulting full PR run; the full result remains **63 passed / 23 failed / 21 blocked**. The focused corrected-plan run finished **12 passed / 3 failed / 0 blocked**. All eight synthetic fixtures are now uploaded and Ready. The next full run was rejected with **Insufficient credits**; no upgrade/purchase was made. Independent live Chrome checks did not reproduce the three focused clearing-input failures. Details and next actions: [remaining cases](REMAINING_CASES.md).

The saved develop branch rule now requires **Build and test** and **TestSprite V3**. PR #202 is unmerged. The historical checkpoints below explain the earlier setup and must not be read as current pending work.

## Deployment and integration

- Fix PR: https://github.com/Xuefeng-Zhu/PromptDock/pull/201 — merged into `develop`, commit `82bcafe24790ba20b26afee5348cf2335338b4b3`.
- Production: https://promptdock-95e31.web.app. Authorized manual dispatch from `develop` succeeded: https://github.com/Xuefeng-Zhu/PromptDock/actions/runs/39863759026. `main` was not moved. Lint, Vitest and build passed in that deployment; the same commit also passed full browser/native CI.
- Live regression verification: inspector values `constructor=Ada`, `__proto__=literal $& 中文 😀` rendered and copied exactly `Use Ada and literal $& 中文 😀.` without crashing.
- Portal project: https://www.testsprite.com/dashboard-v3/o/xuefeng-zhus-workspace-6167b83c/projects/43ae1231-cf5e-4d9a-81ee-e93fdf6dcf28/test-cases.
- The anonymous frontend project uses the production URL and the prepared scope. No Firebase test credentials, sync/workspace testing, secret values, or paid upgrade were added.
- GitHub integration initially reported that it could not access the repository despite an all-repository installation. Reconnecting and explicitly selecting **PromptDock** in the installation resolved event discovery. The installation is now scoped to PromptDock.
- Active pull-request trigger: successful deployment event for environment `firebase-hosting`; target `https://promptdock-95e31.web.app`; draft PR runs off; Merge gate on (`Report results as a status check, blocking merge on failure`).
- The preview workflow runs for same-repository PRs into `develop`, excluding forks and Dependabot. These exclusions limit which PRs can trigger through this deployment event.
- **Frank selected the production target for the deadline.** Firebase preview URLs include an unpredictable suffix; the portal supports only `{pr}`, `{branch}`, `{branch-slug}`, `{sha}`, `{short-sha}` in a URL pattern. Preview deployment is the trigger signal, but the test target remains production. This does not validate unmerged PR code.
- A real TestSprite PR status/comment is verified; GitHub required-check enforcement is not configured for TestSprite yet. No merge protections were bypassed. No Discord submission was posted.

![Active trigger and merge gate](evidence/testsprite-integration.jpg)

## First portal run

Run: https://www.testsprite.com/dashboard-v3/o/xuefeng-zhus-workspace-6167b83c/projects/43ae1231-cf5e-4d9a-81ee-e93fdf6dcf28/execution/cb159b2b-f603-47c6-b732-8416d5625ea5

**107 cases across 13 use cases: 57 passed, 21 failed, 29 blocked.** This is not a passing suite or submission-ready evidence. Exploration began while deployment was finishing, so some generated assumptions describe the previous production UI. The test run itself began after deployment succeeded.

Initial triage from test plans and failure observations:

| Case | Observation | Classification / next action |
| --- | --- | --- |
| Browse seeded library views | Favorites, Recent and Archived are selected, but the heading remains All Prompts. | Confirmed app defect: `LibraryHeader` hardcodes All Prompts. Prepared local view-heading fix with component and browser regressions. |
| Recover from empty search results; Mobile search filters the prompt list | Search field appears empty but the library remains filtered. | Needs replay and live reproduction; header search and palette maintain distinct queries. Do not relax recovery assertions. |
| Save a template prompt with metadata and copy the rendered output | Expects inspector Copy to disable for missing values. | Incorrect surface: missing-value validation belongs in the fill modal, while inspector Copy can copy unresolved template text. Correct the steps to open the fill modal and retain the disabled-Copy assertion there. No test has been weakened or removed. |
| Prevent constructor and proto placeholder regression | Save/reload and exact preview pass; clipboard text could not be independently verified from visible UI. | Automation gap: retain exact clipboard assertion and add a verifiable read/paste step. The live Chrome clipboard check passed independently, which does not replace this portal assertion. |
| Handle constructor and proto variable names safely | Resolved output works without crashing; test expects inspector Copy disabled when empty. | Correct the validation surface to the fill modal; retain empty-value rejection and exact-output requirements. |
| Render literal special characters in a template prompt | Generated body already substitutes the topic literal, then tries to fill a nonexistent topic input. | Invalid generated test data: restore `Write {{topic}} in {{tone}}. Repeat: {{topic}}.` as the body, then fill topic/tone. Preserve literal-output assertions. |
| Export active prompts to JSON | Export clicked; runner could not inspect downloaded JSON or native save picker. | Automation blocker. Download/picker handling and JSON assertions must be completed; a toast alone is not sufficient. |
| Mobile search filters the prompt list | Run Settings inherited 1920×1080 despite a mobile step. | Configure an actual mobile viewport and assert innerWidth; do not count desktop execution as mobile coverage. |

The remaining failures/blocked cases need individual review before a green result can be claimed. No failing test has been skipped, disabled, deleted or softened to obtain a green result.

## Submission gate

1. Keep PR #202 unmerged while TestSprite fails. Publish and deploy further tested fixes only with Frank's approval.
2. Correct inaccurate generated setup/interaction steps while preserving the intended assertions; handle clipboard/files and actual mobile viewports.
3. Re-run all cases. Investigate app defects and genuine runner blockers rather than accepting unchecked assertions.
4. Exercise the GitHub trigger and obtain an actual passing TestSprite comment/status on a PR. Verify that failure holds the merge through required checks.
5. Update the Discord draft with the verified result, PR, and confirmed TestSprite account details; Frank posts it before the deadline.

## PR #202 deployment and current gate

- PR: https://github.com/Xuefeng-Zhu/PromptDock/pull/202, head `a5ffbbfa5695968973931cc61fc221017d293601`, base `develop`. All seven normal checks passed, including browser/native/Rust testing and CodeQL. The PR remains open and unmerged.
- In addition to scope headings, this head preserves original tag display casing and keeps a nonempty library search editable instead of opening an independently queried command palette. Local gates passed with 1,034 Vitest tests (13 pre-existing skips) and 19 browser E2E tests.
- With Frank's explicit approval to deploy before the TestSprite check passes, production deployment #32 succeeded from that exact PR head: https://github.com/Xuefeng-Zhu/PromptDock/actions/runs/39875519473. Neither `main` nor `develop` moved for this deployment.
- Live Chrome verification after reloading production: Favorites heading is correct; an unmatched search showed No prompts found; clicking the nonempty search opened no palette; clearing it restored all 10 prompts already present in that browser. Existing local data was preserved.
- Deployment automatically triggered a fresh 107-case PR run against updated production: https://www.testsprite.com/dashboard-v3/o/6167b83c-97c5-5141-8f17-545913fba1fa/projects/43ae1231-cf5e-4d9a-81ee-e93fdf6dcf28/execution/5f48ad5d-e15a-4ada-ae3e-0716154c2714. The run finished **70 passed, 20 failed, 17 blocked**. The PR status is failure; do not claim a green suite.
- The preceding PR run on old production finished 51 passed, 21 failed, 35 blocked. It is historical red evidence, not validation of the new deployment.

### TestSprite AI and repaired setup

The portal's Copy fix prompt explicitly directs the user to paste its analysis into a coding agent. We used this workflow to investigate search recovery. AI root-cause suggestions remain hypotheses: one clipboard failure speculated about unsafe copying even though exact rendering already passed; adding independent paste-back verification made the case pass without another application change.

Repaired test setup for LIT-001, EDT-006, FAV-009, FLT-013, ONB-006, LIB-010 and TEM-006 retains exact literal rendering, HTML safety, nonrecursive replacement and clipboard assertions. Each case creates its own unresolved template fixture, explicitly configures variable metadata, opens Fill Variables through the command palette and pastes the copied result into a canceled verification draft. Passing individual portal results were observed for LIT-001, EDT-006, FAV-009, FLT-013 and TEM-006; ONB-006 and LIB-010 were rerun with the same repaired setup and still need their final result confirmed. TEM-005 was refined to configure a Textarea and dropdown explicitly, save multiline defaults, and verify exact pasted output and saved defaults after reload. Its fresh run exposed a real bug: the default-value control stripped line breaks. The local fix and regression evidence are recorded below.

All 13 mobile cases have saved 390×844 viewport overrides. Their mobile results must be distinguished from prior desktop runs. Chrome inspection of Settings at 390px showed document width 390px; the section navigation intentionally uses overflow-x-auto. A generated no-horizontal-overflow verdict needs to distinguish that tab strip from page-wide overflow; it has not been marked passed or weakened.

### File fixture blocker

TestSprite's own AI assistant confirmed that pasted JSON cannot be synthesized into project Test Files; real attachments are required. Synthetic fixtures are prepared in [fixtures](fixtures/README.md), including malformed JSON, invalid schema, a disposable duplicate/new-record pair and an exact 12,288-byte UTF-8 body with a manifest. No fixture uses secrets or private data.

Chrome's file-chooser upload attempt stalled; successful fixture attachment has not been confirmed. Import/export cases and exact long-content cases remain blocked until attachment and runner file/download handling work. A toast, approximate generated body, or screenshot is not a replacement for exact-content assertions. Do not delete, disable or skip those cases to obtain green.


## Confirmed multiline default defect and local fix

TEM-005 reported that entering `Launch` and `Campaign` on separate lines produced `LaunchCampaign`. The editor always used a single-line HTML input for variable defaults, including variables configured as Textarea. A new Vitest regression reproduced this failure before the change.

Local commit `ff4f3c6` uses the existing Textarea component for textarea defaults. Its browser regression checks exact multiline Unicode content in the default control, live preview, persistence after save/reload, Fill Variables and clipboard output. Lint and build passed; **1,035 Vitest tests passed with 13 pre-existing skips; all 20 browser E2E tests passed**. E2E used a temporary Chromium 153 executable because the pinned browser download failed locally; application dependencies and CI browser configuration were not changed. This commit has not been pushed or deployed and does not change the latest TestSprite result.

## GitHub protection gap and browser blocker

The existing `develop` branch-protection edit form lists only **Build and test** as required. The portal's Merge gate produces a failing TestSprite status, but TestSprite is not yet a required GitHub check. Frank must explicitly approve adding **TestSprite V3** alongside the existing check; preserve the other protection settings. Do not bypass the failing status to merge.

Chrome returned **“The connected browser approval session failed. The tool was not replayed.”** on resuming portal work. Reconnect the ChatGPT Chrome extension before retrying signed-in portal actions or workflow dispatch. No portal or GitHub settings were changed in this failed browser attempt.

The [remaining-case action plan](REMAINING_CASES.md) distinguishes the reproduced app defect from setup mistakes and unresolved runner limitations. Those are proposed next actions, not completed portal edits or passing results.


## October 22 publication checkpoint

Frank approved publishing the multiline fix/documentation, deployment after CI, and adding the required TestSprite check. Published fix commit `8d2fd13a4edb2428adcadf2059fa0f2e0b7b6d95` has the exact tested local tree `b8fbb3c3dee40b30c17480c8e9ebc32c6a6bb66c`. Documentation commit / PR head `e6339b1e186cf11cb300822d5a5fdba2d477fe2b` matches local tree `f16ab7411626ffc24e6d17b8a1f6d331a4a44b85`. All seven normal CI checks passed.

Production deployment #33 succeeded from that head: https://github.com/Xuefeng-Zhu/PromptDock/actions/runs/39899769500. Live Chrome verification saved a synthetic multiline default `Launch\nCampaign 中文 😀`, reloaded it, reopened Fill Variables and independently read exact clipboard text `Write Launch\nCampaign 中文 😀. Repeat: Launch\nCampaign 中文 😀.`. No existing recipes were removed.

GitHub prompted for account verification while saving branch protection; after verification the saved develop rule was inspected again. It now requires **Build and test** from GitHub Actions and **TestSprite V3** from TestSprite. Other protection controls were preserved. Saved rule: [required check](https://github.com/Xuefeng-Zhu/PromptDock/settings/branch_protection_rules/76447933). Production deployment: [production](https://github.com/Xuefeng-Zhu/PromptDock/actions/runs/39899769500).

The deployment automatically triggered full PR run `620b8fd6-556b-40eb-b96d-bcee225d8515` against production. Its status is pending; the in-progress counts are not a final result. PR #202 remains unmerged. No additional manual full run was started.

TestSprite AI was asked to propose only generated setup/interaction corrections while preserving all 107 cases and intended assertions. Only FLT-012 has a confirmed executed Update so far; other tool labels reading Done are not proof of saved edits. A direct FLT-011 inspection still showed its old missing-template setup. ONB-003, not ONB-004, is the folder/tag/search case; this ID mismatch was corrected in the follow-up request. Remaining updates need individual saved-plan verification.

Test Files attachment remains unconfirmed. Browser download/file-chooser operations timed out. Frank was given the fixture ZIP and asked to extract it and add its synthetic files through Test Files. Exact file/download assertions remain intact; no case was skipped or softened.


### Verified regression and updated suite plans

TEM-005 passed in PR run 620b8fd6-556b-40eb-b96d-bcee225d8515 with its multiline, clipboard and reload assertions intact. Run evidence: [TestSprite pass](https://www.testsprite.com/dashboard-v3/o/6167b83c-97c5-5141-8f17-545913fba1fa/projects/43ae1231-cf5e-4d9a-81ee-e93fdf6dcf28/execution/620b8fd6-556b-40eb-b96d-bcee225d8515?test=85e13acc-2b21-46f0-b3c8-f43d43dfcb54). This is genuine red-then-green evidence for the multiline fix, not a passing full suite. The completed full run was **63 passed, 23 failed, 21 blocked**; its bot comment is https://github.com/Xuefeng-Zhu/PromptDock/pull/202#issuecomment-6357306595.

Individual Save & Run corrections were applied to FLT-011, TEM-007, ONB-007, LIT-002 and MOB-009. TestSprite AI proposals were reviewed; invalid proposals missing Body setup or the actual Copy action were rejected before writing. Valid AI changes were confirmed for FLT-012, ONB-003 and EDT-005. The AI's bulk Update labels were not accepted as proof of execution: it confirmed that an open review card had blocked the other attempted updates.

The portal's full YAML editor then applied 13 setup/interaction updates, with its confirmation explicitly listing 13 updates and no added/deleted cases. The saved YAML was copied back through the UI and parsed: it matched the reviewed YAML exactly. All 107 IDs, titles, descriptions, priorities and assertion counts were retained. These edits occurred after the completed full run was launched and do not retroactively validate it.

A second 11-case update addresses the remaining generated interaction mistakes: header-trigger palette scoping, explicit saved-description verification before duplication, native paste focus, the mobile fill-modal entry path, and source-file-based exact long-content comparisons. The long cases use the prepared real 12,288-byte fixture; they remain blocked if it is not attached. No approximation, excerpt, toast, deleted case or skipped assertion counts as a pass. The second 11-case batch was saved and copied back through the UI. Its parsed content matched the reviewed plan exactly; fresh execution is still required.


### Focused verification and current blocker

All five individual Save & Run corrections passed: FLT-011, TEM-007, ONB-007, LIT-002 and MOB-009. Latest-per-case totals became 68 passed / 18 failed / 21 blocked, which must not be substituted for the full PR run result. A focused 15-case run was launched on the corrected non-file failures: https://www.testsprite.com/dashboard-v3/o/xuefeng-zhus-workspace-6167b83c/projects/43ae1231-cf5e-4d9a-81ee-e93fdf6dcf28/execution/08336884-1d91-4e66-8b95-821e00ac09d1. The three remaining failed long-content cases await the actual fixture, alongside the existing blocked file cases. This subset run does not replace the required full 107-case PR check.

The final saved plan is preserved in [test plan](evidence/testsprite-plan-final-saved.yaml). Both YAML batches retained all 107 IDs and all titles, goals, priorities and assertion counts. No tests were added, deleted, disabled or skipped. The file and exact-content cases are still in the suite. Test Files was inspected again and is empty; its page is left open for Frank to upload the extracted fixture bundle.

## Fixture upload and credit checkpoint

Frank completed upload of README.md, manifest.json, ts4-valid.json, ts4-modified.json, ts4-bad-json.json, ts4-bad-schema.json, ts4-exact-12k.txt and ts4-long.json. All eight show Ready. The focused run finished 12 passed / 3 failed. Latest-per-case totals are 80 passed / 6 failed / 21 blocked; this is not a full PR result. A Run All 107 request was rejected with Insufficient credits. No new full execution was started and no billing action was taken.


### Focused reruns after fixture upload

All 21 previously blocked cases are running in execution `e6f25b36-3436-4edf-a88a-acf91afaea11`; all six remaining failed cases ran in `4ec13a85-b047-4a47-a986-f8216f0fcfc9`. The workspace displayed 45.8 credits before these launches, enough for focused investigation but not the full 107-case request. LIB-005, FAV-008 and TEM-001 now explicitly use real keyboard Select All/Backspace instead of an empty fill. The three-case plan update was saved and read back through the UI; parsed YAML matched the reviewed plan exactly. All 107 cases and all assertions remain. These in-progress subset runs do not replace the required full PR check.


### Completed post-upload subsets

Execution e6f25b36-3436-4edf-a88a-acf91afaea11 completed **3 passed / 5 failed / 13 blocked**. Execution 4ec13a85-b047-4a47-a986-f8216f0fcfc9 completed **3 passed / 0 failed / 3 blocked**. All three clearing-input cases (TEM-001, LIB-005, FAV-008) now pass with explicit native keyboard actions. The remaining long cases are blocked: fixture text readout is truncated, and the runner attempted to upload into the From JSON textarea. A duplicate import case selected ts4-long.json rather than the required disposable duplicate pair and could not handle the native Settings Import picker. TestSprite AI was asked for read-only capability diagnosis; no additional runs were requested. Aggregate latest-case counts are 86 passed / 5 failed / 16 blocked, not a full PR result.
