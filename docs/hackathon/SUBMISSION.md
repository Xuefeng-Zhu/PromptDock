# PromptDock — TestSprite Hackathon Season 4 submission

Deadline supplied by Frank: **Thursday, October 22, 2026, 11:59 PM America/Los_Angeles**. Target a green TestSprite PR and ready Discord post by 9 PM PT. The official event page was verified in Chrome: https://www.testsprite.com/hackathon-s4. It confirms Oct 22, 11:59 PM PT for Project submissions, portal-generated live-URL suite, public README/repo, PR with TestSprite evidence, and Discord post. Final schedule is confirmed in Discord.

## Current status

- Live app: https://promptdock-95e31.web.app; download page only: https://xuefeng-zhu.github.io/PromptDock.
- [PR #201](https://github.com/Xuefeng-Zhu/PromptDock/pull/201) merged into `develop` as `82bcafe`; all seven checks passed, including browser and native tests.
- Authorized production deployment from `develop` succeeded: https://github.com/Xuefeng-Zhu/PromptDock/actions/runs/39863759026. The variable crash/literal regressions were verified fixed live. `main` was not moved.
- TestSprite generated and ran 107 cases: **57 passed, 21 failed, 29 blocked**. The suite is not green.
- GitHub App connected for PromptDock; PR deployment trigger active; portal Merge gate on. Actual PR result and GitHub required-check enforcement remain unverified.
- Frank chose the fixed production target for the deadline. PR preview deployment triggers testing, but production is tested; unmerged PR code is not validated.
- See [portal setup and triage](PORTAL_SETUP.md) for run/project links, evidence, and remaining submission gates.
- Keep the confirmed TestSprite account email in the Discord submission, not public repository documentation. Name: Frank Zhu (portal label Xuefeng-Zhu), Discord frankzhu94.
- No Discord post has been sent. Do not claim a green TestSprite PR or submission readiness until evidence exists.

## Finish in order

Follow the [submission gate in the setup report](PORTAL_SETUP.md#submission-gate). The local view-heading fix requires approval to publish and deploy. Preserve all intended assertions while correcting inaccurate generated steps and runner setup; do not skip failures to get green.

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

Local validation: lint/build passed; **1,032 Vitest tests passed, 13 skipped; 19 browser E2E tests passed**. Browser E2E used the previously installed temporary Chromium 153 executable because the pinned browser download was unavailable locally. No dependency or CI browser configuration was changed. Publication and deployment of this follow-up still require Frank's approval.

## Evidence still required

- Confirmed submission email/name.
- Corrected generated test setup, completed runner support, and a genuinely passing TestSprite run.
- Actual passing TestSprite PR comment/status and verified GitHub merge enforcement.
- Final README with passing evidence.
- Discord submission permalink and timestamp.
