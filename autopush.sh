#!/bin/bash
# FutureFace Auto-Push — runs when Claude triggers it
cd /Users/ahmedebeid/Documents/futureface-app
git pull origin main --rebase 2>/dev/null || true
git push origin main
rm -f .push_trigger
echo "✓ Pushed to GitHub at $(date)" >> /tmp/futureface-push.log
