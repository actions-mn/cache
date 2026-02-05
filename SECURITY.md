# Security Policy

## Supported Versions

Currently supported versions:

| Version | Supported          |
|---------|--------------------|
| v2.x    | :white_check_mark: |
| v1.x    | :x: |

Version 1.x is the legacy composite action and is no longer supported. Please migrate to v2.x for the latest security updates.

## Reporting a Vulnerability

Please do **not** report security vulnerabilities through public GitHub issues.

Instead, please send an email to the repository maintainers. The security team will investigate and respond as soon as possible.

Please include:

1. **Description** of the vulnerability
2. **Steps to reproduce** the issue
3. **Potential impact** of the vulnerability
4. **Suggested fix** (if known)

## Security Best Practices

### Path Traversal Protection

This action validates all file paths to prevent directory traversal attacks:

- Paths starting with `~` are rejected (GitHub Actions doesn't support shell expansion)
- Paths containing `..` are rejected to prevent escaping the repository
- Absolute paths outside the repository are rejected

### Input Validation

All inputs are validated before use:

- Manifest files must have `.yml` or `.yaml` extension
- Manifest files must exist and be regular files (not directories)
- Cache paths are validated to prevent unauthorized access

### Dependency Pinning

This action pins all dependency versions to prevent supply chain attacks:

- npm dependencies use exact versions via `package-lock.json`
- TypeScript enables compile-time type checking
- CodeQL analyzes code for potential vulnerabilities in CI

### No Secrets Handling

This action does not handle, log, or transmit any secrets:

- All cache operations use GitHub Actions built-in cache service
- No external network calls are made
- No user input is logged or transmitted

## Supply Chain Security

### Dependencies

This action uses the following production dependencies:

| Package | Version | Purpose |
|---------|---------|---------|
| `@actions/core` | 1.11.1 | GitHub Actions core functionality |
| `@actions/cache` | 3.2.4 | Cache save/restore operations |
| `glob` | 11.0.0 | File pattern matching |
| `yaml` | 2.8.2 | YAML manifest parsing |

All dependencies are scanned for vulnerabilities via:

1. **npm audit** - Runs on every pull request
2. **Dependabot** - Automated dependency updates
3. **CodeQL** - Static analysis for vulnerability patterns

### Build Process

The action is built using:

- **TypeScript 5.8.2** - Type-safe source code
- **@vercel/ncc 0.38.4** - Bundles all dependencies into `dist/index.js`
- **check-dist workflow** - Ensures checked-in `dist/` matches build output

The `dist/index.js` file is checked into the repository for transparency. You can verify the build by running:

```bash
npm ci
npm run build
diff dist/index.js .git/dist/index.js
```

## Vulnerability Response Process

1. **Report received** via private disclosure
2. **Confirmation** from security team within 48 hours
3. **Investigation** and fix development
4. **Security release** with patched version
5. **Advisory** published via GitHub Security Advisories
6. **Coordination** with dependent projects (if needed)

## Security-Related Configuration

### GitHub Actions Workflows

- **check-dist.yml** - Verifies build integrity
- **codeql-analysis.yml** - Automated security scanning
- All workflows use minimum required permissions

### CodeQL Analysis

CodeQL runs on every pull request to detect:

- SQL injection patterns
- Cross-site scripting (XSS) vulnerabilities
- Path traversal vulnerabilities
- Unsafe deserialization
- And more...

### ESLint Security Rules

ESLint is configured with security-focused rules:

- `no-eval` - Prevents dynamic code execution
- `no-implied-eval` - Catches indirect eval usage
- Security plugins for additional checks
