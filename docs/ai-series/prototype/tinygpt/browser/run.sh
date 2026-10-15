#!/usr/bin/env bash
# browser/run.sh <out file> <runs json> [cpu list]: runs the bench page in headless Chromium, pinned to the cpu list.
set -u
root="$(cd "$(dirname "$0")/.." && pwd)"
out="$1"; runs="$2"; cpus="${3:-4}"
rm -f "$out"
node "$root/src/serve.js" "$root" 8765 "$out" & server=$!
url="http://127.0.0.1:8765/browser/bench.html?runs=$(node -e 'console.log(encodeURIComponent(process.argv[1]))' "$runs")"
taskset -c "$cpus" chromium --headless=new --disable-gpu --no-first-run --user-data-dir="$root/out/chrome-profile" "$url" >/dev/null 2>&1 & chrome=$!
for _ in $(seq 1 900); do
  grep -q '^/done' "$out" 2>/dev/null && break
  kill -0 "$server" 2>/dev/null || break
  perl -e 'select(undef,undef,undef,1)'
done
kill "$chrome" "$server" 2>/dev/null
wait 2>/dev/null
cat "$out"
