# PromptDock — TestSprite 3.0 suite scope

Paste the following scope into the TestSprite portal when generating the suite.

## Target and boundaries

Test the LIVE app at https://promptdock-95e31.web.app, anonymously in local mode.
Do not use localhost or https://xuefeng-zhu.github.io/PromptDock (the latter is the marketing/download page).
Choose Start locally if onboarding appears. Use a fresh browser context per independent scenario and unique TS4-prefixed test data. Never delete pre-existing user data. Do not sign in or enable sync.

Use UI actions with meaningful assertions on saved content, exact rendered output, counts, membership, validation messages, and persistence. A toast alone is insufficient proof of success. Capture screenshots, traces, console errors, and expected versus actual results on failure. Do not skip or weaken a failing assertion.

## Required anonymous scenarios

1. **First use and persistence:** Reach the seeded library without login. Create a title, description and body, save, reload, and assert exact content and no repeated onboarding. Validate missing title/body and recover by correcting the fields. Test an unsaved draft and intentional cancellation.
2. **Lifecycle:** Create a unique prompt, edit title/body, save and reload; favorite/unfavorite and assert Favorites membership; duplicate and verify distinct records with identical content and unchanged source; archive and verify exclusion from active search/folder/tag/Favorites, then restore and verify return. Never permanently delete pre-existing data. Live production may duplicate immediately; develop may show a workspace selection dialog.
3. **Organization:** Create a folder and tag through the prompt editor; assign them, assert folder/tag filtered membership and counts; edit/remove the tag; switch back to All Prompts. Search title, description and tag; assert both matching inclusion and unrelated exclusion. Exercise list/grid, sorting, filters, and no-results recovery.
4. **Command palette:** Open with Cmd/Ctrl+K, search, assert correct results and no-results state, use arrow keys/Enter to select, and Escape to close. On current production the header search filters the library; newer develop also opens the palette on click. Test keyboard behavior rather than assuming the two deployments are identical.
5. **Variables:** Create `Write {{topic}} in {{tone}}. Repeat: {{topic}}.`. Set topic default Launch; make tone a dropdown with Friendly/Professional and default Friendly. Reject an invalid dropdown default. Save/reload; assert defaults and dropdown metadata persist. Open the fill modal from the command palette. Verify exactly one topic input despite the repeated placeholder. Change topic and tone and assert the exact live preview. Clear a required value and assert Copy disabled, then fill it and assert exact clipboard content and successful modal dismissal. Include textarea/multiline values.
6. **Literal values:** Enter `$& <tag> 中文 😀 {{tone}}` as the topic value and Professional as tone. Expected output: `Write $& <tag> 中文 😀 {{tone}} in Professional. Repeat: $& <tag> 中文 😀 {{tone}}.`. Value text must not be interpreted as HTML, replacement instructions, or recursively expanded placeholders. Assert the same literal behavior in the editor preview, inspector preview, and copied output.
7. **Crash regression:** Create `Use {{constructor}} and {{__proto__}}.`. Both inputs must initially be empty, both placeholders remain visible, and Copy is disabled. Save/reload and inspect; open fill modal, fill constructor=Ada, then __proto__=literal. There must be no error boundary or console TypeError; preview and clipboard must equal `Use Ada and literal.`. Defaults for these names must also work. Current production is known to fail this scenario before the prepared fix is deployed.
8. **JSON export/import:** Export active prompts, parse the downloaded JSON and assert version, title, body, tags and variable metadata; archived records must be excluded. Import that export and explicitly skip duplicates; assert no count or content change. Reimport a modified duplicate and choose overwrite; assert one existing record updated with no extra duplicate. Import a new record and assert persistence after reload. Import malformed JSON and an invalid schema; assert a useful error, no crash, no partial mutation, and a later valid import succeeds. Use disposable test data and restore any overwritten test record. Export may use a native save picker; handle the picker or report an automation limitation, never mark an unfinished export as passed.
9. **Edge cases:** Test a long body (~12 KB), multiline text, quotes, braces, dollar signs, Unicode and emoji; save/reload and compare exact text. Unsupported placeholder names with punctuation must remain literal rather than silently becoming executable variables. Test empty search and empty Favorites/Archived views in a clean context, then recover through the UI.
10. **Mobile:** At 390×844 (verify actual innerWidth), check navigation drawer, Settings/back/Escape, create/edit, scrolling of long content, fill modal controls/preview/copy and dismissal. Assert no inaccessible primary actions or unintended horizontal overflow. Repeat main authoring/execution flows at desktop width.

## Optional — requires Frank's dedicated Firebase test accounts

Auth, local-to-cloud migration, sync/reload/offline recovery, workspace switching, owner/editor/viewer permissions, invites and conflict review are OUT OF SCOPE for the anonymous submission suite. Add only after Frank provides dedicated accounts and approves cloud test data. Desktop global hotkey, OS paste and Tauri windows are also outside the web suite.

## GitHub automation setup (Frank)

- Install/connect the TestSprite GitHub App for Xuefeng-Zhu/PromptDock.
- Confirm base branch with Frank; GitHub's default branch was verified as develop on 2026-10-22.
- Enable Run on Pull Requests and Blocking PRs. Verify any required GitHub merge enforcement in repository settings with Frank's approval.
- Generate and run the portal suite against the live URL, then attach it to the repository/project.
- Save the suite/run link and PR comment/status as evidence. Local Playwright tests are supplemental and do not replace the portal requirement.
- Require at least one passing TestSprite PR comment/status before submitting. Preserve genuine red evidence when available; do not claim TestSprite caught a bug unless its own run demonstrates that.

## Deployment decision still required

Production deploys only on push to main. A fixed production URL checks deployed code, not unmerged develop PR code. Choose with Frank:

A. Use the production URL for deadline submission and disclose this limitation. Current portal docs require a deployment-ready trigger event; confirm that a fixed-production target can be wired to PR events before choosing this option. A live regression remains red until a separately approved production deployment includes the fix.
B. Add Firebase Hosting PR preview channels only after explicit approval. Current TestSprite documentation supports per-PR target URL patterns and deployment-ready event detection; confirm the actual Firebase preview URL/event in the portal. The production workflow already references a service-account secret; its existence, permissions and preview suitability are unverified. Never copy credentials into source files.

## Current portal documentation update

Verified in Chrome on 2026-10-22: https://docs.testsprite.com/web-portal/integrations/github-integration.
The current UI uses Workspace Settings → Connections → Integrations → GitHub, then the project's GitHub Action tab → Add Trigger. PR setup uses a sample PR, Detect Events, a deployment-ready event, target URL pattern, Send Test Event, and Create Trigger. Enable Block PR until tests pass. Documented patterns support `{pr}`, `{branch}`, `{branch-slug}`, `{sha}` and `{short-sha}`. PR-open alone is not the documented deployment-ready trigger. The hackathon page still describes the older base-branch/Run on PRs/Blocking PRs controls; use the controls actually present and verify evidence. Firebase-specific preview discovery has not yet been tested.
