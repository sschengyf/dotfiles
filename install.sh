#!/usr/bin/env bash
# Link this repo's coding-agent config into ~/.claude so it applies to every project.
# Safe to re-run: existing links are refreshed, real files are never overwritten.
set -euo pipefail

dotfiles="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
claude_dir="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"

link() {
  local src="$1" dest="$2"
  if [[ -e "$dest" && ! -L "$dest" ]]; then
    echo "skip   $dest (exists and is not a symlink)"
    return
  fi
  ln -sfn "$src" "$dest"
  echo "link   $dest -> $src"
}

mkdir -p "$claude_dir/skills" "$claude_dir/agents"

for skill in "$dotfiles"/skills/*/; do
  skill="${skill%/}"
  link "$skill" "$claude_dir/skills/$(basename "$skill")"
done

for agent in "$dotfiles"/agents/*.md; do
  [[ -e "$agent" ]] || continue
  link "$agent" "$claude_dir/agents/$(basename "$agent")"
done

import_line="@$dotfiles/CODING-AGENTS.md"
claude_md="$claude_dir/CLAUDE.md"
if [[ ! -e "$claude_md" ]]; then
  printf '# User-level instructions for Claude Code\n\n%s\n' "$import_line" >"$claude_md"
  echo "write  $claude_md"
elif grep -q 'CODING-AGENTS.md' "$claude_md"; then
  echo "ok     $claude_md already imports CODING-AGENTS.md"
else
  echo "manual add this line to $claude_md: $import_line"
fi
