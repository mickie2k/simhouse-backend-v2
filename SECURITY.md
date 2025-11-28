# Supply Chain Security - NPM Worm Prevention Guide

## Overview
This document outlines security measures implemented to protect against npm supply chain attacks (like the "Shai-Hulud 2.0" style worms and malicious packages).

## Implemented Protections

### 1. `.npmrc` Configuration
- **save-exact=true**: Locks package versions (no `^` or `~`) to prevent unexpected updates
- **audit=true**: Runs security audits on every install
- **audit-level=moderate**: Fails on moderate+ vulnerabilities
- **registry verification**: Only uses official npm registry
- **engine-strict=true**: Enforces Node version compatibility

### 2. Package Lock Integrity
- Always commit `package-lock.json` to version control
- Never manually edit package-lock.json
- Review lock file changes in PRs carefully

### 3. Regular Security Audits
Run these commands regularly:

```powershell
# Check for vulnerabilities
npm audit

# Check for vulnerabilities in production dependencies only
npm audit --production

# Attempt automatic fixes (review changes carefully!)
npm audit fix

# Check for outdated packages
npm outdated

# Check package licenses
npx license-checker --summary
```

### 4. Dependency Review Checklist
Before adding any new package:

- [ ] Check npm package page for:
  - Last publish date (avoid abandoned packages)
  - Weekly downloads (low downloads = higher risk)
  - GitHub repository link (verify it exists and is active)
  - Number of maintainers
  - Package size (unusually large = suspicious)
  
- [ ] Review the package's dependencies:
  ```powershell
  npm view <package-name> dependencies
  ```

- [ ] Check security advisories:
  ```powershell
  npm audit
  # Or visit: https://security.snyk.io/
  ```

- [ ] Review the package source on GitHub before installing
- [ ] Check for typosquatting (e.g., `expres` vs `express`)

### 5. Installation Best Practices

```powershell
# Always use exact versions
npm install <package>@<exact-version> --save-exact

# Review what will be installed before confirming
npm install --dry-run <package>

# Audit immediately after install
npm install <package> && npm audit
```

### 6. CI/CD Pipeline Security
Add to your CI pipeline (GitHub Actions, GitLab CI, etc.):

```yaml
# Example GitHub Actions snippet
- name: Security Audit
  run: npm audit --audit-level=moderate

- name: Verify package-lock.json
  run: |
    npm ci
    git diff --exit-code package-lock.json
```

### 7. Runtime Protections

**Environment Variables:**
- Never commit secrets to version control
- Use `.env` files (already in `.gitignore`)
- Validate all environment variables at startup

**Input Validation:**
- Already implemented: `class-validator` for DTOs
- Always validate user input
- Sanitize database queries (Prisma handles this)

### 8. Monitoring & Detection

**Watch for suspicious behavior:**
- Unexpected network requests during `npm install`
- New scripts added to package.json
- Modified lock files without corresponding package.json changes
- Packages requesting unusual permissions
- Lifecycle scripts that download external code

**Tools to use:**
```powershell
# Socket.dev - analyzes package behavior
npx socket-cli audit

# Snyk - comprehensive vulnerability scanning
npx snyk test

# OWASP Dependency Check
npx --yes @cyclonedx/cyclonedx-npm --output-file sbom.json
```

### 9. Package Verification

**Before major updates:**
```powershell
# See what will change
npm outdated

# Update one package at a time
npm update <package-name>

# Run full test suite
npm test

# Run audit
npm audit
```

### 10. Incident Response Plan

If a compromised package is detected:

1. **Immediate actions:**
   ```powershell
   # Remove the package
   npm uninstall <malicious-package>
   
   # Clear cache
   npm cache clean --force
   
   # Reinstall from clean state
   Remove-Item -Recurse -Force node_modules
   npm ci
   ```

2. **Investigate:**
   - Review git history for unauthorized changes
   - Check for modified files outside node_modules
   - Review network logs for data exfiltration
   - Rotate secrets/API keys if compromised

3. **Report:**
   - Report to npm: https://www.npmjs.com/support
   - File a GitHub security advisory
   - Notify your team/stakeholders

## Additional Tools

### Recommended npm packages for security:

```powershell
# Socket.dev CLI - real-time security monitoring
npm install -g @socketsecurity/cli

# Snyk CLI - vulnerability scanning
npm install -g snyk

# npm-check - interactive package updates
npm install -g npm-check
```

### GitHub Security Features
Enable in repository settings:
- Dependabot security updates
- Dependabot version updates
- Code scanning with CodeQL
- Secret scanning

## References
- [npm Security Best Practices](https://docs.npmjs.com/security-best-practices)
- [OWASP Dependency Check](https://owasp.org/www-project-dependency-check/)
- [Socket.dev Blog](https://socket.dev/blog)
- [Snyk Vulnerability Database](https://security.snyk.io/)

## Regular Maintenance Schedule

- **Daily**: Automated CI/CD security checks
- **Weekly**: Review Dependabot alerts
- **Monthly**: Run full security audit and update dependencies
- **Quarterly**: Review and update this security policy

---

**Last Updated**: November 28, 2025
