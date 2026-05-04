# ADR 0001: Use `develop` as the integration branch

## Status

Accepted

## Context

PromptDock deploys production web builds from `main` and runs desktop release
workflows from release tags. Day-to-day feature work should not share the same
branch as production release state.

## Decision

Use `develop` as the default integration branch. Regular feature, fix, and
documentation pull requests target `develop`. Keep `main` release-only. When
cutting a release, open a release pull request from `develop` into `main`,
complete the release checklist, merge it, then create the `vX.Y.Z` tag from
`main`.

## Consequences

- New pull requests default to the branch that collects unreleased work.
- Production Firebase Hosting continues to deploy only after changes reach
  `main`.
- Release PRs become the explicit gate between development and production.
