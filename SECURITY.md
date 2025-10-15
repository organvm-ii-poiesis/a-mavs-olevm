# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in this project, please email etceter4@etceter4.com with details. We take security seriously and will respond promptly.

## Security Measures Implemented

### 1. Content Security Policy (CSP)
The `.htaccess` file implements a comprehensive CSP that:
- Restricts script sources to trusted CDNs (jQuery, Velocity.js, Google Analytics)
- Allows frames only from Bandcamp and YouTube for embedded content
- Prevents inline script execution (with exceptions for Google Analytics)
- Blocks object/embed tags to prevent Flash vulnerabilities
- Restricts font and image sources

**Note:** The CSP currently uses `'unsafe-inline'` for scripts due to inline Google Analytics code. For improved security, consider:
- Moving analytics to a separate external file
- Using CSP nonces or hashes for inline scripts
- Implementing Google Tag Manager instead of inline GA code

### 2. Security Headers
Additional security headers configured:
- `X-Frame-Options: DENY` - Prevents clickjacking attacks
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-XSS-Protection: 1; mode=block` - Enables browser XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information
- `Permissions-Policy` - Restricts access to sensitive browser features

### 3. HTTPS/HSTS
HSTS (HTTP Strict Transport Security) is prepared in `.htaccess` but commented out. 

**Action Required:** Uncomment the HSTS header once HTTPS is fully deployed:
```apache
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
```

### 4. Dependency Management
- All dependencies are up-to-date with no known vulnerabilities
- Automated dependency updates via Dependabot
- Weekly security audits in CI/CD pipeline
- CDN resources use Subresource Integrity (SRI) hashes

## Known Issues & Recommendations

### Medium Priority

1. **Inline Scripts in HTML**
   - **Issue:** Google Analytics uses inline scripts
   - **Impact:** Requires `'unsafe-inline'` in CSP, reducing security
   - **Recommendation:** Move to external GA file or implement GTM

2. **Global Scope Usage**
   - **Issue:** JavaScript uses global scope for cross-file communication
   - **Impact:** Potential for variable collisions, no-undef check disabled
   - **Recommendation:** Migrate to ES6 modules or implement a module bundler (Webpack/Rollup)

3. **jQuery 3.7.1**
   - **Status:** Current, but older version
   - **Recommendation:** Monitor for jQuery security updates or consider migrating to vanilla JS

### Low Priority

1. **Legacy HTML Files**
   - **Issue:** Some files (loophole.html, OGOD.html, sitemap.html) have malformed HTML
   - **Impact:** Potential XSS risks if user input is involved
   - **Recommendation:** Validate and fix HTML syntax

2. **HTTP URLs in iframes**
   - **Issue:** Bandcamp iframes use `http://` instead of `https://`
   - **Impact:** Mixed content warnings when served over HTTPS
   - **Recommendation:** Update to HTTPS URLs

3. **Server Signature**
   - **Status:** Disabled via `.htaccess`
   - **Note:** Verify Apache is configured to respect this setting

## Security Best Practices for Contributors

1. **Never commit sensitive data:**
   - API keys, passwords, or tokens
   - Personal information
   - Database credentials

2. **Validate all user input:**
   - Sanitize HTML content
   - Use parameterized queries (if backend is added)
   - Validate file uploads

3. **Keep dependencies updated:**
   - Run `npm audit` before committing
   - Review Dependabot PRs promptly
   - Test thoroughly after updates

4. **Follow secure coding practices:**
   - Use `const` for values that don't change
   - Avoid `eval()` and similar dangerous functions
   - Implement proper error handling

## Security Checklist for New Features

- [ ] No hardcoded secrets or credentials
- [ ] All external resources loaded over HTTPS
- [ ] User input properly sanitized
- [ ] CSP rules updated if adding new content sources
- [ ] Dependencies reviewed for vulnerabilities
- [ ] Code reviewed by at least one other person
- [ ] Security implications documented

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Audit History

- **2024-10**: Comprehensive security audit and modernization
  - Updated all dependencies
  - Fixed 9 security vulnerabilities (4 high-severity)
  - Implemented security headers
  - Added CSP
  - Configured automated security scanning

---

*Last Updated: October 2024*
