#!/bin/bash

# Create temporary files
tree_temp=$(mktemp)
output_temp=$(mktemp)

# Generate tree output
tree . -I "node_modules" -I "dist" -I "test-results" -I "playwright-report" --matchdirs -I "*archive*"  > "$tree_temp"

# Process the AGENTS.md file
awk '
/<!-- MANUAL ADDITIONS START -->/ {
    print $0
    print "```"
    while ((getline line < "'$tree_temp'") > 0) {
        print line
    }
    close("'$tree_temp'")
    print "```"
    skip = 1
    next
}
!skip { print }
' AGENTS.md > "$output_temp"

# Replace the original file
mv "$output_temp" AGENTS.md

# Cleanup
rm -f "$tree_temp"

echo "AGENTS.md updated with project tree structure"