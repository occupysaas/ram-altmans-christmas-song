#!/usr/bin/env bash
# Run the Codex still briefs, 3 sections at a time, with the cast sheets attached as references.
set -uo pipefail
cd "$(dirname "$0")/.."
imgs=(); for c in ram sam girl elves reindeer townsfolk; do imgs+=(-i "public/cast/$c.png"); done
run() { codex exec --skip-git-repo-check -s workspace-write -C . "${imgs[@]}" - < "$1" > "${1%.md}.log" 2>&1; echo "$1 exit $?"; }
export -f run 2>/dev/null
pids=(); n=0
for f in "${@:-docs/codex/02-stills-*.md}"; do
  run "$f" & pids+=($!); n=$((n+1))
  if (( n % 3 == 0 )); then wait "${pids[@]}"; pids=(); fi
done
wait
ls public/stills | wc -l
