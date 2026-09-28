#!/bin/bash
# usage: ./record-all.sh ru|kz [flow...]
cd "$(dirname "$0")"
lang=$1; shift
flows=${@:-lead measure payment whereorder client morning staff}
node seed-aishtory.mjs >/dev/null 2>&1 || { echo "seed failed"; exit 1; }
for f in $flows; do
  if node record.mjs $f $lang > /tmp/rec-$f-$lang.log 2>&1; then echo "ok   $f-$lang $(tail -1 /tmp/rec-$f-$lang.log | grep -o 'frames [0-9]*')"; else echo "FAIL $f-$lang: $(grep -m1 -E 'Error|error' /tmp/rec-$f-$lang.log | cut -c1-160)"; fi
done
