# Maintainable Code Best Practices

## Rule
All code must be written with maintainability as a primary concern. Code is read far more often than it is written.

## Core Principles

### 1. Single Responsibility
- Each function/method should do one thing well
- Each class/module should have one reason to change
- Keep files focused — split when they exceed ~200-300 lines

### 2. Meaningful Naming
- Use descriptive, intention-revealing names
- Avoid abbreviations unless universally understood (e.g., `id`, `url`)
- Name booleans as questions: `isLoading`, `hasPermission`, `canEdit`
- Name functions as actions: `fetchUser`, `calculateTotal`, `validateInput`

### 3. Keep Functions Small
- Functions should be 20-30 lines max
- If you need comments to explain sections, extract to named functions
- Limit function parameters to 3-4; use objects for more

### 4. DRY (Don't Repeat Yourself)
- Extract repeated logic into reusable functions/utilities
- Use constants for magic numbers and strings
- Create shared types/interfaces for common data structures

### 5. Avoid Deep Nesting
- Maximum 2-3 levels of nesting
- Use early returns to reduce nesting
- Extract complex conditions into named variables or functions

## Code Organization

### File Structure
- Group related functionality together
- Separate concerns: API calls, business logic, UI components
- Use barrel exports (index.ts) for cleaner imports

### Dependencies
- Minimize coupling between modules
- Use dependency injection where appropriate
- Prefer composition over inheritance

## Documentation

### When to Comment
- Explain "why", not "what" — code should be self-documenting
- Document complex algorithms or business rules
- Add JSDoc for public APIs and exported functions

### Required Documentation
- README for each major module/feature
- API endpoints should have clear request/response documentation
- Environment variables must be documented in `.env.example`

## Error Handling

### Best Practices
- Handle errors at appropriate levels
- Provide meaningful error messages
- Never swallow errors silently
- Use custom error types for domain-specific errors

```typescript
// Bad
try { await fetchData(); } catch (e) { console.log(e); }

// Good
try {
  await fetchData();
} catch (error) {
  logger.error('Failed to fetch user data', { userId, error });
  throw new DataFetchError('Unable to load user data');
}
```

## TypeScript Specific

### Type Safety
- Avoid `any` — use `unknown` if type is truly unknown
- Define explicit return types for public functions
- Use strict mode (`strict: true` in tsconfig)
- Prefer interfaces for object shapes, types for unions/primitives

### Null Safety
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Avoid non-null assertions (`!`) unless absolutely certain
- Handle undefined/null cases explicitly

## Code Review Checklist

Before submitting code, verify:
- [ ] Functions are small and focused
- [ ] Names are clear and descriptive
- [ ] No code duplication
- [ ] Error cases are handled
- [ ] Types are properly defined (no `any`)
- [ ] Complex logic is documented
- [ ] No hardcoded values (use constants/config)

## Anti-Patterns to Avoid

- God classes/functions that do everything
- Premature optimization
- Over-engineering simple solutions
- Commented-out code (delete it, git has history)
- Console.log statements in production code
- Ignoring TypeScript/ESLint warnings
