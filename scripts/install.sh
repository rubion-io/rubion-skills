#!/usr/bin/env bash
# Rubion Skills - Global Installer (Linux / macOS)
#
# Links every skill under adapted/* and skills/* into the global skill
# folders for Claude Code and/or Cursor using SYMLINKS. When you pull
# updates in this repo, the global paths reflect them automatically.
#
# Usage:
#   ./scripts/install.sh                 -> install for both targets
#   ./scripts/install.sh --target=claude -> Claude Code only
#   ./scripts/install.sh --target=cursor -> Cursor only
#   ./scripts/install.sh --force         -> overwrite existing links/folders
#   ./scripts/install.sh --uninstall     -> remove all Rubion skill symlinks

set -euo pipefail

TARGET="both"
FORCE=false
UNINSTALL=false

for arg in "$@"; do
    case "$arg" in
        --target=claude) TARGET="claude" ;;
        --target=cursor) TARGET="cursor" ;;
        --target=both)   TARGET="both" ;;
        --force)         FORCE=true ;;
        --uninstall)     UNINSTALL=true ;;
        -h|--help)
            sed -n '2,15p' "$0"
            exit 0
            ;;
        *)
            echo "Unknown argument: $arg"
            exit 1
            ;;
    esac
done

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLAUDE_DIR="$HOME/.claude/skills"
CURSOR_DIR="$HOME/.cursor/skills-cursor"

list_sources() {
    [ -d "$REPO_ROOT/adapted" ] && find "$REPO_ROOT/adapted" -mindepth 1 -maxdepth 1 -type d
    [ -d "$REPO_ROOT/skills"  ] && find "$REPO_ROOT/skills"  -mindepth 1 -maxdepth 1 -type d
}

install_skills() {
    local target_dir="$1"
    local label="$2"

    mkdir -p "$target_dir"
    echo
    echo "[$label] $target_dir"

    local linked=0
    local skipped=0

    while IFS= read -r src; do
        [ -z "$src" ] && continue
        local name
        name="$(basename "$src")"
        local dest="$target_dir/$name"

        if [ -e "$dest" ] || [ -L "$dest" ]; then
            if [ "$FORCE" = true ]; then
                rm -rf "$dest"
            else
                echo "  [SKIP] $name (already exists; use --force to overwrite)"
                skipped=$((skipped + 1))
                continue
            fi
        fi

        ln -s "$src" "$dest"
        echo "  [OK]   $name"
        linked=$((linked + 1))
    done < <(list_sources)

    echo "  Linked: $linked, skipped: $skipped"
}

uninstall_skills() {
    local target_dir="$1"
    local label="$2"

    if [ ! -d "$target_dir" ]; then
        echo "[$label] Folder does not exist, skipping: $target_dir"
        return
    fi

    echo
    echo "[$label] $target_dir"

    local removed=0

    while IFS= read -r src; do
        [ -z "$src" ] && continue
        local name
        name="$(basename "$src")"
        local dest="$target_dir/$name"

        if [ ! -L "$dest" ]; then
            [ -e "$dest" ] && echo "  [SKIP] $name (not a symlink, leaving untouched)"
            continue
        fi

        rm "$dest"
        echo "  [DEL]  $name"
        removed=$((removed + 1))
    done < <(list_sources)

    echo "  Removed: $removed"
}

# Run

if [ "$UNINSTALL" = true ]; then
    echo "Rubion Skills - Uninstall"
    [[ "$TARGET" == "claude" || "$TARGET" == "both" ]] && uninstall_skills "$CLAUDE_DIR" "Claude"
    [[ "$TARGET" == "cursor" || "$TARGET" == "both" ]] && uninstall_skills "$CURSOR_DIR" "Cursor"
    echo
    echo "Done."
    exit 0
fi

echo "Rubion Skills - Install"
echo "Source: $REPO_ROOT"
echo "Target: $TARGET"

[[ "$TARGET" == "claude" || "$TARGET" == "both" ]] && install_skills "$CLAUDE_DIR" "Claude"
[[ "$TARGET" == "cursor" || "$TARGET" == "both" ]] && install_skills "$CURSOR_DIR" "Cursor"

echo
echo "Done. Updates to this repo will reflect in the global paths via the symlinks."
