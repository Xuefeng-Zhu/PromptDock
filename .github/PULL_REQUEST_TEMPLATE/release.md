## Release Summary

Release version:

Source branch: `develop`
Target branch: `main`

## Release Gate

- [ ] Release PR is from `develop` into `main`.
- [ ] `Build and test` is green.
- [ ] `npm run lint` passes.
- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] Tauri desktop smoke test completed on target OSes, or skipped with rationale.
- [ ] Firebase emulator sync flow checked if sync changed.
- [ ] Firestore rules/indexes deployed before enabling production sync changes.
- [ ] Version aligned across `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, and in-app About text.
- [ ] Release notes reviewed with `.github/release.yml` categories.

## After Merge

- [ ] Create a `vX.Y.Z` tag from `main`.
- [ ] Confirm desktop release workflows complete or are intentionally skipped.
- [ ] Confirm Firebase Hosting deployment completes after the `main` push.

## Notes
