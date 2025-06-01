#!/bin/bash

# Ensure we're in the right repo
REPO="manager-max"
if [[ $(basename "$PWD") != "$REPO" ]]; then
  echo "❌ Run this from inside the $REPO directory."
  exit 1
fi

# Create necessary folders
mkdir -p .github/workflows
mkdir -p .github/manager-max

# Add Manager Max script
cat <<'EOF' > .github/manager-max/index.js
<PASTE_YOUR_SCRIPT_HERE>
EOF

# Init Node.js and install dependencies
cd .github/manager-max
npm init -y
npm install @actions/github @actions/core
cd ../../..

# Add workflow YAML
cat <<'EOF' > .github/workflows/manager-max.yml
<PASTE_YOUR_WORKFLOW_YAML_HERE>
EOF

# Git add and commit
git add .
git commit -m "Scaffold Manager Max GitHub Action"
git push origin main
