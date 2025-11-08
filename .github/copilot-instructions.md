# Copilot Instructions for Franka Language

## Code Formatting

**ALWAYS** run code formatting checks before committing any changes:

```bash
npm run format:check
```

If formatting issues are found, fix them with:

```bash
npm run format
```

## Development Workflow

1. **Before making changes**: Run tests and check current state
   ```bash
   npm test
   npm run build
   npm run lint
   npm run format:check
   ```

2. **During development**: Make small, incremental changes and validate frequently

3. **Before committing**: Always verify all checks pass
   ```bash
   npm test
   npm run build
   npm run lint
   npm run format:check
   ```

## Code Style

- Use Prettier for code formatting (configured in `.prettierrc.json`)
- Use ESLint for linting (configured in `eslint.config.mjs`)
- Follow TypeScript best practices
- Write comprehensive tests for all new features

## Testing

- All tests must pass before committing
- Add tests for new features
- Update tests when modifying existing features
- Run tests with: `npm test`

## Documentation

- Update README.md for user-facing changes
- Update spec/language.yaml for language specification changes
- Update example files when syntax changes
- Keep examples/README.md synchronized with examples
