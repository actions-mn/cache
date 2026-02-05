# Contributing to metanorma-cache

Thank you for considering contributing to this project! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the repository maintainers.

## Getting Started

### Prerequisites

- **Node.js 20.x** - This action uses the node20 runtime
- **npm 10.x** or later - For package management

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/cache.git
   cd cache
   ```

3. Install dependencies:
   ```bash
   npm ci
   ```

4. Build the project:
   ```bash
   npm run build
   ```

## Development Workflow

### Branch Strategy

- `main` - Protected branch, requires PR for changes
- Feature branches - Create from `main` using the pattern:
  - `feat/feature-name` for new features
  - `fix/bug-name` for bug fixes
  - `refactor/description` for refactoring
  - `test/description` for test changes
  - `docs/description` for documentation

### Making Changes

1. Create a feature branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. Make your changes following [Coding Standards](#coding-standards)

3. Build and test locally:
   ```bash
   npm run build
   npm run format-check
   npm run lint
   npm test
   ```

4. Commit your changes following [Commit Messages](#commit-messages)

5. Push to your fork:
   ```bash
   git push origin feat/your-feature-name
   ```

6. Create a pull request

## Testing

### Unit Tests

Unit tests are written using Jest and located in `__test__/`:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Integration Tests

Integration tests are shell scripts that verify the action works correctly:

```bash
# Run verification scripts
./__test__/verify-system-cache.sh
./__test__/verify-site-cache.sh
./__test__/verify-hash-generation.sh
./__test__/verify-malformed-manifest.sh
```

### Test Coverage

- Aim for **80%+ code coverage**
- All edge cases should have tests
- Add tests for any new functionality

### Writing Tests

**Unit Tests** (`__test__/*.test.ts`):
```typescript
describe('functionName', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = functionName(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

**Integration Tests** (`__test__/verify-*.sh`):
```bash
#!/bin/bash
set -euxo pipefail

# Test setup
TEST_DIR=$(mktemp -d)
cd "$TEST_DIR"

# Test logic here...

# Cleanup
cd -
rm -rf "$TEST_DIR"
```

## Coding Standards

### TypeScript

- Use **TypeScript 5.8+** with strict mode enabled
- All functions must have return type annotations
- Use `interface` for object shapes, `type` for unions/intersections
- Avoid `any` - use `unknown` when type is truly unknown
- Use `readonly` for immutable data

### Code Style

- **2 spaces** for indentation (no tabs)
- **120 characters** max line length
- Use **single quotes** for strings
- Use **semicolons** at end of statements
- Use **arrow functions** for anonymous functions

### Formatting

This project uses Prettier for consistent formatting:

```bash
# Format all files
npm run format

# Check formatting without modifying
npm run format-check
```

Please run `npm run format` before committing.

### Linting

ESLint is used for code quality checks:

```bash
# Run linter
npm run lint

# Auto-fix issues
npm run lint -- --fix
```

### File Organization

```
src/
├── main.ts                 # Entry point
├── constants.ts            # Constants
├── errors.ts               # Error classes
├── cache-settings.ts       # Settings interface
├── input-helper.ts         # Input parsing
├── manifest-parser.ts      # YAML parsing
├── file-hash-generator.ts  # Hash generation
├── system-cache-manager.ts # System caching
└── site-cache-manager.ts   # Site caching

__test__/
├── *.test.ts              # Unit tests
└── verify-*.sh            # Integration tests
```

## Commit Messages

This project uses **semantic commit messages**:

```
<type>(<scope>): <subject>
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code changes that neither fix bug nor add feature
- `test` - Adding or updating tests
- `chore` - Build process or auxiliary tool changes

### Examples

```
feat(manifest): add support for multiple manifest files
fix(cache): handle missing cache directory gracefully
docs(readme): update installation instructions
test(hash): add tests for hash consistency
refactor(parser): extract YAML parsing to separate module
```

### Commit Message Guidelines

- Use **imperative mood** ("add", not "adding" or "added")
- **Do not** end with period
- **Do not** capitalize first letter
- Keep the **subject line under 72 characters**
- For bug fixes, add issue number: `fix(cache): handle race condition, fixes #42`

## Pull Request Process

### Before Creating a PR

1. **Update documentation** if you've changed functionality
2. **Add tests** for any new functionality
3. **Ensure all tests pass**: `npm test`
4. **Ensure linting passes**: `npm run lint`
5. **Ensure formatting passes**: `npm run format-check`
6. **Rebase** your branch on latest `main` if needed

### Creating a PR

1. Go to the repository on GitHub
2. Click "New Pull Request"
3. Select your feature branch
4. Use a descriptive title following commit message format
5. Fill in the PR template with:
   - Description of changes
   - Related issues (if any)
   - Testing steps
   - Screenshots (if applicable)

### PR Review Process

1. **Automated checks** must pass (tests, linting, CodeQL)
2. **At least one maintainer** must approve
3. **No merge conflicts** with `main`
4. **Conversation resolved** (if any review comments)

### After Merge

- **Delete your feature branch** after merge
- Celebrate! 🎉

## Development Tips

### Debugging

To debug the action locally:

1. Build the action: `npm run build`
2. Create a test workflow in your repo
3. Add `actions/checkout@v6` before your action
4. Add debug output using `core.debug()` in your code

### Testing Changes

To test your changes in a real workflow:

1. Push your branch to your fork
2. Create a test workflow that uses your fork:
   ```yaml
   - uses: YOUR_USERNAME/cache@feat/your-feature
   ```
3. Run the workflow and verify results

### Common Issues

**Build fails with "Module not found"**:
- Run `npm ci` to reinstall dependencies

**Tests fail locally but pass in CI**:
- Check Node.js version (must be 20.x)
- Clear Jest cache: `npm test -- --clearCache`

**Linting errors**:
- Run `npm run lint -- --fix` to auto-fix

## Getting Help

- **Documentation**: Check the [README](README.md)
- **Issues**: Search existing issues or create a new one
- **Discussions**: Use GitHub Discussions for questions

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

Thank you for your contributions! 🙏
