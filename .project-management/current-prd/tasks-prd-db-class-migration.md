## Pre-Feature Development Project Tree

```
.
deployment
keys
src
src/__mocks__
src/features
src/middleware
src/reference
src/routes
features
features/OpenapiError
features/__mocks__
features/busboyMapper
features/checkUrl
features/class
features/db
features/debugMessage
features/deleteFromS3
features/escapeCharacters
features/getMimetypeFromS3
features/jotform
features/leaderboard
features/mail
features/paypal
features/routes
features/s3
features/sentry
features/sqlite
features/tranferwise
features/upload
features/webhookTrigger
features/wp
```

## Relevant Files

- `src/features/db/class/*` - Deprecated database classes to be replaced
- `src/features/database.ts` - Knex connection instance (`tryber`)
- Various modules under `src/` importing from `src/features/db/class`

### Proposed New Files

- _None at this stage_

### Existing Files Modified

- Modules in `src/features` and `src/routes` that rely on deprecated classes
- Test files associated with the above modules

### Notes

- Keep `@appquality/tryber-database` updated in `package.json`
- Ensure no API or behavior changes during migration

## Tasks

- [ ] 1.0 Inventory current usage of classes from `src/features/db/class`
- [ ] 2.0 Refactor identified modules to use `tryber` queries via `src/features/database.ts`
- [ ] 3.0 Update or create tests to cover the refactored code
- [ ] 4.0 Remove deprecated classes once all references are migrated
- [ ] 5.0 Run full test suite and verify no regressions
