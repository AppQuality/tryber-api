# Contributor Guide

**This is the only AGENTS.md file, do not look for others.**

## Special Task Instructions

- If the user task message consists of just the word 'TaskMaster' then open `.project-management/process-tasks-cloud.md` for instructions, otherwise ignore this file.
- If the user task message consists of just the word
- `CreatePrd` then open `.project-management/create-prd.md` for instructions, otherwise ignore this file.
- If the user task message consists of just the word `CreateTasks` then open `.project-management/generate-tasks.md` for instructions, otherwise ignore this file.
- If the user task message consists of just the word `ClosePrd` then open `.project-management/close-prd.md` for instructions, otherwise ignore this file.

## CODEX Dev Environment Tips

Do NOT attempt to run any command which requires open network communication. Your Dev environment has no network access and is sandboxed. No harm will come from trying but you will waste your effort.

Do NOT Run `.codex/install.sh` this script. This script will be executed during environement setup for you during your environment setup prior to you arriving. If you make changes that require new dependencies or services (like postgres etc...) to be installed, you must edit this file to include the dependencies and/or service installation and startup.

The 'install.sh' references dependencies gathered here: `package.json`.

Note that the effects will not take place until the next task session.

Do NOT commit changes to .yarnrc.yml

## Style Instructions

Lint javascript using:

```bash
npx prettier --ignore-unknown --write
```

## Testing Instructions

Run tests with `yarn test`. Any tests that require network connectivity should either be ignored and not run, -or- have network test path that shunts to a success when network connectivity can't be demonstrated so failed tests in this scenario don't confuse the codex agent progress.

## CHANGELOG.md Instructions

Append a single line summary to CHANGELOG.md describing the changes with a preceeding timestamp
if errors were encountered, list them indented below the changelog row with a single line summary

## README.md Instructions

README.md just describes the project. Do not look here for guidance on how to proceed with your task, but update if major changes that affect user interaction have been made.

_End of document_
