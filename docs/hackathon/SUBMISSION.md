# PromptDock — TestSprite Hackathon Season 4 submission

Deadline supplied by Frank: **Thursday, October 22, 2026, 11:59 PM America/Los_Angeles**. Target a green TestSprite PR and ready Discord post by 9 PM PT. The official event page was verified in Chrome: https://www.testsprite.com/hackathon-s4. It confirms Oct 22, 11:59 PM PT for Project submissions, portal-generated live-URL suite, public README/repo, PR with TestSprite evidence, and Discord post. Final schedule is confirmed in Discord.

## Current status

- Live app: https://promptdock-95e31.web.app; download page only: https://xuefeng-zhu.github.io/PromptDock.
- PR #201 merged into develop as `82bcafe`; variable crash/literal regressions were fixed and verified live.
- [PR #202](https://github.com/Xuefeng-Zhu/PromptDock/pull/202) fixes library scope headings, tag display casing and search recovery. All seven normal checks passed. The PR is open and unmerged.
- Frank approved deploying tested PR head `a5ffbbf` before TestSprite passed. [Production deployment #32](https://github.com/Xuefeng-Zhu/PromptDock/actions/runs/39875519473) succeeded from that head; live heading/search verification passed. Main/develop were not moved for this deployment.
- The deployment automatically triggered [107 TestSprite cases on PR #202](https://www.testsprite.com/dashboard-v3/o/6167b83c-97c5-5141-8f17-545913fba1fa/projects/43ae1231-cf5e-4d9a-81ee-e93fdf6dcf28/execution/5f48ad5d-e15a-4ada-ae3e-0716154c2714). The updated-production run finished **70 passed, 20 failed, 17 blocked**. The preceding old-production PR run had 51 passed, 21 failed, 35 blocked.
- At least five corrected constructor/literal cases passed individual portal runs with exact clipboard verification; the other edited cases still need confirmation. All 13 mobile cases now have real 390×844 viewport overrides. This does not establish a green full suite.
- GitHub App connected for PromptDock; deployment trigger active; portal Merge gate on. A real PR TestSprite status/comment is verified. The GitHub develop rule currently requires only Build and test; adding TestSprite as a required check still needs Frank's approval.
- Frank chose the fixed production target. Unmerged PR code is tested only after an explicitly approved production deployment; normal PR preview deployments alone do not publish production.
- Test files are prepared in [fixtures](fixtures/README.md). Browser upload stalled; attachment and runner file/download handling remain blockers for import/export and exact long-content cases.
- No Discord post has been sent. Keep the confirmed submission email in the final Discord post, not the public repository.

## Finish in order

Finish fixture attachment and inaccurate setup/runner triage while preserving assertions; obtain a passing TestSprite status for PR #202; verify required-check enforcement; merge only after the passing gate; update README and submission evidence; Frank posts the final Discord submission before the deadline.

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
| 0:45–1:05 | Show genuine recorded red evidence: prototype-named variables produced [object Object] and crashed. If the red run is local/browser evidence, label it that way. |
| 1:05–1:30 | Show PR diff and regression assertion. Explain own-value lookup and literal single-pass replacement briefly. |
| 1:30–1:50 | Show actual TestSprite run and PR green comment/check. Open the integration settings to demonstrate Run on PRs and Blocking PRs only when verified enabled. |
| 1:50–2:00 | Close on live URL and repo. “Recipes stay reusable; automated tests protect the full path from editing to clipboard.” |

Never stage a fake TestSprite failure or imply production tested an unmerged branch. Record after deployment/URL decision and evidence are complete.

## X draft — Frank reviews and posts

Building PromptDock for @Test_Sprite Hackathon S4: a local-first prompt recipe manager with typed variables, live previews, and exact clipboard output. We found and fixed a real variable-rendering crash, with regression tests to keep it fixed.

Try it: https://promptdock-95e31.web.app

<Add passing PR/demo link and the verified TestSprite result before posting; adjust length.>

## Preview and production evidence

The preview workflow passed on PR #201 and published https://promptdock-95e31--pr-201-9z59hjy8.web.app. Production was subsequently deployed from tested `develop` commit `82bcafe` with Frank's approval. Only Hosting was deployed; Firebase rules/indexes and secret values were not changed. See [setup details](PORTAL_SETUP.md) for the chosen production target and portal limitations.

## Prepared follow-up fix

Branch: `fix/library-view-heading`, based on `develop`. The library heading now follows Favorites, Recent, Archived, folder, or tag navigation instead of always saying All Prompts. The defect was identified by the first TestSprite run. Five new component assertions failed before the change; a browser navigation regression covers the full sidebar path.

Local validation for the deployed search/tag/heading changes: lint/build passed; **1,034 Vitest tests passed, 13 skipped; 19 browser E2E tests passed**. Browser E2E used the previously installed temporary Chromium 153 executable because the pinned browser download was unavailable locally. No dependency or CI browser configuration was changed. The follow-up was published as PR #202 and deployed from tested head a5ffbbf with Frank's explicit approval. Its full TestSprite gate remains failing (70 passed, 20 failed, 17 blocked).

## Evidence still required

- Confirmed submission email/name.
- Corrected generated test setup, completed runner support, and a genuinely passing TestSprite run.
- Actual passing TestSprite PR comment/status and verified GitHub merge enforcement.
- Final README with passing evidence.
- Discord submission permalink and timestamp.


## Additional confirmed TestSprite defect

TEM-005 exposed stripped line breaks in textarea variable defaults. Local commit `ff4f3c6` fixes the default control and adds unit/browser regressions for exact multiline preservation through save, reload, preview and clipboard. Lint/build passed, 1,035 Vitest tests passed (13 existing skips), and all 20 browser tests passed. The commit is local only; approval is needed before publishing/deploying it. The current full TestSprite result remains 70 passed / 20 failed / 17 blocked.

Chrome's connected approval session is unavailable. Reconnect Chrome to resume portal edits, fixture attachment and approved workflow dispatch. See [remaining cases](REMAINING_CASES.md). No Discord post was sent.
