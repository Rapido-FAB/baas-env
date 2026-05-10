---
"@rapido-fab/baas-env": patch
---

Add CI and release workflows, changesets, and GitHub Packages publishing

- Add `.github/workflows/ci.yml` (build, test, changeset enforcement, artifact upload), adapted from baas-core
- Add `.github/workflows/release.yml` (changeset version, build, publish to GitHub Packages, tag, GitHub Release), adapted from baas-core
- Add `.changeset/config.json` with `@rapido-fab` scope and restricted access
- Add `.npmrc` pointing `@rapido-fab` scope at GitHub Packages
- Add `publishConfig.access: "restricted"` and `changeset` script to package.json
- Document the new install + release flow in README
