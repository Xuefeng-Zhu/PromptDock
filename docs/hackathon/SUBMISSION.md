# PromptDock — TestSprite Hackathon Season 4 submission

Deadline supplied by Frank: **Thursday, October 22, 2026, 11:59 PM America/Los_Angeles**. Target a green TestSprite PR and ready Discord post by 9 PM PT. The official event page was verified in Chrome: https://www.testsprite.com/hackathon-s4. It confirms Oct 22, 11:59 PM PT for Project submissions, portal-generated live-URL suite, public README/repo, PR with TestSprite evidence, and Discord post. Final schedule is confirmed in Discord.

## Current status — October 22, about 10:10 PM Pacific

- Live app: https://promptdock-95e31.web.app. GitHub Pages is the marketing/download page only.
- PR #201 merged into develop as `82bcafe`; constructor/proto and literal substitution regressions were fixed and verified live.
- [PR #202](https://github.com/Xuefeng-Zhu/PromptDock/pull/202) fixes scope headings, tag casing, nonempty search editing and stripped multiline defaults. All seven normal CI checks passed. Lint/build passed, 1,035 Vitest tests passed (13 existing skips), and all 20 browser E2E tests passed.
- Production [deployment #33](https://github.com/Xuefeng-Zhu/PromptDock/actions/runs/39899769500) succeeded from `e6339b1` with Frank's approval. Neither main nor develop moved. Independent live multiline save/reload/preview/clipboard checks passed.
- TEM-005 passed in the resulting full TestSprite PR run, proving a real red-then-green regression. The **full** result remains **63 passed, 23 failed, 21 blocked**. [PR bot comment](https://github.com/Xuefeng-Zhu/PromptDock/pull/202#issuecomment-6357306595).
- The saved develop rule requires **Build and test** from GitHub Actions and **TestSprite V3** from TestSprite. PR #202 is open and unmerged; do not bypass the failing check.
- All 107 cases remain in the suite. Both reviewed YAML updates preserved case IDs, goals, priorities and assertion counts. All 13 mobile cases have 390×844 viewport overrides. Sync/workspace/desktop-native flows are excluded from this anonymous suite.
- The focused corrected-plan run `08336884-1d91-4e66-8b95-821e00ac09d1` finished **12 passed, 3 failed**. The three clearing-input failures did not reproduce in independent live Chrome checks; runner event/focus behavior still needs investigation. These results do not establish a green PR.
- Frank uploaded all eight synthetic fixtures; Test Files shows each as Ready. Actual export/import and long-content assertions still need rerunning with those attachments.
- **Immediate blocker:** Run All 107 was rejected with **Insufficient credits**. No new full run was created, and no purchase or upgrade was made.
- Frank chose the fixed production URL for the deadline. TestSprite uses successful eligible PR preview deployment events as its trigger but tests production. New application code must be deployed with approval before it is exercised.
- No Discord submission has been posted. Keep the confirmed submission email out of the public repository.

## Finish in order

Restore TestSprite workspace credits; investigate the clearing-input execution mismatch and run file/long-content cases; get a passing full 107-case TestSprite check on the current PR head; merge after required checks pass; Frank posts the final submission before 11:59 PM Pacific. Do not present an individual regression pass as a green suite.

## Discord draft — Frank posts after a green TestSprite result

PromptDock — a local-first prompt recipe manager for reusable AI workflows.

PR: <passing TestSprite PR link — required>
Live URL: https://promptdock-95e31.web.app
Repo: https://github.com/Xuefeng-Zhu/PromptDock
TestSprite account: <confirmed account email> — Frank Zhu
Demo: <optional video URL; omit if unavailable>

Create and organize templates, fill typed variables with defaults and live previews, then copy the exact result. The anonymous web experience works without login.

Test coverage: prompt lifecycle, folders/tags, search and command palette, variable rendering and clipboard, JSON import/export and duplicate handling, persistence and responsive navigation. <Replace this sentence with the actual generated suite's executed coverage and result.>

<Only after evidence exists: TestSprite runs on every PR with Blocking PRs enabled.>
<Only if its run proves this: The regression first failed in TestSprite, then passed after the fix.>

## Two-minute demo script

| Time | Visual and narration |
|---|---|
| 0:00–0:20 | Open live app. “PromptDock stores reusable prompt recipes locally, with no account required.” Create/find a recipe, show folder/tag/favorite. |
| 0:20–0:45 | Cmd/Ctrl+K → choose a recipe → show defaults/dropdown, update values, compare preview and exact clipboard text. |
| 0:45–1:05 | Show TEM-005 red evidence from TestSprite: a multiline default became LaunchCampaign. Keep the run ID and actual failure visible. |
| 1:05–1:30 | Show the dedicated multiline-default fix commit and its regression test. Explain that textarea variables now use a textarea for saved defaults, preserving real newlines. |
| 1:30–1:50 | Show the actual TEM-005 passing rerun. Show the full PR green comment/check only after all cases genuinely pass; then show the saved GitHub required-check rule. Do not present a single passing case as a green full suite. |
| 1:50–2:00 | Close on live URL and repo. “Recipes stay reusable; automated tests protect the full path from editing to clipboard.” |

Never stage a fake TestSprite failure or imply production tested an unmerged branch. Record after deployment/URL decision and evidence are complete.

## X draft — Frank reviews and posts

Building PromptDock for @Test_Sprite Hackathon S4: a local-first prompt recipe manager with typed variables, live previews, and exact clipboard output. TestSprite caught a multiline-default bug; we fixed it with unit and browser regressions, and its portal case now passes.

Try it: https://promptdock-95e31.web.app

<Add passing PR/demo link and the verified TestSprite result before posting; adjust length.>

## Evidence

- [Production deployment for the multiline fix](https://github.com/Xuefeng-Zhu/PromptDock/actions/runs/39899769500).
- [TEM-005 passing TestSprite result](https://www.testsprite.com/dashboard-v3/o/6167b83c-97c5-5141-8f17-545913fba1fa/projects/43ae1231-cf5e-4d9a-81ee-e93fdf6dcf28/execution/620b8fd6-556b-40eb-b96d-bcee225d8515?test=85e13acc-2b21-46f0-b3c8-f43d43dfcb54).
- [Saved GitHub branch-protection rule](https://github.com/Xuefeng-Zhu/PromptDock/settings/branch_protection_rules/76447933).
- [Final saved 107-case test plan](evidence/testsprite-plan-final-saved.yaml).
- [Setup history](PORTAL_SETUP.md) and [remaining cases](REMAINING_CASES.md).

Still required: a passing full PR status, final merged PR link, and Discord submission permalink/timestamp. The optional demo can be omitted to meet the deadline.


### Focused reruns after fixture upload

All 21 previously blocked cases are running in execution `e6f25b36-3436-4edf-a88a-acf91afaea11`; all six remaining failed cases ran in `4ec13a85-b047-4a47-a986-f8216f0fcfc9`. The workspace displayed 45.8 credits before these launches, enough for focused investigation but not the full 107-case request. LIB-005, FAV-008 and TEM-001 now explicitly use real keyboard Select All/Backspace instead of an empty fill. The three-case plan update was saved and read back through the UI; parsed YAML matched the reviewed plan exactly. All 107 cases and all assertions remain. These in-progress subset runs do not replace the required full PR check.


### Completed post-upload subsets

Execution e6f25b36-3436-4edf-a88a-acf91afaea11 completed **3 passed / 5 failed / 13 blocked**. Execution 4ec13a85-b047-4a47-a986-f8216f0fcfc9 completed **3 passed / 0 failed / 3 blocked**. All three clearing-input cases (TEM-001, LIB-005, FAV-008) now pass with explicit native keyboard actions. The remaining long cases are blocked: fixture text readout is truncated, and the runner attempted to upload into the From JSON textarea. A duplicate import case selected ts4-long.json rather than the required disposable duplicate pair and could not handle the native Settings Import picker. TestSprite AI was asked for read-only capability diagnosis; no additional runs were requested. Aggregate latest-case counts are 86 passed / 5 failed / 16 blocked, not a full PR result.
