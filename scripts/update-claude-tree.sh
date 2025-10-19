#!/bin/bash

# Create temporary files
tree_temp=$(mktemp)
output_temp=$(mktemp)

# Generate tree output
tree . -I "node_modules" -I "dist" -I "test-results" -I "playwright-report"   > "$tree_temp"

# Process the CLAUDE.md file
awk '
/<!-- TREE START -->/ {
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
/<!-- TREE END -->/ {
    print $0
    skip = 0
    next
}
!skip { print }
' CLAUDE.md > "$output_temp"

# Replace the original file
mv "$output_temp" CLAUDE.md

# Cleanup
rm -f "$tree_temp"

echo "CLAUDE.md updated with project tree structure"
