# ADR 0002: Add repository hygiene automation

## Status

Accepted

## Context

PromptDock spans React, Tauri, Rust, Firebase, local storage, and desktop OS
capabilities. Small process checks help keep changes reviewable without adding
heavy ceremony.

## Decision

Use pull request templates, a release pull request template, Dependabot updates,
GitHub default CodeQL analysis, release-note categories, and CODEOWNERS. Keep
the existing `Build and test` workflow as the required merge check until new
automation has passed consistently.

## Consequences

- Pull requests carry clearer test, runtime, and release-risk notes.
- Dependency updates are routine and target `develop`.
- Security analysis runs through GitHub default CodeQL setup.
- The required branch protection check remains stable while new automation
  proves itself.
