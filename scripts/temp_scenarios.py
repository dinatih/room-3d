"""Reusable validation entrypoint for the scenario refactor; keep this file in place."""
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parent.parent
commands = [
    ['npx', 'tsc', '--noEmit'],
    ['npm', 'run', 'build'],
    ['node', 'scripts/check-duo-xbot.cjs'],
    ['node', 'scripts/temp_kitchen_navigation_check.cjs', '--browser', '--scenarios-only'],
]
for command in commands:
    subprocess.run(command, cwd=root, check=True)
