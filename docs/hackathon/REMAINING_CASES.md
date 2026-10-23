# Remaining TestSprite cases — action plan

## October 23 follow-up

- The organizer extended the deadline to **Monday, October 26, 11:59 PM Pacific**: [admin announcement](https://discord.com/channels/1227394620623949934/1556776381894099117/1563280349557956740). This supersedes the original October 22 date.
- Current workspace balance was verified at **280.4 credits** before the targeted probe, including 250 extra credits. The prior full-run credit error is historical. No purchase or credit request was made.
- PR #202 remains unmerged at remote head 1c8afa3. All normal CI checks passed; the TestSprite check still records the historical insufficient-credit refusal.
- Review found two additional UI defects: archived tag casing could override the visible sidebar label, and a retained query prevented header-click palette access outside the library. Local fix commit 08e2926 addresses both with two red-then-green component regressions and browser regressions for Settings/editor entry. Lint/build passed, **1,037 Vitest passed / 13 existing skips, and 22 browser E2E passed**. This follow-up is not pushed or deployed; Frank's per-push/deploy approval is still required. The temporary Chromium 153 launch override was removed; CI config and dependencies are unchanged.
- JSN-002 was refined as a targeted native-file-chooser probe using the disposable baseline and named modified fixture, preserving exact new-record/duplicate-preservation assertions. It finished Blocked: the runner reported no chooser and said /tmp/fixtures/ts4-modified.json was unavailable. The attachment remains a project Test File; do not confuse a guessed runner path with verified availability. The latest one-case portal edit is newer than the saved YAML snapshot and needs incorporation after resolving runner access. Preserve unchanged/repeat-import coverage when finalizing this probe into the suite. Local Playwright import tests pass through the native chooser event, so this report does not establish a broken application import handler. No additional full run was requested.
- Searching the actual hackathon-s4-submissions forum for PromptDock returned No matching posts. The account currently sees You do not have permission to post in this channel. Resolve participant-role/posting access with the organizer before submission. No Discord message was posted.

The earlier checkpoints below are historical.


Current checkpoint: October 22, 2026, about 10:10 PM Pacific. [PR #202](https://github.com/Xuefeng-Zhu/PromptDock/pull/202) remains open with a failing required TestSprite check. The latest complete PR run, `620b8fd6-556b-40eb-b96d-bcee225d8515`, finished **63 passed, 23 failed, 21 blocked**. Its [bot comment](https://github.com/Xuefeng-Zhu/PromptDock/pull/202#issuecomment-6357306595) is historical evidence, not a green result.

## Completed work and current blockers

- TEM-005 is fixed and deployed from `e6339b1`; its original multiline/default/clipboard/reload assertions passed in the full PR run. The fix has unit and browser regressions. Lint/build passed, 1,035 Vitest tests passed (13 existing skips), and all 20 browser E2E tests passed. All seven normal CI checks passed.
- Both saved YAML batches preserved all 107 IDs, titles, goals, priorities and assertion counts. The final saved plan is in [evidence](evidence/testsprite-plan-final-saved.yaml).
- The focused run `08336884-1d91-4e66-8b95-821e00ac09d1` finished **12 passed, 3 failed, 0 blocked**. TEM-001, LIB-005 and FAV-008 still failed on clearing-input behavior. These are not confirmed application defects: independent Chrome checks against production rejected an empty title, disabled modal Copy with a required value empty, and restored all seven existing recipes after clearing search. The runner log used fill actions for the title-clearing step. Retain these assertions and investigate the actual events/focus in TestSprite.
- Frank uploaded all eight synthetic files. Test Files shows each as **Ready**, including the malformed/schema fixtures, duplicate pair, exact 12,288-byte text and long JSON. Actual runner upload/download and exact-content assertions still need execution.
- Attempting **Run All 107** after the upload was rejected with **Insufficient credits**. No new full run was created. Replenish workspace credits before rerunning; no purchase or upgrade was made.
- The saved develop rule requires both **Build and test** and **TestSprite V3**. Do not bypass this gate or merge while it fails.

## Earlier triage plan

The table below records intended assertions and setup corrections, many now saved in the portal. It is not a list of newly reproduced defects or proof of passing execution.

## Case-level work in the portal

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

## Runner and merge requirements

- Retain all 107 cases and their intended assertions. No case is skipped, deleted, disabled or manually marked passed.
- Restore credits, investigate the three remaining focused failures, then execute file/long-content cases with the real attachments.
- Obtain a fresh full 107-case result on the latest PR head through the GitHub integration. Individual passes and aggregate latest-case totals do not replace the required PR check.
- Production is the selected target. Application code must be deployed with approval before TestSprite exercises it; previews alone do not publish production.
- Keep PR #202 unmerged until its required TestSprite check passes. Frank posts the final Discord submission; no post has been sent.


### Focused reruns after fixture upload

All 21 previously blocked cases are running in execution `e6f25b36-3436-4edf-a88a-acf91afaea11`; all six remaining failed cases ran in `4ec13a85-b047-4a47-a986-f8216f0fcfc9`. The workspace displayed 45.8 credits before these launches, enough for focused investigation but not the full 107-case request. LIB-005, FAV-008 and TEM-001 now explicitly use real keyboard Select All/Backspace instead of an empty fill. The three-case plan update was saved and read back through the UI; parsed YAML matched the reviewed plan exactly. All 107 cases and all assertions remain. These in-progress subset runs do not replace the required full PR check.


### Completed post-upload subsets

Execution e6f25b36-3436-4edf-a88a-acf91afaea11 completed **3 passed / 5 failed / 13 blocked**. Execution 4ec13a85-b047-4a47-a986-f8216f0fcfc9 completed **3 passed / 0 failed / 3 blocked**. All three clearing-input cases (TEM-001, LIB-005, FAV-008) now pass with explicit native keyboard actions. The remaining long cases are blocked: fixture text readout is truncated, and the runner attempted to upload into the From JSON textarea. A duplicate import case selected ts4-long.json rather than the required disposable duplicate pair and could not handle the native Settings Import picker. TestSprite AI was asked for read-only capability diagnosis; no additional runs were requested. Aggregate latest-case counts are 86 passed / 5 failed / 16 blocked, not a full PR result.
