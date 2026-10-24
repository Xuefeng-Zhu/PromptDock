# Failed-case corrections

The saved portal plan now corrects only ONB-002, FLT-011 and FAV-014. Fresh full-plan readback matches the candidate semantically. All 107 case identities/order/metadata and all 217 original assertion strings remain intact. These changes use the already deployed 22647ec build; no app deployment is required.

- ONB-002 explicitly observes the original in Favorites before archive, excludes that exact original from All Prompts before restore, and distinguishes it from the duplicate.
- FLT-011 verifies repeated-token metadata and exact multiline defaults, leaves the unchanged saved edit through the existing Library control, then reloads and verifies unchanged values. The original assertion remains verbatim; its Cancel means leave without saving, using the actual saved-editor navigation control.
- FAV-014 uses the complete attached 12,288-byte file and independently expected SHA-256 before save and after reload. Empty searches are entered and cleared separately in Favorites and Archived, then the full active baseline is restored.

Independent production Playwright verification passed for all three corrected workflows. Also passed: actual downloaded JSON reimported twice with full metadata equality, and a mobile complete-text/reload/clipboard/export workflow measuring innerWidth = document scrollWidth = 390. This is independent browser evidence, not a TestSprite portal verdict. The first FLT-011 verification counted native select options along with prompt cards (9 instead of 5); scoping the count to the Prompt list corrected the test selector, after which that workflow passed. App code was unchanged.

Validation logs: /tmp/promptdock-failed-case-production.log (four passes, one test-selector failure) and /tmp/promptdock-failed-case-production-flt.log (corrected FLT-011 passes). ESLint and TypeScript pass. Relevant repository coverage is e2e/failed-case-regressions.spec.ts and FAV-014 in e2e/long-text-integrity.spec.ts.

FAV-011 still needs TestSprite to obtain and reimport the actual exported file. TEM-010 still needs an actual numeric viewport measurement in that runner. The support conversation remains Waiting for a teammate with no human response. Neither case was weakened or rerun. No new credits spent, push, deployment, trigger change, support message, fixture deletion, or plan upgrade occurred. Current portal results remain 88 Passed / 5 Failed / 14 Blocked pending approved focused reruns.
