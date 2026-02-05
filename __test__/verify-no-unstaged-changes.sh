#!/bin/bash
# Verification script to ensure no unstaged changes after action runs
# This prevents state leaks during action execution

set -euxo pipefail

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo "::error::There are uncommitted changes after running the action"
  echo "::group::Git status"
  git status
  echo "::endgroup::"
  echo "::group::Git diff"
  git diff
  echo "::endgroup::"
  exit 1
fi

echo "No unstaged changes detected"
