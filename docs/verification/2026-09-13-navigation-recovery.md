# Navigation and lazy-loading recovery

Observed baseline: default commit `477d6230` on 2026-09-13. The landing page rendered, but a native Enter-site click changed the hash while leaving the menu hidden. Velocity 2.0.6 logged that `fadeOut` was not a recognized action. Existing E2E helpers had concealed this by directly setting display/classes; the older Page unit suite tests a copied implementation.

## Recovered intention and repair

The original hash navigation must remain usable across links, keyboard commands, browser history, mobile controls, and recoverable dependency failures.

- Use the installed Velocity core opacity API and explicitly manage display, preserving configured animation timing. Reduced-motion users and a missing optional animation dependency receive immediate transitions.
- Keep the lexical current page consistent with the visible incoming page. Retain the latest click during a transition and preserve browser history without suppressing genuine hash changes.
- Share and await page initialization. Failed fragments, required scripts, and asynchronous initializers stay retryable; failed navigation restores a visible route with a retry control.
- Remove failed dynamic script tags, so an existing failed tag cannot falsely satisfy a subsequent load.
- Initialize first-use search through its controller, load the existing metadata independently of chamber rendering, and let the modal own its keyboard input. Search metadata retains its existing provenance and placeholder limitations.
- Pin MiniSearch 6.3.0's original distribution file and verified SRI. The prior CDN-generated minified URL had changed bytes and failed the recorded integrity hash.
- Provide readable links to existing standalone works when the core runtime cannot start. No album audio, visual assets, or historical artwork files are modified by this repair.

## Verification

- New production-source unit tests cover shared initialization, rejected initializer retry, asset failure, and navigation rollback; existing loader tests now prove failed fragment/script recovery rather than accepting error markup as content.
- Complete unit suite: 1,228 tests passed across 41 files.
- Eight new browser regressions use native links, keyboard events, history, and mobile-menu clicks. They cover successful routing, fragment failure/retry, direct URL failure, first-use search with OGOD results, missing Velocity, missing core runtime, and failed-script retry. They never force page visibility or routing state.
- Repository lint and formatting gates pass (existing lint warnings remain).

Local browser verification used Chromium 153 from the `@sparticuz/chromium` package with the repository's Playwright runner. Browser TLS validation remained enabled. Environment CDN/proxy-certificate limitations required fulfilling jQuery 3.7.1, Velocity 2.0.6, Three.js 0.160.0, and MiniSearch 6.3.0 requests with the exact distribution bytes matching the page/manifest SRI. These are source/runtime proofs, not evidence of public CDN availability or deployment. Optional SoundJS and Video.js CSS were unavailable in this environment. Sparse omitted assets are not classified as repository defects.

Failure-injection tests block service-worker interception to ensure the deliberately failed requests reach the network. Offline-cache correctness, all chamber media playback, Firefox, and public deployment require their own evidence.
