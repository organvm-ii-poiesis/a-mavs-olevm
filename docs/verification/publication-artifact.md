# Publication artifact and parked AI activation

Refs #94. Public AI activation is preserved in [parked successor #144](https://github.com/organvm-ii-poiesis/a-mavs-olevm/issues/144). The recovered intention is an honest public release of the existing site, including its four creative exhibits. The old workflow tolerated exhibit failures, uploaded outputs that deployment never downloaded, and published the repository root. Excluding a handful of names did not protect source artwork, archived ZIPs, tooling, or nested repository metadata.

## Implemented boundary

- `npm run test:publication` verifies artifact boundaries using temporary fixtures and the actual staging source.
- `npm run build:exhibits` uses committed lockfiles and `npm ci` for all four projects on Node 24. Provider environment variables and local environment files are refused. Exhibit inputs must be tracked at the source revision; untracked or locally ignored public files and symlinks cannot acquire false build provenance. Builds use `--base=./` so compiled entries resolve at their existing nested URLs.
- Runtime-loaded audio-orb EXR and both synthwave example HTML files are explicitly included. Vite does not discover synthwave's string-based `fetch()` inputs; the initial real browser probe found a 404 for `dist/init/gemini3.html`.
- `npm run stage:public` requires exact committed public source bytes and complete, matching build receipts. Raw Git blob identities preserve original line endings: existing text attributes otherwise misreport byte-identical historical SVGs as dirty. Real content changes are rejected. Only reviewed public roots/extensions and named attribution files enter `_site`. Source PSD/EPS/Sketch/ZIP/TypeScript, package manifests, tests, templates, documentation, hidden directories and repository metadata remain in Git. All four `absorb-alchemize/<name>/dist/index.html` routes are mandatory. Missing sparse checkout files fail instead of becoming silently omitted assets.
- Symlinks, source contamination inside `dist`, missing entries, stale receipts and known provider-key patterns fail before staging. SHA-256 digests and lengths bind every deployed file to the candidate; lockfile digests and source revision record its origin. The credential checks are bounded safeguards, not a general secret scanner.
- CI uploads only `_site`, fails on a missing artifact, downloads the artifact for the same source revision, and verifies every file digest before deployment. Deployment still depends on every existing check. No job's success is substituted for another check, and no manually disabled workflow is bypassed.

`publication-needs.json` deliberately blocks actual publication. Artifact availability proves packaging; it does not prove that AI functionality is safe or usable. Changing this gate requires review and the evidence listed in that file.

## Evidence and limits (2026-09-13)

All four real projects resolved dependencies and built with Node 24.19.0 and Vite 8.3.0 without provider credentials. Separate `npm audit --json` calls for each of the four newly locked dependency graphs reported zero known vulnerabilities on this date. This says nothing about the root dependency graph, provider authorization, generated code safety, or future advisories.

Native Chromium probes loaded each built exhibit at its actual nested URL without modifying the DOM or injecting provider keys. Audio-orb and p5js-playground raised `An API Key must be set when running in a browser` during initialization and rendered no readable body text. Ink Studio rendered its controls; this does not establish working voice control or local painting behavior. Synthwave rendered its briefing, but its initial build omitted the runtime-fetched example games; packaging now explicitly retains those inputs. AI generation remains unverified.

The probe environment could not load optional Google Fonts or Tailwind CDN resources. Those network failures are recorded separately from the deterministic provider-key errors. The retained synthwave example also imports Three.js modules from unpkg; the probe environment could not retrieve those modules, so example gameplay remains unverified. No TLS protections were disabled. All local bundle requests succeeded; the original synthwave example-file 404 is identified above.

The Vite configurations still express a browser key-injection model through `process.env.API_KEY` and `process.env.GEMINI_API_KEY`; p5js reads `globalThis.process.env.GEMINI_API_KEY`. Successful builds do not justify supplying those keys. This PR does not rewrite the apps into a new backend or silently drop them from the release. Public activation is parked with all source intact.

Local staging tests use small fixtures. A complete production-media checkout is required for a full-site artifact; a sparse local tree is explicitly insufficient. The default-branch CI, deployed URL, and other existing verification suites are not claimed green by this repair.

## Finish line for the parked intention

1. Choose and implement a server credential boundary appropriate to each existing exhibit. Durable provider keys must never enter public bundles or browser storage. Live audio requires suitable short-lived session authorization; generated-code endpoints need explicit authorization and abuse controls.
2. Preserve all four creative functions and existing URLs. Verify readable entry states without credentials, denied microphone permission, provider outages, and successful authorized interactions.
3. Test actual ink painting, synthwave example games, and generated-code execution boundaries. Keep the unique voice, visual, fluid simulation, sketch-generation, and game-remix intentions.
4. Record the runtime evidence on #94 and its successor, review `publication-needs.json`, then require a green full CI and verified candidate before publishing.

Close/delete allowed: **NO**. The implementation is preserved and the activation intention remains unfinished. No source, branch, issue, or PR is deleted by this repair.
