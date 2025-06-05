## 1. Introduction/Overview

The project currently has several deprecated classes in `src/features/db/class` that are still being used by parts of the codebase. The goal is to replace these classes with the Knex-based implementation provided by `tryber` in `src/features/database.ts`. The replacement should be one-to-one with no API changes and no behavioral regressions.

## 2. Goals

- Remove all dependencies on code in `src/features/db/class`.
- Migrate all database queries to use the `tryber` Knex instance from `src/features/database.ts`.
- Ensure the test suite passes after migration.

## 3. User Stories

1. **As a developer**, I want the database access layer to use a single Knex-based implementation so that the codebase is easier to maintain.
2. **As a developer**, I need the migration to avoid any API or behavior changes so that existing integrations continue to work.

## 4. Functional Requirements

1. Identify all modules and endpoints that import or instantiate classes from `src/features/db/class`.
2. Refactor these modules to use Knex queries via `src/features/database.ts` instead.
3. Ensure that all database interactions preserve existing data structures and behavior.
4. Update or create tests where needed so the entire test suite passes.

## 5. Non-Goals (Out of Scope)

- Changing API endpoints or response formats.
- Adding new features unrelated to database access.
- Modifying database schemas or introducing migrations.

## 6. Design Considerations

- Keep code changes localized to maintain readability.
- Favor small, incremental refactors with comprehensive tests.

## 7. Technical Considerations

- `@appquality/tryber-database` provides the Knex-based connection and should remain up to date.
- Existing environment configuration in `src/features/database.ts` must be reused for all queries.

## 8. Success Metrics

- All previous unit and integration tests pass without modification (unless tests rely on deprecated classes).
- No regressions reported after deployment.

## 9. Open Questions

- Are there modules outside of `src/features` that depend on the deprecated classes?
- Do we need additional logging to monitor for unexpected behavior during migration?

## 10. Referenced PRD-background files

- `.project-management/current-prd/prd-background/feature-specification.md` – states the goal of replacing deprecated classes in `src/features/db/class` with the `tryber` Knex implementation.
