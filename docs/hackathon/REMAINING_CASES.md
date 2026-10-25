# Remaining TestSprite cases — action plan

## Current checkpoint — October 24, 2026

The latest-per-case inventory is **91 Passed / 2 Failed / 14 Blocked**, with **107 cases / 217 assertions preserved** and **0 running**. This combines each case's latest focused result; it is not a passing full-suite PR execution.

- **Submitted:** the [Discord hackathon entry](https://discord.com/channels/1227394620623949934/1563612968724209664) was posted on October 24 at 10:59 AM Pacific with two real app screenshots. It discloses the remaining failures and blockers. Submission is complete; the merge gate below is separate.
- **Deployed:** production and the remote [PR #202](https://github.com/Xuefeng-Zhu/PromptDock/pull/202) head are `22647ec76670ae7401148f9cb6208c1982c681cb`. [Normal CI](https://github.com/Xuefeng-Zhu/PromptDock/actions/runs/40073649533) and the [production deployment](https://github.com/Xuefeng-Zhu/PromptDock/actions/runs/40074130187) passed. There is no green full-suite TestSprite PR result, and the PR remains open and unmerged.
- **Resolved:** the five long-text cases LIB-013, ONB-009, EDT-009, FLT-018 and TEM-009 passed full 12 KiB SHA-256 comparisons after reload. Corrected FLT-011, ONB-002 and FAV-014 subsequently passed **3 / 3**, with no failures or blockers, in [execution db9cdc55](https://www.testsprite.com/dashboard-v3/o/6167b83c-97c5-5141-8f17-545913fba1fa/projects/43ae1231-cf5e-4d9a-81ee-e93fdf6dcf28/execution/db9cdc55-47a7-451b-9b78-800da332b0c3).
- **Support:** the remaining runner capabilities were reported through Intercom and [Discord](https://discord.com/channels/1227394620623949934/1227394621362143326/1563460634979340358). See the [support and focused-run receipt](evidence/discord-support-report.md). No supported resolution has yet been verified.
- **Automation:** automatic TestSprite PR runs remain paused. The required **Build and test** and **TestSprite V3** checks remain in place. No case or assertion was skipped, deleted, weakened or manually marked passed.

| Remaining group | Current result | Required next verification |
| --- | --- | --- |
| FAV-011 | Failed | Exercise the actual exported download, read/reimport it, and verify duplicate handling. Independent production Playwright checks pass; they do not replace this portal assertion. |
| TEM-010 | Failed | Measure numeric `innerWidth` and page overflow at the required viewport through a supported runner mechanism. A narrow screenshot is insufficient. |
| JSON import/export and fixture workflows | 14 Blocked | Resolve named fixture availability and actual file/download handling. Project Test Files showing Ready does not prove a file is mounted in an execution. |

Next, use a concrete runner/setup correction or a supported capability from TestSprite, retain the original assertions, and obtain approval for the smallest affected rerun before spending credits. A fresh complete 107-case result on the deployed PR head is still required before merge; aggregate focused passes and independent browser checks do not satisfy that gate. Further pushes, deployments, automatic-trigger changes and support messages require their own authorization.

## Local execution-obstacle correction — pending deployment

Account → Layout details now provides actual numeric viewport and overflow measurements in the local candidate. [Investigation and verification](evidence/runner-obstacle-investigation.md) and the [pending TEM-010 action patch](evidence/testsprite-layout-pending.yaml) explain the correction. The patch preserves both original assertions and is not saved in TestSprite. Production, remote PR head and portal verdicts above remain the recorded submission checkpoint; this local correction has not been pushed or deployed. The remaining JSON/download cases still require supported runner file access.

## Historical checkpoints

The dated records below preserve what was observed at each earlier checkpoint. Their counts, balances, pending deployments, running executions and submission-access statements are historical, not current instructions. The October 24 checkpoint above supersedes them. Paths under `/tmp` identify local-only investigation artifacts, not public evidence links; published receipts and repository evidence are linked above.

### October 24 completed long-text fix (12:41 AM Pacific)

All five requested long-text cases now pass in TestSprite against production commit `22647ec76670ae7401148f9cb6208c1982c681cb`:

| Case | Execution | Result |
| --- | --- | --- |
| LIB-013 | `0692200c-99a4-45d9-b4c3-64fd5f674219` | Passed |
| ONB-009 | `810c53f1-ccce-4c19-a082-f43e80edf696` | Passed |
| EDT-009 | `810c53f1-ccce-4c19-a082-f43e80edf696` | Passed |
| FLT-018 | `810c53f1-ccce-4c19-a082-f43e80edf696` | Passed |
| TEM-009 | `810c53f1-ccce-4c19-a082-f43e80edf696` | Passed |

- The first execution finished 1 passed / 0 failed / 0 blocked. The four-case execution finished 4 passed / 0 failed / 0 blocked. Every affected case ran exactly once within the approved allowance; no retries or unrelated cases were run.
- Fresh project inventory confirms **107 cases, 50 runs, 0 running; 88 passed / 5 failed / 14 blocked**. These are latest-per-case totals and focused execution receipts, not a complete 107-case PR run. The 14 remaining blocked cases are the separate JSON import/export group.
- Account-info MCP confirms **58.6 credits remain**, down exactly **2.5** from 61.1 before this follow-up. No purchase, upgrade or credit request occurred.
- The fix adds a generic on-demand current-text SHA-256/UTF-8 count to the editor, computed locally from the complete body. It allows the runner to compare an actual digest to independent source/edited-source digests. All 107 IDs, case metadata and all 217 original assertion strings were preserved. The exact saved full portal export is refreshed locally in `evidence/testsprite-plan-final-saved.yaml`; the committed pending five-case patch remains the historical reviewed candidate.
- Normal CI and security checks, 1,050 local unit tests, all 31 local browser tests, and eight isolated production file workflows passed. Production deployment `40074130187` used the approved exact commit. Native desktop CI passed. Emulator-dependent Firebase tests remain 13 existing skips; real cloud sync was not exercised.
- PR #202 remains unmerged. Automatic TestSprite PR trigger stays Disabled and required checks were not changed. A fresh full PR result remains necessary before any eventual merge.
- Screenshot receipt: `/tmp/promptdock-testsprite-long-text-result.jpg`. Production panel screenshots: `/tmp/promptdock-production-text-details-desktop.png` and `/tmp/promptdock-production-text-details-mobile.png`. All application/source/test changes for this fix are pushed in `22647ec`; existing local documentation edits and this checkpoint remain uncommitted.

### October 24 first long-text pass and four-case execution (12:35 AM Pacific)

- LIB-013 passed in focused execution `0692200c-99a4-45d9-b4c3-64fd5f674219`: 1 passed / 0 failed / 0 blocked. The runner uploaded the actual text fixture, opened Text details before saving and after reopening the saved editor, then exercised unmatched search and empty Favorites/Archived recovery.
- Confirmed the remaining selection by visible checked row IDs: EDT-009, FLT-018, ONB-009 and TEM-009 only. Started those four once in execution `810c53f1-ccce-4c19-a082-f43e80edf696`; all four are running at this checkpoint. No LIB-013 rerun or unrelated test was requested. This uses the full approved allowance of five case executions (maximum 2.5 credits); do not retry without further approval.

### October 24 long-text deployment and focused probe (12:30 AM Pacific)

- Approved commit `22647ec76670ae7401148f9cb6208c1982c681cb` is pushed to PR #202. [CI](https://github.com/Xuefeng-Zhu/PromptDock/actions/runs/40073649533), native desktop tests and all CodeQL analyses passed. [Production deployment](https://github.com/Xuefeng-Zhu/PromptDock/actions/runs/40074130187) succeeded for that exact head.
- Eight isolated Playwright file workflows against production passed, including all five long-text workflows, the deliberate exact marker append, mobile live fingerprints, real download/reimport and invalid import handling. These live-browser checks remain separate from TestSprite verdicts.
- Saved the five-case patch only after production checks. Current portal read-back parsed exactly equal to the reviewed full candidate; 107 IDs/order, all case metadata and all 217 original assertions remain. The complete saved export is refreshed locally. The committed five-case pending patch is historical review evidence, not a replacement full plan.
- Balance was 61.1 credits before any focused rerun. LIB-013 alone started in execution `0692200c-99a4-45d9-b4c3-64fd5f674219`. It is running at this checkpoint. Approval permits only one run per affected case, no more than 2.5 existing credits total; no other case has been executed in this follow-up yet. Automatic PR trigger remains Disabled, all cases retained and PR unmerged.

### October 24 long-text comparison fix (12:20 AM Pacific; CI pending)

- Frank requested fixing the five long-text cases and approved pushing/deploying tested commit `22647ec` after CI, plus one execution of each affected case with a maximum total of 2.5 existing TestSprite credits. The commit is pushed to PR #202; production still awaits CI at this checkpoint. No automatic trigger was enabled.
- The editor now offers an on-demand Text details panel. It computes SHA-256 and UTF-8 byte count from the complete current draft locally through Web Crypto, including text restored from storage. It never renders an expected fixture constant or a test-pass flag. Superseded asynchronous calculations cannot display an older draft hash; unavailable crypto shows an error rather than claiming comparison.
- A reviewed five-case patch is committed as `evidence/testsprite-long-text-pending.yaml`. It compares the actual computed digest before save and after real browser reload with the independently computed source digest. EDT-009 additionally appends exactly one newline and `TS4 edited marker`, producing 12,306 bytes and SHA-256 `6d9ab4a1b54864dfd0297432de40915d370e187fc995b76e8204be148bb2f0e8`. Every original assertion remains; all other 102 cases are unchanged. The fresh portal export was checked against the saved baseline before preparing application.
- Local verification passed: lint, typecheck, build, **1,050 Vitest passed / 13 existing emulator-dependent skips**, and **all 31 browser E2E tests passed**, including all five long-text workflows and mobile fingerprint rendering. Independent Node hashes and exact full textarea equality verify the comparison implementation; negative tests detect middle-character, final-newline and line-ending changes. Local browser output still reports the existing missing Firebase configuration notice; cloud sync is outside this verification.
- First local browser probes caught navigation errors in the new test (saved Edit Prompt uses Library breadcrumb rather than a Cancel button) and a platform-specific end shortcut; both test instructions were corrected before the full passing run. These are not TestSprite pass receipts. The five portal cases have not been rerun yet, and their pending patch must only be saved after production verification.

### October 24 final production probe and support checkpoint (12:05 AM Pacific)

- The approved push/deployment and successful CI/live browser checks are recorded below. PR #202 remains open at `86246ae1cd355a9bcfab2b784fb4d9fbbb306a4c`; nothing was merged and no automatic TestSprite PR trigger was enabled.
- Three focused production portal probes finished **Blocked**, preserving their assertions: export JSN-001 (`24738a52-1f45-4851-88a7-2d7bca1a407a`) could not inspect the actual downloaded JSON; long-text LIB-013 (`f09064ff-ff1d-4a6f-9037-3786d94efd2b`) uploaded/saved/restored a recipe and checked empty-state recovery but could not compare its complete body to the source; duplicate-import JSN-002 (`5cd14f34-63c3-4534-a573-53a270d29848`) found the visible Choose JSON file input but still lacked `ts4-valid.json` and `ts4-modified.json`. No exact-text or download corruption was established by those unavailable comparisons. The portal's automated root-cause guesses are not confirmed application defects.
- Latest inventory: **107 cases, 48 runs, 0 running; 83 passed / 5 failed / 19 blocked**. The three probes cost **1.5 credits**, leaving **61.1**, verified through account-info MCP. No further test run or purchase was made.
- Clarified file steps in 14 cases after the probes: JSN-001 explicitly performs export only, and imports select only their later explicitly named attachment or actual downloaded backup. All 107 cases and 217 assertions remain. The clarified portal read-back was parsed and matched the reviewed candidate exactly; the saved YAML is refreshed locally. No new application code or deployment was needed for this clarification.
- Frank approved the exact support draft. It was sent through this project's signed-in Intercom messenger and marked Seen. After a separate explicit approval for the human-escalation sentence, TestSprite Support AI confirmed routing to a human, displayed **Waiting for a teammate**, and stated the support team will be back Monday. No human answer or capability resolution has arrived. Support message and receipt are preserved at `/tmp/promptdock-testsprite-support-draft.md` and `/tmp/promptdock-testsprite-support-escalated.jpg`.
- Remaining work requires supported fixture mounting, actual download read/reimport, complete source/body comparison and numerical viewport measurement. Keep original assertions and required GitHub checks. Do not spend more credits repeating these capabilities without a concrete setup correction. A fresh complete 107-case result on the PR head is still required before merge; focused/local/live-browser checks cannot replace that required PR result.

### October 23 approved production file-workflow update (11:48 PM Pacific)

- Frank explicitly approved pushing `931a2e7` and `86246ae` and deploying after CI. Both commits are now on PR #202 at exact head `86246ae1cd355a9bcfab2b784fb4d9fbbb306a4c`; PR remains unmerged.
- [CI](https://github.com/Xuefeng-Zhu/PromptDock/actions/runs/40070949007) passed: 1,041 unit tests (13 existing emulator-dependent skips), all 26 browser tests, native desktop smoke test and five Rust command tests. Preview and all three CodeQL analyses passed.
- [Production deployment](https://github.com/Xuefeng-Zhu/PromptDock/actions/runs/40071464533) succeeded at that exact commit. Three isolated Playwright file workflows against the live production URL passed: real downloaded backup reimport twice with metadata/archive checks; named JSON fixture import, duplicate skip/overwrite and error recovery; complete 12,288-byte UTF-8 upload/edit/reload/clipboard/export at 390×844. These are live-site browser checks, not TestSprite verdicts or cloud-sync verification.
- The reviewed 19-case plan was applied only after live verification. Fresh pre-edit portal export matched source SHA-256 `d0db15f653f3e93cc90f21f2f0823736b23bd2824373c6a03da66fd3e90e6431`. Saved read-back matches the reviewed candidate semantically, preserving all 107 cases, every ID/title/goal/priority and all 217 assertions. The complete saved export is refreshed in `evidence/testsprite-plan-final-saved.yaml`; the committed pending-deployment candidate remains historical review evidence.
- Workspace had 62.6 credits before the new probe. Only export case JSN-001 was started in execution `24738a52-1f45-4851-88a7-2d7bca1a407a` to verify the standard download in TestSprite before expanding. It is still running at this checkpoint. No full run, purchase, support message, trigger re-enable, merge or protection change was performed.
- Automatic TestSprite PR trigger remains Disabled. Latest-per-case counts before the new probe remain 83 passed / 5 failed / 19 blocked. Missing runner fixture access and numerical viewport measurement remain unverified platform capabilities; no assertion was weakened and no case was manually marked passed.


### October 23, 2026, late evening Pacific

This follow-up supersedes the latest-per-case counts and no-execution statements in the checkpoint below. The full PR execution and required status remain failing.

- Repaired **FLT-012** by explicitly entering Fill Variables, selecting exact topic/tone values, copying, and pasting into a canceled draft. Both original exact clipboard/preview assertions remain. It passed in [two-case execution fa4f2071](https://www.testsprite.com/dashboard-v3/o/6167b83c-97c5-5141-8f17-545913fba1fa/projects/43ae1231-cf5e-4d9a-81ee-e93fdf6dcf28/execution/fa4f2071-eb6f-4b59-9222-d170c42e4ecb), which finished **1 passed / 1 failed / 0 blocked**.
- Repaired **SEA-003** by creating two matching variable prompts, verifying highlight movement with ArrowDown and selecting the newly highlighted result with Enter. The first run omitted the second prompt's saved default; the log shows Beta saved immediately after its body, without a default-setting action. The follow-up plan makes each saved-default step explicit. It passed in [single-case execution 71579e01](https://www.testsprite.com/dashboard-v3/o/6167b83c-97c5-5141-8f17-545913fba1fa/projects/43ae1231-cf5e-4d9a-81ee-e93fdf6dcf28/execution/71579e01-70a1-4cc5-b0fe-6ae13bdc0482). The generated hydration diagnosis was not treated as proof of an application defect.
- Portal latest-per-case totals: **83 passed / 5 failed / 19 blocked**, **45 runs**, **0 running**. Two focused executions ran in this follow-up, totaling three case executions. No full suite was launched. The account balance changed from **64.1 to 62.6 credits**.
- Both plan saves were reviewed in the batch editor and saved case definitions read back. All **107 case IDs**, titles, goals, priorities and **217 explicit assertions** remain. The saved local YAML incorporates these two cases alongside the earlier JSN-002/TEM-010 readback. It is not a fresh full-portal export.
- Prepared a **local, unpublished application patch**: persistent `Choose JSON file` control in Settings, standard browser export downloads, and `Load text file` in the body editor. These controls use the existing JSON validation/duplicate-review flow and keep text loading in the unsaved draft. Native Tauri save dialogs remain unchanged.
- Local verification: **lint/build passed; 1,041 Vitest tests passed / 13 existing skips; all 25 browser E2E tests passed**. Real fixture tests cover repeated unchanged imports, modified duplicates with skip and overwrite, malformed/schema rejection without mutation, recovery, downloaded JSON content and reload. The real 12,288-byte fixture's SHA-256 is verified before full-body loading, editing, reload, exact clipboard and export comparisons. Chromium measurements at 390×844 verify `innerWidth = scrollWidth = 390`. This local numeric check does not satisfy the portal's TEM-010 assertion.
- Visual review at 1280×900 and 390×844 shows the file control without page-wide horizontal overflow or uncaught page exceptions. Local mode logs the existing missing-Firebase-configuration message; live authentication/sync and native desktop behavior were not verified.
- The PR trigger was inspected and remains **Disabled**. No push, deployment, merge, repository-setting change, support message, fixture deletion/upload, subscription change or credit purchase occurred.

#### Next publication and runner gates

The new controls must be deployed before the hosted TestSprite agent can use them. Frank's handoff requires explicit approval before pushing to PR #202 or deploying. After deployment, retain every file/content assertion and direct file cases to the persistent Settings upload control; direct exact-text cases to the body editor's text-file control. Validate one affected case before any broader execution. Missing fixture mounting and numerical frontend measurement still need a supported TestSprite mechanism; these local changes do not establish that either platform limitation is resolved.

#### Prepared corrections for every remaining blocked case

- Local commit `931a2e7` contains the tested application file controls. Local commit `86246ae` adds a real downloaded-backup round-trip regression and the [pending deployment plan](evidence/testsprite-file-plan-pending-deployment.yaml). Neither commit has been pushed or deployed. Existing documentation edits remain uncommitted.
- Read the complete current plan back through the portal's YAML editor without saving edits or launching tests. The saved snapshot now represents all 107 current portal cases, including the newer EDT-005 steps absent from the earlier partial snapshot. The canonical LF snapshot SHA-256 is `d0db15f653f3e93cc90f21f2f0823736b23bd2824373c6a03da66fd3e90e6431`.
- The pending plan is based on that fresh full export. It changes actions in exactly the 19 currently blocked cases: **14 import/export and five exact-text cases**. Machine comparison verifies identical case IDs/order, names, priorities, goals and every original assertion string for all 107 cases (**217 assertions**). The other 88 cases are semantically unchanged. The pending plan is clearly labelled **not saved in the portal** and requires deployment first.
- The expanded full browser suite passed **all 26 tests**. The additional regression imports the actual downloaded JSON twice, verifies zero duplicate mutations by comparing complete exported prompt arrays, confirms archived recipes stay excluded from export but remain in Archived, and checks multiline defaults, dropdown options, variable descriptions, tags and body after reload. Lint passed. The application source remains the version that passed build and 1,041 unit tests (13 existing skips).
- Rechecked live totals: **83 passed / 5 failed / 19 blocked**, 45 runs, zero running. No additional TestSprite execution or credit use occurred in this continuation. Hosted completion remains unproven until deployment approval, required fixture availability and successful affected-case execution.

### Verified checkpoint — October 23, 2026, evening Pacific

This checkpoint supersedes the historical results and pending-work statements below.

- Local checkout now tracks the actual remote `fix/library-view-heading` branch at `a2b180c3d8f722806ab68e33adde0cb7e824c184`; `develop` remains `82bcafe`. The previous `/workspace/scratch/0993a134a928/PromptDock` checkout is unavailable on this Mac. Its uncommitted notes and fixture ZIP were not recovered or overwritten. No force-push was used.
- [PR #202](https://github.com/Xuefeng-Zhu/PromptDock/pull/202) is open, ready for review, and unmerged. All eight normal GitHub checks report success. [Production deployment](https://github.com/Xuefeng-Zhu/PromptDock/actions/runs/40024458312) succeeded for the exact `a2b180c` head. Prior local results (1,039 passed / 13 existing skips; 23 browser E2E passed; lint/build passed) come from the handoff, not a new local run.
- The TestSprite Pull Request trigger is **Disabled**, confirmed in GitHub Action settings. GitHub's `develop` protection still requires **Build and test** and **TestSprite V3**, with the corresponding app IDs. No trigger or protection was changed.
- The newest completed full PR run, [cbc9b35d](https://www.testsprite.com/dashboard-v3/o/6167b83c-97c5-5141-8f17-545913fba1fa/projects/43ae1231-cf5e-4d9a-81ee-e93fdf6dcf28/execution/cbc9b35d-6c77-4d56-815a-b56e11a49370), reports **81 passed / 5 failed / 21 blocked**. The [PR bot comment](https://github.com/Xuefeng-Zhu/PromptDock/pull/202#issuecomment-6374785187) agrees. GitHub's failing required status still links to the earlier [a3935999](https://www.testsprite.com/dashboard-v3/o/6167b83c-97c5-5141-8f17-545913fba1fa/projects/43ae1231-cf5e-4d9a-81ee-e93fdf6dcf28/execution/a3935999-3d33-4c6b-836a-9fb0f3ffb26d) run, **81 passed / 7 failed / 19 blocked**. These are distinct executions; neither is green.
- Current project list: **107 cases**, **43 runs**, **0 running**; latest-per-case totals are **81 passed / 5 failed / 21 blocked**. Those totals do not replace the required PR status.
- Workspace balance currently shows **64.1 credits remaining**. The earlier 280.4 and insufficient-credit checkpoints are historical. No test execution, credit request, purchase, or subscription change was made in this follow-up.
- All eight Test Files still show Ready. Editing `ts4-valid.json` opens the Starter upload-limit gate, **8/3**. The inspected fixture list and JSN-002 case have no exposed per-test file selector or mounted-file inventory. This is an observation about inspected surfaces, not proof that no such mechanism exists. Quota causing run-time file selection remains **unconfirmed**.
- Current JSN-002 retains five steps and both final assertions: unchanged/repeat `ts4-valid.json` imports, then `ts4-modified.json`, all with Skip duplicates. Its [focused probe](https://www.testsprite.com/dashboard-v3/o/6167b83c-97c5-5141-8f17-545913fba1fa/projects/43ae1231-cf5e-4d9a-81ee-e93fdf6dcf28/execution/aba38655-7917-4afc-bf4e-f27d10c1b160) is **0 passed / 0 failed / 1 blocked**: only `ts4-exact-12k.txt`, `ts4-long.json`, and `README.md` were reported available; both required JSON files were missing. No import occurred.
- Current TEM-010 retains its exact multiline variable template, saved `Launch` default, clipboard paste-back and reload checks, and **390×844** override. Its latest verdict is **Failed** because actual `innerWidth` was not measured. The earlier focused Blocked verdict is historical. A screenshot does not satisfy the numerical assertion.
- The local saved YAML has been refreshed from the read-only portal case details for **JSN-002 and TEM-010 only**. Other cases are retained unchanged; this is not a complete new portal-plan export. All 107 IDs, names, descriptions, priorities and assertion counts are preserved.

#### Five failures in the newest full run

| Case | Recorded evidence | Next action that preserves the intended check |
| --- | --- | --- |
| FLT-011 | Saved defaults, metadata, preview and unresolved body verified; runner used Library instead of requested Cancel. | Make explicit Cancel activation and unchanged-library verification sequential in a reviewed plan correction. No app defect established. |
| ONB-002 | Edited, duplicated, favorited, archived and restored; exclusion from All Prompts while archived was never checked. | Place the active-library exclusion check before Restore, keeping the final restoration checks. No app defect established. |
| TEM-010 | Template, preview, clipboard paste-back, drawer/settings and reload completed; numerical width unavailable. | Obtain the supported frontend measurement mechanism; retain exact width and overflow requirements. |
| FAV-014 | Runner saved an 899-character sample instead of the complete exact long fixture. | Resolve complete fixture access and exact comparison; do not approximate or accept excerpts. |
| FAV-011 | Export/download and Import selection were not observed; round-trip and deduplication not exercised. | Obtain supported native save/download/file-input handling before spending more credits. |

#### Support request plan before authorization

Send a reviewed support request only after Frank approves its exact text and destination. Ask TestSprite for fixture selection/mount metadata, native file handling, numerical frontend measurement, and the differing PR status/report run links. No new manual runs until there is a concrete correction; then validate the smallest affected case once after reading current usage. Re-enabling an automatic trigger, pushing, deploying, changing repository/Firebase settings, merging, or posting still requires explicit approval. Preserve all 107 cases and required checks.

Official [Run Behavior documentation](https://docs.testsprite.com/web-portal/setup/execution-settings) describes an “Always use planned steps” option and viewport presets, but does not establish a frontend `page.evaluate` capability or file-mount selection rule. The inspected live Run Behavior page exposes login reuse, viewport and concurrency, but no planned-step option; its value could not be verified. No setting was changed. The generated Python/Playwright code documented for UI tests is not proof that the portal frontend agent exposes arbitrary JavaScript.

### Historical checkpoints

### October 23 follow-up

- The organizer extended the deadline to **Monday, October 26, 11:59 PM Pacific**: [admin announcement](https://discord.com/channels/1227394620623949934/1556776381894099117/1563280349557956740). This supersedes the original October 22 date.
- Current workspace balance was verified at **280.4 credits** before the targeted probe, including 250 extra credits. The prior full-run credit error is historical. No purchase or credit request was made.
- PR #202 remains unmerged at remote head 1c8afa3. All normal CI checks passed; the TestSprite check still records the historical insufficient-credit refusal.
- Review found two additional UI defects: archived tag casing could override the visible sidebar label, and a retained query prevented header-click palette access outside the library. Local fix commit 08e2926 addresses both with two red-then-green component regressions and browser regressions for Settings/editor entry. Lint/build passed, **1,037 Vitest passed / 13 existing skips, and 22 browser E2E passed**. This follow-up is not pushed or deployed; Frank's per-push/deploy approval is still required. The temporary Chromium 153 launch override was removed; CI config and dependencies are unchanged.
- JSN-002 was refined as a targeted native-file-chooser probe using the disposable baseline and named modified fixture, preserving exact new-record/duplicate-preservation assertions. It finished Blocked: the runner reported no chooser and said /tmp/fixtures/ts4-modified.json was unavailable. The attachment remains a project Test File; do not confuse a guessed runner path with verified availability. The latest one-case portal edit is newer than the saved YAML snapshot and needs incorporation after resolving runner access. Preserve unchanged/repeat-import coverage when finalizing this probe into the suite. Local Playwright import tests pass through the native chooser event, so this report does not establish a broken application import handler. No additional full run was requested.
- At this October 23 checkpoint, searching hackathon-s4-submissions returned No matching posts and the account lacked posting permission. That access issue was subsequently resolved; the October 24 submission receipt is recorded above.

The earlier checkpoints below are historical.


Historical checkpoint: October 22, 2026, about 10:10 PM Pacific. [PR #202](https://github.com/Xuefeng-Zhu/PromptDock/pull/202) was open with a failing required TestSprite check. The complete PR run recorded then, `620b8fd6-556b-40eb-b96d-bcee225d8515`, finished **63 passed, 23 failed, 21 blocked**. Its [bot comment](https://github.com/Xuefeng-Zhu/PromptDock/pull/202#issuecomment-6357306595) is historical evidence, not a green result.

### Historical completed work and blockers

- TEM-005 is fixed and deployed from `e6339b1`; its original multiline/default/clipboard/reload assertions passed in the full PR run. The fix has unit and browser regressions. Lint/build passed, 1,035 Vitest tests passed (13 existing skips), and all 20 browser E2E tests passed. All seven normal CI checks passed.
- Both saved YAML batches preserved all 107 IDs, titles, goals, priorities and assertion counts. The final saved plan is in [evidence](evidence/testsprite-plan-final-saved.yaml).
- The focused run `08336884-1d91-4e66-8b95-821e00ac09d1` finished **12 passed, 3 failed, 0 blocked**. TEM-001, LIB-005 and FAV-008 still failed on clearing-input behavior. These are not confirmed application defects: independent Chrome checks against production rejected an empty title, disabled modal Copy with a required value empty, and restored all seven existing recipes after clearing search. The runner log used fill actions for the title-clearing step. Retain these assertions and investigate the actual events/focus in TestSprite.
- Frank uploaded all eight synthetic files. Test Files shows each as **Ready**, including the malformed/schema fixtures, duplicate pair, exact 12,288-byte text and long JSON. Actual runner upload/download and exact-content assertions still need execution.
- Attempting **Run All 107** after the upload was rejected with **Insufficient credits**. No new full run was created. Replenish workspace credits before rerunning; no purchase or upgrade was made.
- The saved develop rule requires both **Build and test** and **TestSprite V3**. Do not bypass this gate or merge while it fails.

### Earlier triage plan

The table below records intended assertions and setup corrections, many now saved in the portal. It is not a list of newly reproduced defects or proof of passing execution.

### Case-level work in the portal

| Failed case | Next action; assertion to retain |
| --- | --- |
| Edit long prompts and preserve exact content with empty search and empty-state recovery | Attach the exact long fixture. Replay recorded search actions and identify which search field was cleared. Retain exact saved-content equality and full recovery in All Prompts. Do not infer a store defect from the report alone. |
| Copy the rendered template output with required values present | Create a topic/tone template inside this case; fresh anonymous contexts do not contain a previously created template. Assert exact preview and independent clipboard paste-back. |
| Use the command palette to search and select prompts — Enter copies | The anonymous default action copies plain prompts and opens Fill Variables for variable prompts. Use an explicitly created variable prompt for the modal-opening scenario; retain keyboard activation, no-match and Escape assertions. Also assert exact clipboard output when exercising the plain-prompt copy contract. |
| Recover from empty search results | Replay the failure first. Distinguish library search from the command palette's independent input. Assert the intended input value, selected All Prompts scope, no-match state and restored library after clearing the same input. |
| Mobile search filters the prompt list | Use the saved 390×844 override. Replay both search surfaces, then assert query clearing restores the selected scope's full contents. Keep the mobile result separate from earlier desktop executions. |
| Complete local onboarding and save a variable prompt recipe | Enter Edit explicitly, clear Title, verify the field is empty before Save, and assert required-title validation. Cancel and verify the original record. Create a separate disposable draft, cancel, and verify it is absent. Preserve save/reload checks. |
| Create a prompt with the default template variables and persist metadata | Create the topic/tone fixture within this case, explicitly configure defaults and dropdown options, then verify metadata, preview, save and reload. Do not add test-only seed data to the application. |
| Mobile favorite and archive actions update views | Verify Favorites membership before archive. Verify Archived membership after archive, then restore and verify Favorites membership again. Archived items are excluded from active Favorites by design; verify the favorite flag survives restoration. |
| Use the command palette to search and select prompts — TS4 missing | Create a uniquely named TS4 variable prompt in this case before searching. Retain match, no-match, ArrowDown/Enter, fill-modal and Escape assertions. |
| Use PromptDock on mobile without losing access to primary actions | Keep the real 390×844 override and numeric viewport assertion. Ask runner support how to read innerWidth if unavailable. A narrow screenshot does not prove the numeric width or replace page-overflow checks. |
| Prevent unsafe placeholder names from breaking template rendering | Create constructor/__proto__ placeholders locally. Test missing-value rejection inside Fill Variables, where required-value validation belongs. Retain safe rendering and exact clipboard paste-back; inspector Copy has a separate unresolved-template contract. |
| Save a template prompt with metadata and copy the rendered output | Move the empty-required-value assertion into Fill Variables. Preserve persisted defaults, live preview, disabled Copy when empty and exact output after refilling. |
| Handle constructor and proto variable names safely | Apply the same explicit Fill Variables validation path. Retain no crash, ordinary-text treatment of both names, exact output and reload persistence. |
| Export and reimport prompts with duplicate handling and validation | Attach synthetic files under Test Files and use runner-supported native file chooser/download handling. Validate actual exported JSON, unchanged duplicate skip, deliberate overwrite of only the disposable fixture, malformed/schema rejection and recovery. A toast alone is insufficient. |
| Render a literal token with special characters and preserve it on reload | Start with unresolved body `Write {{topic}} in {{tone}}. Repeat: {{topic}}.`. Put the literal `$& <tag> 中文 😀 {{tone}}` in the topic value, then fill tone separately. Assert a single replacement pass, HTML safety, exact preview/copy and reload. Do not insert the already-expanded string into the template body. |
| Handle constructor and proto placeholder names safely — fixture absent | Create the regression prompt within this fresh case before searching. Preserve initial unresolved state, save/reload, preview and exact clipboard checks. |
| Create folders and tags, then filter and search prompts | Clearing search retains the selected tag/folder scope. Assert recovery within that scope, then explicitly select All Prompts and assert full-library recovery. Preserve membership/count checks. |
| Use a template prompt with default variables and copy output | Create the fixture, assert required-value rejection in Fill Variables and independently paste copied output into a canceled verification draft. Retain default/metadata persistence after reload. |
| Handle a long prompt with exact persistence and literal unsupported placeholder punctuation | Use the exact 12,288-byte fixture rather than repeated typing that timed out at 3,045 characters. Still edit a deliberate known change, save, reload and compare the full expected string. Preserve unsupported-placeholder punctuation and search-recovery assertions. |

### Earlier runner and merge plan (superseded)

- Retain all 107 cases and their intended assertions. No case is skipped, deleted, disabled or manually marked passed.
- Restore credits, investigate the three remaining focused failures, then execute file/long-content cases with the real attachments.
- Obtain a fresh full 107-case result on the latest PR head through the GitHub integration. Individual passes and aggregate latest-case totals do not replace the required PR check.
- Production is the selected target. Application code must be deployed with approval before TestSprite exercises it; previews alone do not publish production.
- The earlier plan kept PR #202 unmerged until its required TestSprite check passed and deferred Discord posting. The later approved October 24 submission superseded that posting sequence; the merge gate remains separate.


#### Focused reruns after fixture upload

All 21 previously blocked cases are running in execution `e6f25b36-3436-4edf-a88a-acf91afaea11`; all six remaining failed cases ran in `4ec13a85-b047-4a47-a986-f8216f0fcfc9`. The workspace displayed 45.8 credits before these launches, enough for focused investigation but not the full 107-case request. LIB-005, FAV-008 and TEM-001 now explicitly use real keyboard Select All/Backspace instead of an empty fill. The three-case plan update was saved and read back through the UI; parsed YAML matched the reviewed plan exactly. All 107 cases and all assertions remain. These in-progress subset runs do not replace the required full PR check.


#### Completed post-upload subsets

Execution e6f25b36-3436-4edf-a88a-acf91afaea11 completed **3 passed / 5 failed / 13 blocked**. Execution 4ec13a85-b047-4a47-a986-f8216f0fcfc9 completed **3 passed / 0 failed / 3 blocked**. All three clearing-input cases (TEM-001, LIB-005, FAV-008) now pass with explicit native keyboard actions. The remaining long cases are blocked: fixture text readout is truncated, and the runner attempted to upload into the From JSON textarea. A duplicate import case selected ts4-long.json rather than the required disposable duplicate pair and could not handle the native Settings Import picker. TestSprite AI was asked for read-only capability diagnosis; no additional runs were requested. Aggregate latest-case counts are 86 passed / 5 failed / 16 blocked, not a full PR result.
