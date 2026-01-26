#!/bin/zsh

show_help() {
  echo "Usage: bundle.sh [-push] [-d] [-h]"
  echo ""
  echo "Flags:"
  echo "  -push    Deploy release to balena"
  echo "  -d       Draft mode (no git tag, no auto-deploy)"
  echo "  -h       Show this help message"
  echo ""
  echo "Examples:"
  echo "  bundle.sh              Build only, no deploy"
  echo "  bundle.sh -push        Regular release (prompts for version + note)"
  echo "  bundle.sh -push -d     Draft release (optional note, no git tag)"
  exit 0
}

# Parse command line arguments
PUSH=false
DRAFT=false
while [[ $# -gt 0 ]]; do
  case $1 in
    -push)
      PUSH=true
      shift
      ;;
    -d)
      DRAFT=true
      shift
      ;;
    -h)
      show_help
      ;;
  esac
done

# Get the root directory (one level up from scripts)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

rm -rf "$ROOT_DIR/docker/app/server/dist"
rm -rf "$ROOT_DIR/docker/app/client/dist"
cd "$ROOT_DIR/docker/app/client"
npm run build
cd ../server
npm run tsc

# Copy non-TypeScript files needed at runtime
echo "Copying runtime assets..."

# Copy schema.sql to dist (needed by PrizeDatabase.initializeSchema())
mkdir -p ./dist/server/src/database
cp ./src/database/schema.sql ./dist/server/src/database/schema.sql
echo "✓ Copied schema.sql"

# Copy shared folder (needed by seed-database.js for PrizeTextureKeys)
mkdir -p ./dist/shared
cp -R ../shared/* ./dist/shared/
echo "✓ Copied shared folder"

# Copy print assets (needed by printer for receipt images)
mkdir -p ./dist/server/assets/print
cp -R ./assets/print/* ./dist/server/assets/print/
echo "✓ Copied print assets"

# Copy client build to server public folder
mkdir -p ./dist/server/public
cp -R ../client/dist/* ./dist/server/public

# Copy server public files (admin panel, etc.)
if [ -n "$(ls -A ./public)" ]; then
  cp -R ./public/* ./dist/server/public
fi

echo "✓ Build complete"

# Push to balena if flag is set
if [ "$PUSH" = true ]; then
  cd "$ROOT_DIR"  # Go to root directory for git commands

  # Check for uncommitted changes
  if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes!"
    git status --short
    echo ""
    echo -n "Continue anyway? (y/N): "
    read CONTINUE
    if [ "$CONTINUE" != "y" ] && [ "$CONTINUE" != "Y" ]; then
      echo "Aborted. Please commit your changes first."
      exit 1
    fi
  fi

  cd "$ROOT_DIR/docker"  # Go to docker directory for balena push

  # Show latest tag for reference
  LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "none")
  echo "Latest git tag: $LATEST_TAG"

  if [ "$DRAFT" = true ]; then
    # Draft release - optional note, no git tag
    echo -n "Release note (optional, press Enter to skip): "
    read NOTE

    if [ -n "$NOTE" ]; then
      balena push -m beda/swisslos-win-for-life --draft --note "$NOTE" || exit 1
    else
      balena push -m beda/swisslos-win-for-life --draft || exit 1
    fi
    echo "✓ Draft release pushed"
  else
    # Regular release - require version and note
    echo -n "Version number: "
    read VERSION

    if [ -z "$VERSION" ]; then
      echo "Error: Version required for non-draft releases"
      exit 1
    fi

    echo -n "Release note: "
    read NOTE

    if [ -z "$NOTE" ]; then
      echo "Error: Release note required"
      exit 1
    fi

    # Update version in balena.yml (must be quoted string in semver format)
    sed -i '' "s/^version: .*/version: \"$VERSION\"/" "$ROOT_DIR/docker/balena.yml"
    echo "✓ Updated balena.yml version to $VERSION"

    # Commit the version bump
    git add "$ROOT_DIR/docker/balena.yml"
    git commit -m "chore: bump version to $VERSION"
    echo "✓ Committed version bump"

    # Push to balena first (before creating git tag)
    balena push -m beda/swisslos-win-for-life --release-tag version "$VERSION" --note "$NOTE" || exit 1
    echo "✓ Pushed release $VERSION to beda/swisslos-win-for-life"

    # Create git tag only after successful deploy
    git tag -a "$VERSION" -m "$NOTE"
    echo "✓ Created git tag: $VERSION"
  fi
fi