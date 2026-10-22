# Live smoke report — 2026-10-22

Target: https://promptdock-95e31.web.app (Chrome, anonymous/local mode).
Local fix branch: `testsprite-season4`, based on `develop` at `bf57f64`.
Production and develop differ; a live observation is not proof about the branch, and a local test is not proof that production has been fixed.

## Confirmed defects

### Prototype-named variables crash execution

1. Create a prompt with body `Use {{constructor}} and {{__proto__}}.`; save.
2. Open Cmd/Ctrl+K, search the prompt, and select it.
3. The __proto__ input incorrectly starts as `[object Object]`.
4. Enter `Ada` for constructor.
5. The app error boundary displays `Something went wrong` and `(t[e] ?? "").trim is not a function`.

Expected: empty inputs until filled, unresolved placeholders, Copy disabled until all values exist, then exact literal rendering and clipboard output. Reload recovers the library.

Root cause: ordinary object maps read inherited properties; assigning `__proto__` into an empty ordinary object does not create a normal string entry. The prepared fix uses own-string lookups and `Object.fromEntries` for initial variable values, across editor, inspector and execution.

Evidence: [crash screenshot](evidence/live-prototype-crash.jpg). New utility/component tests were run before fixing production code: both failed. See [local red test log](evidence/local-regression-red.txt). This is local/browser-discovered evidence, not a TestSprite result.

### Editor preview corrupts literal replacement values

1. New prompt body: `A {{name}} B {{tone}}.`.
2. Set name preview value to `$& {{tone}}`, and tone to `Friendly`.
3. Actual editor preview: `A {{name}} Friendly B Friendly.`.
4. Expected: `A $& {{tone}} B Friendly.`.

Root cause: sequential `replaceAll` treats `$&` as replacement syntax and recursively processes placeholders inside values. The fix routes the editor through the same single-pass callback renderer used for execution.

Evidence: [editor screenshot](evidence/live-editor-literal-bug.jpg). Hook regression covers literal dollar signs, placeholder-like text and Unicode.

## Observed live coverage

| Scenario | Result and evidence |
|---|---|
| Anonymous load | Passed: library with six seeded prompts, Local indicator, no login required. Existing browser local state meant clean first-run onboarding was not re-tested live. |
| Create/edit/reload | Passed: TS4 Smoke 1022, edited title, exact template and metadata persisted on reload. |
| Duplicate | Passed: immediate `Copy of TS4 Smoke 1022 Edited`; source remained. Production does not show develop's destination dialog. |
| Favorite | Passed: favorite control and sidebar count updated. |
| Archive/restore | Passed: original excluded from active list, found under Archived, restored to active list. Archived view still labels its heading All Prompts; logged as a labeling issue, outside this fix. |
| Folder/tag | Passed: created TS4 Folder and ts4-smoke, saved assignment, filters each showed the matching prompt. |
| Search/empty | Passed: matching query returned original/copy; impossible query showed No prompts found; clearing restored library. True zero-record library was not tested against existing browser data. |
| Command palette | Passed: Cmd/Ctrl+K, search and selection opened fill modal. |
| Defaults/dropdown | Passed: Launch/Friendly defaults survived save/reload and Professional selection updated preview. |
| Special-character execution | Passed: exact preview and clipboard preserved `$& <tag> 中文 😀 {{tone}}`, without recursive substitution. Editor has the separate confirmed defect above. |
| Clipboard | Passed: read back exact rendered output through browser clipboard API; modal dismissed. |
| Long prompt | Passed: ~12 KB body (300 repeated multilingual lines) saved/reloaded, inspector retained final `END {{topic}}`. |
| Prototype names | Failed as described above; fix prepared locally. |
| Export/import/duplicates/bad JSON | Live verification blocked: Export invoked a native save dialog and the browser request timed out. Cancelled dialog; no successful export/import claimed. Existing local Playwright coverage exercises these paths. |
| Mobile | Live verification blocked: requested 390×844 override, but read-back innerWidth and screenshot remained 1536 wide. Override reset. Existing local Playwright responsive scenario remains the fallback verification. |
| Sync/workspaces | Excluded; no Firebase test account supplied. |

Test-only prompts and folder were left in this browser's local library. No pre-existing prompts were deleted, overwritten or exported successfully. No Firebase/repo settings, deployment or remote code were changed.

## Local validation of the prepared branch

- `npm run lint`: passed.
- `npm run build`: passed (TypeScript + Vite; existing bundle-size warning).
- `npm test`: 104 files passed, 1 skipped; 1,027 tests passed, 13 skipped.
- `npm run test:e2e -- --config=playwright.local.config.ts --workers=2`: 18 passed (20.7 seconds), including prototype-variable regression, exact clipboard content, JSON imports/duplicates/bad JSON, and responsive navigation.
- The default E2E launch was blocked by the absent pinned browser; the normal browser download returned an invalid/truncated ZIP. The successful run used temporary npm package `@sparticuz/chromium@153.0.0` (Chromium 153.0.8010.0), system FFmpeg 6.1.1, and a temporary config differing only in executablePath and `--disable-dev-shm-usage`. All assertions, test selection, video/trace settings and original webServer configuration remained active. The temporary config is removed and not committed; dependencies, lockfile and CI configuration are unchanged. CI should verify with its normal pinned Playwright browser.
- Optional Firebase is unconfigured locally; the app logs its missing configuration while anonymous local flows continue. No Firebase credentials were used.
- These passing local checks do not prove that production is fixed or replace the required TestSprite PR check.
