#!/bin/bash

# Get the number of commits on the main branch
COMMIT_COUNT=$(git rev-list --count main)

# Create a zip archive
zip -r "vibe-strike_v${COMMIT_COUNT}.zip" \
    assets/ \
    js/ \
    index.html

echo "Created vibe-strike_v${COMMIT_COUNT}.zip" 