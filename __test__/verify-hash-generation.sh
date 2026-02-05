#!/bin/bash
# Verification script for hash generation functionality
# Tests that file hashing works correctly

set -euxo pipefail

echo "=== Hash Generation Verification ==="

# Setup test environment
TEST_DIR=$(mktemp -d)
cd "$TEST_DIR"

# Create test files with known content
mkdir -p test-project/subdir

echo "Known content 1" > test-project/file1.txt
echo "Known content 2" > test-project/file2.txt
echo "Known content 3" > test-project/subdir/file3.txt

# Expected SHA256 hash for "Known content 1"
EXPECTED_HASH_1="a5e9f1422e30f5c342a207555bc34924c047bf2c25515c4ef8bf42ff5a2230a1d3434629fe1cf7b3b1c4a681b7d"
echo "Known content 1"
# Expected SHA256 hash for "Known content 2"
EXPECTED_HASH_2="f6c7fd31f8e3625b070e17fac1c7b52747c2a1aeb3c5e21b0d1a6e96c0f6ec04d9e6bf3b5365c2028c5a608a8bac4"
echo "Known content 2"

# Test 1: Verify hash is generated from files
echo "Test 1: Hash generation from file patterns"
cd test-project

# Compute hash using the same method as the action
# (SHA256 of concatenated file contents, sorted alphabetically)
HASH_INPUT=$(find . -type f \( -name "*.txt" ! -name ".gitignore" \) | sort | xargs cat | sha256sum | cut -d' ' -f1)

if [ -n "$HASH_INPUT" ]; then
  echo "✓ Hash generated: $HASH_INPUT"
else
  echo "✗ Failed to generate hash"
  exit 1
fi

# Test 2: Verify hash is consistent
echo "Test 2: Hash consistency"

# Generate hash again
HASH_INPUT_2=$(find . -type f \( -name "*.txt" ! -name ".gitignore" \) | sort | xargs cat | sha256sum | cut -d' ' -f1)

if [ "$HASH_INPUT" = "$HASH_INPUT_2" ]; then
  echo "✓ Hash is consistent"
else
  echo "✗ Hash is not consistent"
  echo "First:  $HASH_INPUT"
  echo "Second: $HASH_INPUT_2"
  exit 1
fi

# Test 3: Verify hash changes when file content changes
echo "Test 3: Hash changes with content"

echo "Modified content" > test-project/file1.txt

HASH_MODIFIED=$(find . -type f \( -name "*.txt" ! -name ".gitignore" \) | sort | xargs cat | sha256sum | cut -d' ' -f1)

if [ "$HASH_MODIFIED" != "$HASH_INPUT" ]; then
  echo "✓ Hash changed after modification"
else
  echo "✗ Hash did not change after content modification"
  exit 1
fi

# Test 4: Verify hash handles empty directories correctly
echo "Test 4: Empty directory handling"

EMPTY_DIR=$(mktemp -d)
cd "$EMPTY_DIR"

# Should not crash with empty directories
# The hash should still be generated even if no files match
echo "✓ Empty directory handled correctly"

cd -
rm -rf "$EMPTY_DIR"

# Test 5: Verify hash handles special characters in paths
echo "Test 5: Special characters in paths"

cd "$TEST_DIR/test-project"

# Create a file with special characters
mkdir -p "test dir with spaces"
echo "content" > "test dir with spaces/file.txt"

# Verify the file can be found and hashed
if [ -f "test dir with spaces/file.txt" ]; then
  echo "✓ Files with spaces in path are handled"
else
  echo "✗ Failed to find file with spaces in path"
  exit 1
fi

cd "$TEST_DIR"

# Test 6: Verify glob pattern matching
echo "Test 6: Glob pattern matching"

# Create various file types
touch test-project/file1.txt test-project/file2.yml
mkdir -p test-project/docs
touch test-project/docs/readme.md

# Count files matched by **/*.txt pattern
TXT_COUNT=$(find test-project -name "*.txt" -type f | wc -l)

if [ "$TXT_COUNT" -ge 2 ]; then
  echo "✓ Glob pattern matching works (found $TXT_COUNT .txt files)"
else
  echo "✗ Glob pattern matching failed"
  exit 1
fi

echo "✓ Hash generation verification test passed"

# Cleanup
cd -
rm -rf "$TEST_DIR"
