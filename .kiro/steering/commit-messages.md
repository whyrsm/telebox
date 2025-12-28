# Conventional Commits

## Rule
Use conventional commit format for all commit messages.

## Important
**Never create commits automatically.** Always wait for explicit user approval before running any `git commit` command. When work is complete, suggest a commit message but do not execute the commit without permission.

## Format
```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

## Types
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style (formatting, semicolons, etc.)
- `refactor:` - Code refactoring (no feature/fix)
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks (deps, configs, etc.)
- `perf:` - Performance improvements
- `ci:` - CI/CD changes

## Examples
```
feat(auth): add Telegram login support
fix(files): resolve upload timeout issue
docs(readme): update installation steps
chore(deps): upgrade NestJS to v10
```

## Tips
- Keep subject line under 50 characters
- Use imperative mood ("add" not "added")
- Don't end subject with period
