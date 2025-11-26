#!/bin/bash
# Script to push current branch to both GitHub repositories
# Usage: ./push-to-both.sh [branch-name]
# If no branch name is provided, uses current branch

BRANCH=${1:-$(git rev-parse --abbrev-ref HEAD)}

echo "Pushing $BRANCH to both repositories..."
echo ""

echo "[1/2] Pushing to origin (original repo)..."
git push origin "$BRANCH" || {
    echo "ERROR: Failed to push to origin"
    exit 1
}

echo ""
echo "[2/2] Pushing to main-project (new repo)..."
git push main-project "$BRANCH" || {
    echo "ERROR: Failed to push to main-project"
    exit 1
}

echo ""
echo "Successfully pushed $BRANCH to both repositories!"


