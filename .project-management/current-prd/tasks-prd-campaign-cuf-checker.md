## Pre-Feature Development Project Tree

```bash
.
├── AGENTS.md
├── CHANGELOG.md
├── Dockerfile
├── Makefile
├── README.md
├── deployment
│   ├── after-install.sh
│   └── appspec.yml
├── docker-compose.yml
├── extract_tests.ts
├── getTestList.sh
├── jest.config.js
├── keys
├── package.json
├── src
│   ├── @appquality-wp-auth.d.ts
│   ├── __mocks__
│   ├── app.ts
│   ├── avatar-initials.d.ts
│   ├── config.ts
│   ├── constants.ts
│   ├── features
│   ├── index.ts
│   ├── middleware
│   ├── parse-comments.d.ts
│   ├── php-unserialize.d.ts
│   ├── reference
│   ├── routes
│   ├── schema.ts
│   └── types.d.ts
├── test-codex.sh
├── tsconfig.json
└── yarn.lock
```

## Relevant Files

- `src/routes/users/me/campaigns/_get/index.ts` - Endpoint for listing campaigns
- `src/features/db/class/Campaigns.ts` - Database class for campaign logic
- `src/features/db/class/CustomUserFieldData.ts` - Access tester CUF values

### Proposed New Files

- `src/routes/users/me/campaigns/_get/cuf.spec.ts` - Unit tests for CUF-based visibility

### Existing Files Modified

- `src/routes/users/me/campaigns/_get/index.ts` - Filter campaigns by CUF rules
- `src/features/db/class/Campaigns.ts` - Retrieve CUF rules from dossier
- `src/reference/openapi.yml` - Document CUF visibility behavior

### Notes

- Unit tests live beside their implementation files.
- Update `CHANGELOG.md` with a summary line of the feature addition.
- Consider performance when querying CUF values from `@appquality/tryber-database`.

## Tasks

- [ ] 1.0 Retrieve CUF rules from the dossier
  - [ ] 1.1 Extend `Campaigns.getTargetRules` to query `campaign_dossier_data_cuf`
  - [ ] 1.2 Map each rule to `{cuf_id, cuf_value_id}`
- [ ] 2.0 Enforce CUF rules in campaign listing
  - [ ] 2.1 Fetch tester CUF values using `CustomUserFieldData`
  - [ ] 2.2 Skip rules referencing missing CUFs
  - [ ] 2.3 Filter campaigns when tester values do not match
- [ ] 3.0 Add tests for CUF visibility logic
  - [ ] 3.1 Create `cuf.spec.ts` covering rule match, mismatch, and missing field cases
- [ ] 4.0 Update documentation
  - [ ] 4.1 Describe CUF filtering in `openapi.yml`
  - [ ] 4.2 Add changelog entry
_End of document_
