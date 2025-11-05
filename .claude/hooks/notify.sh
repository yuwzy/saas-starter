#!/bin/bash

# 標準入力からJSONを読み取る
INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id')

# デスクトップ通知を送信
osascript -e 'display notification "Claude Code has completed the task!" with title "Claude Code" sound name "Glass"'

# 完了をログに記録
echo "[$(date)] Task completed - Session: $SESSION_ID" >> .claude/logs/task-completion.log

exit 0
