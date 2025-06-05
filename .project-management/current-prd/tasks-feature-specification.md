## Pre-Feature Development Project Tree

```
./test-codex.sh
./yarn.lock
./docker-compose.yml
./getTestList.sh
./tsconfig.json
./jest.config.js
./src/types.d.ts
./src/config.ts
./src/avatar-initials.d.ts
./src/constants.ts
./src/parse-comments.d.ts
./src/index.ts
./src/@appquality-wp-auth.d.ts
./src/php-unserialize.d.ts
./src/schema.ts
./src/app.ts
./AGENTS.md
./node_modules/.yarn-state.yml
./Dockerfile
./deployment/appspec.yml
```

## Relevant Files

- `src/routes/users/me/campaigns/_get/index.ts`
- `src/routes/users/me/campaigns/_get/UserTargetChecker.ts`
- `src/routes/users/me/campaigns/_get/target.spec.ts`

### Proposed New Files

- `src/features/campaignCufRules.ts` - Access campaign-specific CUF rule records.
- `src/routes/users/me/campaigns/_get/__tests__/cuf-target.spec.ts` - Tests for CUF rule scenarios.

### Existing Files Modified

- `src/routes/users/me/campaigns/_get/index.ts` - Include CUF rules when fetching campaigns.
- `src/routes/users/me/campaigns/_get/UserTargetChecker.ts` - Evaluate CUF rules in `inTarget` method.
- `src/features/database.ts` - Provide CUF rule data via SQL queries.
- `CHANGELOG.md` - Document changes.

### Notes

- Ensure existing language and country checks remain intact when adding CUF logic.
- Maintain current test coverage by updating related fixtures in `target.spec.ts`.

## Tasks

- [ ] 1.0 Add query module for campaign CUF rules using `tryber.tables`.
- [ ] 2.0 Retrieve CUF rules in campaign listing using `database.ts`.
- [ ] 3.0 Update `UserTargetChecker` to load tester CUF values and compare with rules.
- [ ] 4.0 Modify campaign listing route to filter campaigns by CUF eligibility.
- [ ] 5.0 Write unit tests for CUF rule visibility cases.
- [ ] 6.0 Update documentation and changelog.
