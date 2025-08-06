#!/bin/bash

# Script to update visual regression test snapshots in CI
# This script should be run when visual tests fail due to intentional UI changes

set -e

echo "🔄 Updating visual regression test snapshots..."

# Check if we're in CI environment
if [ "$CI" = "true" ]; then
    echo "📋 Running in CI environment"
    
    # Run tests with update snapshots flag
    npx playwright test --update-snapshots
    
    # Check if snapshots were updated
    if [ $? -eq 0 ]; then
        echo "✅ Snapshots updated successfully"
        
        # Commit the updated snapshots
        git config --global user.email "ci@example.com"
        git config --global user.name "CI Bot"
        git add e2e-tests/**/*-snapshots/
        git commit -m "Update visual regression test snapshots [skip ci]" || echo "No changes to commit"
        
        echo "📝 Updated snapshots committed"
    else
        echo "❌ Failed to update snapshots"
        exit 1
    fi
else
    echo "🖥️  Running locally - updating snapshots..."
    npx playwright test --update-snapshots
fi

echo "🎉 Snapshot update complete!" 