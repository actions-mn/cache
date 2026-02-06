# Test Strategy and Scenarios

## ULTRATHINK: All Possible Scenarios

### Platform Matrix

| Platform | Runner User | Home Directory | /root Access | Typical Cache Paths |
|----------|-------------|----------------|--------------|---------------------|
| **Linux (ubuntu-latest)** | `runner` | `/home/runner` | ❌ EACCES | `~/.metanorma` → `/home/runner/.metanorma` |
| **macOS (macos-latest)** | `runner` | `/Users/runner` | ❌ EACCES | `~/.metanorma` → `/Users/runner/.metanorma` |
| **Windows (windows-latest)** | `runner` | `C:\Users\runner` | N/A | `~/.metanorma` → `C:\Users\runner\.metanorma` |

### Runtime Environment Matrix

| Environment | User Context | Metanorma Install | Cache Behavior |
|-------------|--------------|-------------------|----------------|
| **Native Runner** | `runner` (non-root) | Ruby gems via `actions-mn/setup` | Uses `~/.metanorma`, skips `/root/...` |
| **Docker Container** | `root` (privileged) | Container image with metanorma | Uses `/root/.metanorma` |
| **Mixed** | N/A | Docker setup on native runner | Both paths may be accessible |

### Test Scenarios by Priority

#### P0 - Critical (Must Work)

| Scenario | Description | Test Method |
|----------|-------------|-------------|
| **Cold Start - Linux** | First run, no cache | Run twice, verify second is faster |
| **Cold Start - macOS** | First run, no cache | Run twice, verify second is faster |
| **Cold Start - Windows** | First run, no cache | Run twice, verify second is faster |
| **Cache Hit - Linux** | Cache exists from previous run | Verify `cache-site-cache-hit=true` |
| **Metanorma Runs After Cache** | Metanorma compilation succeeds | Check output file exists |

#### P1 - Important (Should Work)

| Scenario | Description | Test Method |
|----------|-------------|-------------|
| **Warm Start - Linux** | Cache restored successfully | Verify cache restore logs |
| **Warm Start - macOS** | Cache restored successfully | Verify cache restore logs |
| **Warm Start - Windows** | Cache restored successfully | Verify cache restore logs |
| **System Cache Only** | No manifest, just fonts/relaton | Verify system assets cached |
| **Site Cache + Manifest** | With metanorma.yml | Verify site output cached |

#### P2 - Edge Cases (Handle Gracefully)

| Scenario | Description | Expected Behavior |
|----------|-------------|-------------------|
| **Cross-Platform Cache** | Windows cache on Linux | Cache miss (different paths) |
| **Docker to Native** | Docker cache on runner | Cache miss (different users) |
| **Permission Denied** | `/root/` on Ubuntu | Skip path with debug message |
| **Empty Manifest** | No `source.files` | Warning, skip site cache |
| **Non-existent Files** | Files in manifest don't exist | Warning, skip missing files |

#### P3 - Nice to Have

| Scenario | Description | Test Method |
|----------|-------------|-------------|
| **Partial Cache Hit** | Some groups hit, others miss | Verify individual cache keys |
| **Stale Cache** | Source files changed | New cache created |
| **Custom Site Path** | Non-default `_site` | Verify custom path cached |
| **Extra Input** | Additional directories | Verify included in hash |

### Cross-Platform Path Differences

| Path Component | Linux | macOS | Windows |
|----------------|-------|-------|---------|
| Home | `/home/runner` | `/Users/runner` | `C:\Users\runner` |
| Path separator | `/` | `/` | `\` |
| Metanorma dir | `~/.metanorma` | `~/.metanorma` | `~/.metanorma` |
| Fontist dir | `~/.fontist` | `~/.fontist` | `~/.fontist` |
| Site cache | `_site/` | `_site/` | `_site\` |

### Cache Key Compatibility

| Scenario | Cache Compatibility |
|----------|-------------------|
| Same OS, same environment | ✅ Cache HIT |
| Same OS, different environment | ❌ Cache miss (different users) |
| Different OS | ❌ Cache miss (different paths, formats) |
| Same OS, same environment, source changed | ❌ Cache miss (different hash) |

### Testing Gaps to Fill

1. **No cache hit verification** - Current tests don't verify `cache-site-cache-hit` output
2. **No timing comparison** - Don't verify cache makes builds faster
3. **No environment-specific tests** - Don't test Docker vs native
4. **No cross-platform cache tests** - Don't verify cache isolation
5. **No actual cache content verification** - Don't verify cached data is correct

### Integration Test Implementation

The `.github/workflows/integration-test.yml` workflow addresses these gaps:

| Job | Purpose | Validates |
|-----|---------|-----------|
| `cold-start` | First run with no cache | System cache created, Metanorma runs |
| `warm-start` | Second run with cache | System cache restored, Metanorma runs |
| `system-cache-only` | No manifest provided | Only system assets cached |
| `permission-handling` | /root/ paths on non-Docker | No EACCES errors |
| `site-cache-with-manifest` | With metanorma.yml | Hash generated, site cached |

**Key Testing Technique:**
- GitHub Actions cache persists across jobs in the same workflow run
- `warm-start` job depends on `cold-start` job using `needs:`
- This allows testing cache hit behavior without requiring multiple workflow runs
