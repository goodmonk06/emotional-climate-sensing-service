# Contributing to Emotional Climate Sensing Service

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Install dependencies: `pnpm install`
4. Set up your environment: `./scripts/setup.sh`
5. Create a feature branch: `git checkout -b feature/your-feature-name`

## Development Workflow

### Running Tests

```bash
pnpm test
```

### Linting

```bash
pnpm lint
```

### Building

```bash
pnpm build
```

## Code Style

- Use TypeScript strict mode
- Follow existing code patterns
- Add JSDoc comments for public APIs
- Keep functions small and focused

## Commit Messages

Use clear, descriptive commit messages:

- `feat: add new emotion analyzer for sentiment analysis`
- `fix: resolve issue with climate snapshot calculation`
- `docs: update API documentation`
- `refactor: improve signal ingestion service`

## Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Ensure all tests pass
4. Update the CHANGELOG if applicable
5. Submit PR with clear description

## Architecture Guidelines

### Adding New Analyzers

Implement the `IEmotionAnalyzer` interface in `apps/api/src/adapters/`.

### Adding New API Endpoints

1. Create route handler in `apps/api/src/routes/`
2. Add service logic in `apps/api/src/services/`
3. Update API documentation in README

### Database Changes

1. Modify `apps/api/prisma/schema.prisma`
2. Generate migration: `pnpm db:migrate`
3. Update seed script if needed

## Questions?

Open an issue for discussion before starting major changes.
