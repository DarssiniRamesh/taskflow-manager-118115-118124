#!/bin/bash
cd /home/kavia/workspace/code-generation/taskflow-manager-118115-118124/task_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

