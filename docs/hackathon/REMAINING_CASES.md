# Remaining TestSprite cases — action plan

Source: [PR #202 TestSprite report](https://github.com/Xuefeng-Zhu/PromptDock/pull/202#issuecomment-6354058364), execution `5f48ad5d-e15a-4ada-ae3e-0716154c2714`: **70 passed, 20 failed, 17 blocked**. This document proposes corrections and investigations; it does not record completed portal changes or a passing rerun.

## Reproduced application defect

**Render variable defaults, validation, and copied output for a topic template (TEM-005).** Selecting Textarea still left its default-value editor as a single-line input. The browser removed newlines before the value reached state. Local commit `ff4f3c6` uses a textarea and adds a red-then-green unit regression plus a browser regression covering exact values through save, reload, preview, fill modal and clipboard. Lint/build passed, 1,035 unit tests passed (13 pre-existing skips), and all 20 browser tests passed. Publish/deploy with approval, then rerun this unchanged multiline assertion against production.

## Case-level work after reconnecting the portal

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

- Preserve all 107 cases and their intended assertions. No case is skipped, deleted or marked passed by this plan.
- Review the remaining 17 blocked cases individually after their setup dependencies and file handling are available.
- Inspect the portal's “Always use planned steps” setting before rerunning edited cases; ensure the runner executes the saved plan rather than replaying stale actions. Do not discard evidence from the original failing execution.
- Production is the selected TestSprite target. A new PR commit is not tested until that exact code is deployed with Frank's approval. Normal CI and preview success do not establish a passing production TestSprite result.
- Add TestSprite as a required GitHub check only with Frank's explicit approval. The observed develop rule currently requires only Build and test. Keep PR #202 unmerged while TestSprite fails.
- Chrome's connected approval session must be restored to apply these portal steps. For fixture upload, the Chrome extension may also require the user to enable Allow access to file URLs, as described in the extension's official upload guidance. No successful fixture attachment is claimed.
