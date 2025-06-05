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
- `.project-management/current-prd/tasks-prd-db-class-migration.md` - Task list for DB class migration

### Proposed New Files

- _None at this stage_

### Existing Files Modified

- `src/routes/campaigns/forms/_get/index.ts` - migrated to use `tryber` instead of db class
- `src/routes/campaigns/campaignId/forms/_get/index.ts` - migrated to use `tryber`
- `src/routes/users/me/campaigns/campaignId/compatible_devices/_get/index.ts` - migrated to use `tryber`
- Modules in `src/features` and `src/routes` that rely on deprecated classes
- Test files associated with the above modules

### Notes

- Keep `@appquality/tryber-database` updated in `package.json`
- Ensure no API or behavior changes during migration

## Tasks

- [x] 1.0 Inventory current usage of classes from `src/features/db/class`
- [ ] 2.0 Refactor identified modules to use `tryber` queries via `src/features/database.ts`
- [x] 2.1 Refactor `src/routes/campaigns/forms/_get/index.ts` to use `tryber`
- [x] 2.2 Refactor `src/routes/campaigns/campaignId/forms/_get/index.ts` to use `tryber`
- [x] 2.3 Refactor `src/routes/users/me/campaigns/campaignId/compatible_devices/_get/index.ts` to use `tryber`
- [ ] 3.0 Update or create tests to cover the refactored code
- [x] 3.1 Update tests for `src/routes/campaigns/campaignId/forms/_get/index.ts`
- [ ] 4.0 Remove deprecated classes once all references are migrated
- [ ] 5.0 Run full test suite and verify no regressions

### Task 1.0 Inventory Results

- `src/routes/campaigns/forms/_get/index.ts`
- `src/routes/campaigns/campaignId/forms/_get/index.ts`
- `src/routes/campaigns/campaignId/candidates/_post/index.ts`
- `src/routes/users/me/campaigns/campaignId/compatible_devices/_get/index.ts`
- `src/routes/users/me/campaigns/campaignId/forms/_get/index.ts`
- `src/routes/users/me/campaigns/campaignId/forms/_post/index.ts`
- `src/routes/users/me/campaigns/campaignId/forms/QuestionFactory/index.ts`
- `src/routes/users/me/campaigns/campaignId/forms/QuestionFactory/Questions/index.ts`
- `src/routes/users/me/campaigns/campaignId/forms/QuestionFactory/Questions/AddressQuestion.ts`
- `src/routes/users/me/campaigns/campaignId/forms/QuestionFactory/Questions/CufMultiSelectQuestion.ts`
- `src/routes/users/me/campaigns/campaignId/forms/QuestionFactory/Questions/CufSelectableQuestion.ts`
- `src/routes/users/me/campaigns/campaignId/forms/QuestionFactory/Questions/CufTextQuestion.ts`
- `src/routes/users/me/campaigns/campaignId/forms/QuestionFactory/Questions/GenderQuestion.ts`
- `src/routes/users/me/campaigns/campaignId/forms/QuestionFactory/Questions/PhoneQuestion.ts`
- `src/routes/users/me/campaigns/campaignId/forms/QuestionFactory/Questions/SelectableQuestion.ts`
- `src/routes/users/me/campaigns/campaignId/forms/QuestionFactory/Questions/SimpleTextQuestion.ts`
