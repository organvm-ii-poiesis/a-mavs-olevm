# CSP Security Audit: Removal of unsafe-inline

**Issue:** [#51](https://github.com/etceter4/a-mavs-olevm/issues/51)
**Document Version:** 1.0
**Last Updated:** 2026-02-02
**Status:** Comprehensive baseline audit with remediation roadmap

---

## Executive Summary

This audit documents all inline scripts and styles across the ETCETER4 codebase to support removal of `unsafe-inline` from Content Security Policy (CSP) headers. The analysis identifies:

- **1 critical inline script block** (220 lines in index.html)
- **277 inline style attributes** across the codebase
- **10 embedded `<style>` tags** in HTML files
- **High priority:** 3 files with >15 inline styles each
- **Remediation complexity:** Medium (requires selective nonce strategy)

### Key Metrics

| Category                    | Count | Impact          |
| --------------------------- | ----- | --------------- |
| Files with inline styles    | 60    | Widespread      |
| Files with embedded styles  | 10    | Moderate        |
| Files with inline scripts   | 1     | Critical        |
| Lines of inline script code | ~220  | High complexity |
| Empty style attributes      | ~91   | Low/cleanup     |

---

## Current CSP Status

### Existing Inline Violations

The codebase currently relies on `unsafe-inline` for:

1. **Inline Script (index.html, lines 1108-1326)**
   - Dynamically creates THREE.js post-processing pipeline classes
   - Sets up EffectComposer for bloom effects
   - Initializes OGOD 3D visual rendering
   - Reason: Three.js library extension that cannot be externalized without refactoring

2. **Inline Styles (60 files total)**
   - Dynamic layout values (widths, transforms, colors)
   - Background images (URLs calculated at runtime)
   - Media queries for responsive design
   - Animation/transition timing
   - Z-index layering for UI state

### Files Most Affected by inline-style-attr

| File                   | Count        | Type                 | Priority |
| ---------------------- | ------------ | -------------------- | -------- |
| analog.html            | 91           | Diary styling system | HIGH     |
| agora/index.html       | 22           | Navigation states    | HIGH     |
| ergasterion/index.html | 17           | Experiment layout    | HIGH     |
| index.html             | 16           | OGOD 3D UI states    | CRITICAL |
| akademia/index.html    | 11           | Section styling      | MEDIUM   |
| odeion/index.html      | 12           | Performance page     | MEDIUM   |
| html/index_old.html    | 18           | Archive (removable)  | LOW      |
| ogod/\*.html           | 29 files × 3 | Track displays       | MEDIUM   |

---

## Detailed Findings

### I. Inline Scripts

#### 1. index.html (Lines 1108–1326)

**Type:** `<script defer>` with inline JavaScript
**Size:** ~220 lines
**Purpose:** Initialize Three.js post-processing effects

**Content Analysis:**

```javascript
// Lines 1114-1126: THREE.RenderPass class definition
THREE.RenderPass = class RenderPass {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    // ... initialization
  }
  render(renderer, writeBuffer, readBuffer) {
    /* ... */
  }
};

// Lines 1129-1240: THREE.UnrealBloomPass class (108 lines)
THREE.UnrealBloomPass = class UnrealBloomPass {
  constructor(resolution, strength, radius, threshold) {
    // ... complex shader material setup
  }
  // Includes vertexShader and fragmentShader inline strings
};

// Lines 1277-1324: THREE.EffectComposer class implementation
THREE.EffectComposer = class EffectComposer {
  // ... pipeline management
};
```

**Why It's Inline:**

- Polyfills missing Three.js classes for post-processing pipeline
- Dynamically instantiated on-demand after THREE.js library loads
- Extends the THREE global namespace with custom implementations
- Requires immediate execution to prevent undefined class references

**Risk Level:** CRITICAL

---

### II. Inline Styles

#### A. Dynamic Background Images (background-image/background CSS)

**Files:**

- index.html (3 instances)
  - Line 56: `style="background-image: url(img/web-bg2.gif)"`
  - Line 527: `style="background: url(img/diary_bg.png) center"`
  - Line 532: `style="background: url(img/diary_bg.png) center"`

**Reason for Inline:** Background URLs determined at page render time; background position varies by layout state.

**Priority:** HIGH – affects initial page presentation

---

#### B. Dynamic Dimensions & Layout (width, height, transforms)

**Files:**

- index.html
  - Line 707: `style="text-shadow: 0 0 10px #00ffff"` – Dynamic glow effect
  - Line 712: `style="width: 0%; background: linear-gradient(90deg, #00ffff, #ff00ff); transition: width 0.3s ease"` – Loading bar
  - Line 745: `style="bottom: 5rem; border-color: rgba(0, 255, 255, 0.5); color: #00ffff; transition: all 0.2s ease"` – Button state
  - Line 754: `style="transform: translateX(-50%); max-width: 90%; gap: 0.5rem"` – Centered track selector
  - Line 1009: `style="border: 0; width: 100%; height: 42px"` – iframe dimensions

**Reason for Inline:** Layout calculations depend on:

- Viewport dimensions
- Container context
- Animation progress
- Responsive breakpoints

**Priority:** MEDIUM – mostly affects OGOD 3D section

---

#### C. Conditional/State-Based Colors & Opacity

**Files:**

- index.html
  - Line 726: `style="transition: all 0.2s ease"` – Button transitions
  - Line 734: `style="max-width: 250px"` – Info panel max-width
  - Line 736: `style="color: #00ffff"` – Track title color

**Reason for Inline:** Colors depend on:

- Track/UI state
- Hover/active states
- Theme variations
- Real-time data bindings

**Priority:** MEDIUM – UI state dependent

---

#### D. Empty Attributes (style="")

Found in: analog.html (91 instances), and scattered across other files.

**Impact:** Minimal – these are placeholder attributes with no actual CSS content.

**Remediation:** Should be removed as they serve no purpose (0% risk if deleted).

---

### E. Embedded Style Tags

**10 files with `<style>` blocks:**

1. **index.html (lines 758–798)** – OGOD 3D track button styling
   - `.ogod3d-track-btn` class definitions
   - Hover and active states
   - Media query for responsive design
     **Status:** Can be externalized to `css/ogod-3d.css`

2. **ogod-3d.html** – Comprehensive 3D page styling
   **Status:** Already in dedicated stylesheet context

3. **Various content files** (blogpost styling, narrative content)
   **Status:** Can be externalized or use CSS classes

---

## Remediation Strategy

### Phase 1: Immediate (Low Risk)

**Timeline:** Week 1
**Effort:** ~4 hours

1. **Remove empty style attributes**
   - Files: analog.html (91 instances), others
   - Command: Remove all `style=""` attributes
   - Risk: NONE – no functionality lost
   - Saves: ~100 lines of HTML

2. **Extract embedded style tags to external files**
   - index.html `<style>` block → `css/ogod-3d.css`
   - Other pages → appropriate stylesheet directories
   - Risk: LOW – simple file move
   - Saves: Allows CSP `style-src 'self'`

---

### Phase 2: High Priority (Medium Risk)

**Timeline:** Weeks 2-3
**Effort:** ~16 hours

#### 2A: Externalize OGOD 3D Inline Styles

**Target:** index.html lines 707, 712, 726, 734, 736, 745, 754

**Approach 1: Use CSS Variables** (RECOMMENDED)

```css
/* css/ogod-3d.css */
:root {
  --ogod3d-text-shadow: 0 0 10px #00ffff;
  --ogod3d-primary-color: #00ffff;
  --ogod3d-secondary-color: #ff00ff;
  --ogod3d-button-bg: rgba(0, 0, 0, 0.7);
}

#ogod3d-loading h1 {
  text-shadow: var(--ogod3d-text-shadow);
}

#ogod3d-loading-bar {
  width: 0%; /* Set via JS */
  background: linear-gradient(
    90deg,
    var(--ogod3d-primary-color),
    var(--ogod3d-secondary-color)
  );
  transition: width 0.3s ease;
}

#ogod3d-audio-btn {
  bottom: 5rem;
  border-color: rgba(0, 255, 255, 0.5);
  color: var(--ogod3d-primary-color);
  transition: all 0.2s ease;
}
```

**JavaScript:** Update dynamically using `element.style.setProperty()`

```javascript
document
  .getElementById('ogod3d-loading-bar')
  .style.setProperty('width', loadPercent + '%');
```

**Status:** Phase 2a should be PRIORITY because:

- Fixes 5 critical inline styles in main page
- Enables most restrictive CSP policy
- Maintains dynamic behavior
- Risk: LOW

---

#### 2B: Background Image URLs

**Target:** index.html lines 56, 527, 532

**Approach:** Use CSS classes with image URLs

```css
/* css/backgrounds.css */
.bg-animated-web {
  background-image: url(../img/web-bg2.gif);
}

.bg-diary {
  background: url(../img/diary_bg.png) center;
}
```

**HTML:**

```html
<body class="min-vh-100 w-100 futura fw1 bg-animated-web"></body>
```

**Status:** Phase 2b should follow Phase 2a

- Risk: LOW
- Impact: HIGH (removes background URL inline styles)

---

### Phase 3: Complex Refactoring (High Risk)

**Timeline:** Weeks 4-6
**Effort:** ~24 hours

#### 3A: Inline Script → External Module

**Target:** index.html lines 1108–1326
**File:** Create `js/3d/bloom/EffectComposerPolyfill.js`

**Strategy:**

1. Extract entire script block to external file
2. Keep execution flow:
   - Load as deferred script
   - Execute on DOMContentLoaded
   - Attach classes to THREE global

**New file structure:**

```javascript
// js/3d/bloom/EffectComposerPolyfill.js
(function () {
  if (typeof THREE === 'undefined') return;

  THREE.RenderPass = class RenderPass {
    // ... existing code
  };

  THREE.UnrealBloomPass = class UnrealBloomPass {
    // ... existing code
  };

  THREE.EffectComposer = class EffectComposer {
    // ... existing code
  };
})();
```

**HTML update:**

```html
<!-- Load AFTER three.js -->
<script
  type="text/javascript"
  src="js/3d/bloom/EffectComposerPolyfill.js"
  defer
></script>
```

**Risk:** MEDIUM

- Complex logic (220 lines)
- Shader string escaping
- Dependency on THREE library load order
- Testing requirement: Verify bloom effects render correctly

**Alternative Approach (Using nonce - see Phase 3B)**

---

#### 3B: Nonce-Based CSP for Script

If externalization is not feasible, use nonce attribute:

**Server-side (generate per-request):**

```javascript
const nonce = crypto.randomBytes(16).toString('hex');
// Pass to template engine
```

**HTML:**

```html
<script
  nonce="8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918"
  defer
>
  // ... inline script content
</script>
```

**CSP Header:**

```
script-src 'self' 'nonce-8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'
```

**Risk:** MEDIUM

- Requires server-side nonce generation
- Nonce must be regenerated on every page load
- Nonce must be cryptographically random
- **Recommendation:** Use this as FALLBACK only if Phase 3A extraction fails

---

### Phase 4: Content Pages (Lowest Priority)

**Timeline:** Week 7-8
**Effort:** ~12 hours

**Target Files (by category):**

#### 4A: Diary/Narrative Pages (high volume, simple styles)

- analog.html (91 empty attributes) – Remove only
- labyrinth/\*.html (13 pages) – All have `<style>` tags, can be extracted
- oikos/reflections/\*.html (3 pages) – Extract styles to `css/reflections.css`

**Status:** LOW PRIORITY – minimal styling complexity

---

#### 4B: Gallery/Archive Pages

- ergasterion/experiments/\*.html (2 pages, 7 styles each)
- agora/index.html (22 inline styles)
- pinakotheke/index.html (8 inline styles)

**Status:** MEDIUM PRIORITY – some layout dependencies

---

#### 4C: Academic/Archive (removable)

- html/index_old.html – Archive, can ignore or delete
- akademia/essays/\*.html – Embedded styles, extract to shared stylesheet

**Status:** LOW PRIORITY – cleanup/maintenance

---

## Implementation Priority Matrix

| Phase    | Items                             | Risk   | Impact   | Timeline    | Effort  |
| -------- | --------------------------------- | ------ | -------- | ----------- | ------- |
| **1**    | Empty attributes, embedded styles | LOW    | MEDIUM   | Week 1      | 4h      |
| **2a**   | OGOD inline styles (CSS vars)     | MEDIUM | HIGH     | Week 2      | 8h      |
| **2b**   | Background URLs                   | LOW    | HIGH     | Week 2-3    | 4h      |
| **3a**   | Inline script extraction          | MEDIUM | CRITICAL | Week 4-5    | 16h     |
| **3b**   | Nonce fallback (if needed)        | MEDIUM | CRITICAL | Week 5-6    | 8h      |
| **4a-c** | Content pages                     | LOW    | MEDIUM   | Week 7-8    | 12h     |
|          | **TOTAL**                         |        |          | **8 weeks** | **52h** |

---

## CSP Policy Progression

### Current (Most Permissive)

```
script-src 'self' 'unsafe-inline' cdnjs.cloudflare.com code.jquery.com code.createjs.com;
style-src 'self' 'unsafe-inline';
```

### After Phase 1 (Remove embedded style tags)

```
script-src 'self' 'unsafe-inline' cdnjs.cloudflare.com code.jquery.com code.createjs.com;
style-src 'self';
```

### After Phase 2 (Remove inline style attributes)

```
script-src 'self' 'unsafe-inline' cdnjs.cloudflare.com code.jquery.com code.createjs.com;
style-src 'self';
```

### After Phase 3a (Extract inline script)

```
script-src 'self' cdnjs.cloudflare.com code.jquery.com code.createjs.com;
style-src 'self';
```

### After Phase 3b (Fallback nonce, if needed)

```
script-src 'self' 'nonce-{random}' cdnjs.cloudflare.com code.jquery.com code.createjs.com;
style-src 'self';
```

### Final (Most Restrictive - GOAL)

```
script-src 'self' cdnjs.cloudflare.com code.jquery.com code.createjs.com;
style-src 'self';
image-src 'self' data:;
font-src 'self';
connect-src 'self' *.cloudflare.com;
frame-src 'self' www.youtube.com bandcamp.com;
```

---

## Testing Checklist

### Pre-Refactoring Tests

- [ ] Record baseline CSP violations in browser console
- [ ] Screenshot OGOD 3D page (bloom effects visible)
- [ ] Test track selector functionality
- [ ] Test responsive behavior (mobile, tablet, desktop)
- [ ] Load all content pages (diary, essays, gallery)

### Phase 1 Testing (Empty attributes removal)

- [ ] Verify no visual change after removing style=""
- [ ] Run HTML validation (W3C)
- [ ] Check page load time (should be slightly faster)

### Phase 2a Testing (OGOD styles → CSS vars)

- [ ] OGOD 3D page loads and renders
- [ ] Loading bar animation smooth
- [ ] Track buttons style correctly
- [ ] Hover states work (color changes)
- [ ] Active state styling correct
- [ ] Test on mobile viewport

### Phase 2b Testing (Background images)

- [ ] Main page background loads (animated GIF)
- [ ] Diary section background displays
- [ ] No layout shift on image load
- [ ] Performance unaffected

### Phase 3a Testing (Script extraction)

- [ ] Three.js loads before EffectComposerPolyfill
- [ ] Bloom effect renders on OGOD scene
- [ ] No console errors related to THREE.\* classes
- [ ] Animation frame rate stable
- [ ] Browser DevTools shows no `unsafe-inline` script violations
- [ ] Lighthouse CSP audit passes

### Phase 3b Testing (Nonce fallback, if used)

- [ ] Nonce regenerates on each page load
- [ ] Browser DevTools CSP warnings gone
- [ ] Script execution not blocked
- [ ] Nonce value present in CSP header and script tag

### Full Suite

- [ ] All pages load without CSP errors in console
- [ ] CSP header validated by security tool (e.g., securityheaders.com)
- [ ] E2E tests pass (Playwright)
- [ ] Performance benchmarks stable or improved
- [ ] Accessibility unaffected (a11y audit)

---

## Files Requiring Changes (by phase)

### Phase 1

- `/index.html` – Remove `<style>` tags (lines 758–798)
- `/analog.html` – Remove `style=""` attributes
- Various files – Same cleanup

### Phase 2a

- `/index.html` – Remove inline style attributes (OGOD section)
- `/css/ogod-3d.css` – Create new stylesheet with CSS variables

### Phase 2b

- `/index.html` – Replace inline styles with CSS classes
- `/css/backgrounds.css` – Create with background rules

### Phase 3a

- `/index.html` – Remove `<script defer>` block (lines 1108–1326)
- `/js/3d/bloom/EffectComposerPolyfill.js` – Create new file

### Phase 3b (if fallback needed)

- Server-side template rendering – Add nonce generation
- `/index.html` – Add `nonce="..."` attribute

### Phase 4

- `/labyrinth/*.html` – Extract embedded styles
- `/oikos/reflections/*.html` – Similar extraction
- `/css/narrative.css` – Create shared stylesheet

---

## Risk Assessment & Mitigation

| Risk                                                | Severity | Mitigation                                           | Owner     |
| --------------------------------------------------- | -------- | ---------------------------------------------------- | --------- |
| Bloom effect doesn't render after script extraction | HIGH     | Extensive testing; verify THREE loading order        | Developer |
| CSS variables not supported in target browsers      | MEDIUM   | Fallback to inline styles + nonce                    | DevOps    |
| Layout shift due to removed inline styles           | MEDIUM   | Test responsive at all breakpoints                   | QA        |
| Nonce generation server overhead                    | LOW      | Cache strategy; benchmark performance                | DevOps    |
| Third-party CDN script CSP conflicts                | MEDIUM   | Maintain allow-list; test with subresource integrity | Security  |

---

## Compliance & Security Benefits

### OWASP Alignment

**Removes:** unsafe-inline → Mitigates XSS via code injection

**Improves:** Compliance with:

- OWASP Top 10 (A01:2021 Broken Access Control)
- CWE-79 (Improper Neutralization of Input During Web Page Generation)

### Security Headers Grade

**Current:** Likely D or F (unsafe-inline)
**Target:** A (all script/style sources explicit)

### Browser Support

All modern browsers (>99%) support:

- CSS Variables (caniuse: 95%)
- Nonce-based CSP (caniuse: 98%)
- defer attribute (caniuse: 100%)

---

## References & Resources

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [Three.js Documentation](https://threejs.org/docs/)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)

---

## Appendix A: Quick Reference – Files Summary

### Inline Scripts

```
index.html: 1 script block (220 lines) – CRITICAL
```

### Inline Styles by File

```
High Volume (>15):
  analog.html ...................... 91 (mostly empty)
  agora/index.html ................. 22
  html/index_old.html .............. 18
  ergasterion/index.html ........... 17
  akademia/index.html .............. 11
  odeion/index.html ................ 12

Medium Volume (7-15):
  index.html ....................... 16
  ergasterion/experiments/noise-field.html .... 7
  ergasterion/experiments/particle-system.html 7
  pinakotheke/index.html ........... 8

Low Volume (1-6):
  [Multiple files with 1-6 inline styles each]
```

### Embedded Style Tags

```
Total across codebase: 10 files with <style> blocks
Index.html has critical OGOD 3D button styling (lines 758-798)
```

---

## Document History

| Version | Date       | Author         | Changes                              |
| ------- | ---------- | -------------- | ------------------------------------ |
| 1.0     | 2026-02-02 | Security Audit | Initial comprehensive baseline audit |

---

**Next Steps:**

1. Review and approve remediation roadmap in team standup
2. Create feature branch for Phase 1 implementation
3. Set up CSP reporting to monitor violations during refactoring
4. Schedule security team review post-Phase 3a completion
