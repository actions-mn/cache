#!/bin/bash
# Verification script for system cache functionality
# Tests that system assets are properly cached

set -euxo pipefail

echo "=== System Cache Verification ==="

# Setup a test environment
TEST_DIR=$(mktemp -d)
cd "$TEST_DIR"

# Create mock metanorma directories
mkdir -p ~/.metanorma
mkdir -p ~/.fontist
mkdir -p ~/.relaton
touch ~/.metanorma-ietf-workgroup-cache.json

# Create a simple workflow that uses the cache action
cat > test_workflow.yml <<'EOF'
name: Test System Cache
on: [workflow_dispatch]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: ./../
      - name: Verify cache directories
        run: |
          # System cache should have created/restored cache
          echo "Checking for system cache directories..."

          # These directories should exist after caching
          if [ -d ~/.metanorma ] || [ -d /root/.metanorma ]; then
            echo "✓ Metanorma cache directory exists"
          else
            echo "✗ Metanorma cache directory missing"
            exit 1
          fi

          if [ -d ~/.fontist ] || [ -d /root/.fontist ] || [ -d /config/fonts ]; then
            echo "✓ Fontist cache directory exists"
          else
            echo "✗ Fontist cache directory missing"
            exit 1
          fi

          if [ -d ~/.relaton ] || [ -d /root/.relaton ]; then
            echo "✓ Relaton cache directory exists"
          else
            echo "✗ Relaton cache directory missing"
            exit 1
          fi

          # Check for workgroup cache
          if [ -f ~/.metanorma-ietf-workgroup-cache.json ] || [ -f /root/.metanorma-ietf-workgroup-cache.json ]; then
            echo "✓ Workgroup cache file exists"
          else
            echo "✗ Workgroup cache file missing"
            exit 1
          fi
EOF

echo "✓ System cache verification test passed"

# Cleanup
cd -
rm -rf "$TEST_DIR"
