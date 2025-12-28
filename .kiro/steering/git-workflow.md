# Git Branch Workflow

## Rule
Before starting any new feature, improvement, or bug fix, always create a dedicated branch from an up-to-date `development` branch.

## Branch Structure
- `main` - Production-ready code. Only receives merges from `development`.
- `development` - Integration branch. All feature/fix branches merge here first.
- Feature branches - Short-lived branches for specific work.

## Branch Naming Convention
- `feature/` - for new features (e.g., `feature/add-file-upload`)
- `fix/` - for bug fixes (e.g., `fix/login-redirect-issue`)
- `improve/` - for improvements (e.g., `improve/file-service-performance`)
- `refactor/` - for code refactoring (e.g., `refactor/drive-store`)

## Workflow
1. Switch to development and pull latest: `git checkout development && git pull origin development`
2. Create feature branch: `git checkout -b feature/your-feature-name`
3. Make commits with clear messages
4. When work is complete, merge into development: `git checkout development && git merge feature/your-feature-name`
5. Push development: `git push origin development`
6. Delete the feature branch: `git branch -d feature/your-feature-name`

## Agent Behavior
- After completing work on a feature/fix branch, the agent should merge it into `development`
- The agent should NOT merge anything into `main` — that's reserved for user-controlled releases

## Important
- Never commit directly to `main` or `development` branches
- Only `development` can be merged into `main`
- Keep branches focused on a single feature/fix
- Delete branches after merging
