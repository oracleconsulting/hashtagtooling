#!/usr/bin/env bash
# Syncs live Hashtag Tooling app files into hashtagtooling-analysis as FLAT copies (no subfolders).
# Run from repo root: ./scripts/sync-hashtagtooling-analysis-copies.sh
# Do not edit files in hashtagtooling-analysis during live work; re-run this script to refresh.

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/hashtagtooling-analysis"
rm -rf "$DEST" && mkdir -p "$DEST"

echo "Syncing live Hashtag Tooling files -> hashtagtooling-analysis (flat)..."

# Flatten a directory: copy each file to DEST with path segments joined by hyphen
flatten_dir() {
  local dir="$1"
  [ ! -d "$ROOT/$dir" ] && return
  find "$ROOT/$dir" -type f ! -path '*node_modules*' ! -path '*.next*' ! -path '*.git*' 2>/dev/null | while read -r f; do
    rel="${f#$ROOT/$dir/}"
    base=$(echo "$rel" | tr '/' '-')
    cp "$f" "$DEST/$dir-$base" && echo "  $dir-$base"
  done
}

flatten_dir app
flatten_dir components
flatten_dir lib
flatten_dir public

# Root config and docs (flat in DEST)
for f in *.sql *.md package.json package-lock.json next.config.js next.config.ts tsconfig.json next-env.d.ts tailwind.config.ts postcss.config.js postcss.config.mjs eslint.config.mjs .gitignore setup.sh railway-deploy.sh PROJECT_STRUCTURE.txt; do
  if [ -f "$ROOT/$f" ]; then
    cp "$ROOT/$f" "$DEST/"
    echo "  $f"
  fi
done

# Analysis readme (do not overwrite with root README)
cat > "$DEST/README_ANALYSIS.md" << 'EOF'
# Hashtag Tooling — Analysis Copy (flat)

This folder is a **read-only flat copy** of the Hashtag Tooling application source for use in a separate Claude project for assessment and analysis.

- **Do not edit** these files when doing live work on the codebase.
- Make all changes in the **live** paths at the repo root (e.g. `app/`, `components/`, `lib/`).
- To refresh this copy after live changes, run from the repo root:
  **`./scripts/sync-hashtagtooling-analysis-copies.sh`**

File names are flattened: e.g. `app/page.tsx` -> `app-page.tsx`, `app/cart/page.tsx` -> `app-cart-page.tsx`, `components/Header.tsx` -> `components-Header.tsx`.
EOF
echo "  README_ANALYSIS.md"

echo "Done. hashtagtooling-analysis is flat and up to date. Do not edit that folder during live work."
