# TestSprite synthetic fixtures

Attach these files in PromptDock project Test Files. Each test uses a fresh anonymous context. These files contain synthetic data only.

- ts4-valid.json creates TS4 Fixture Recipe. Reimport unchanged and skip the duplicate; count/content must stay unchanged.
- ts4-modified.json overwrites that disposable fixture and creates TS4 Imported New. Never overwrite seeded/user prompts. Verify both exact bodies and reload persistence.
- ts4-bad-json.json is malformed JSON; rejection must leave the library unchanged.
- ts4-bad-schema.json lacks a required prompt body; schema rejection must leave data unchanged, then valid import must recover.
- ts4-exact-12k.txt is an exact 12,288-byte UTF-8 body, including quotes, braces, dollar signs, Chinese, emoji and an unsupported placeholder. Read this file as the source of truth; do not approximate it by manual repetition.
- ts4-long.json imports the same exact long body when fixture import is needed for setup. Long-editor cases must still open Edit, make a deliberate known change, save, reload and compare the exact expected content.
- manifest.json records byte length, UTF-16 units shown by JavaScript character counters and SHA-256 values. Do not claim exact equality from a screenshot or toast alone.
