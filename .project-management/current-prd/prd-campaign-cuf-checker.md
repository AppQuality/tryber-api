## 1. Introduction/Overview

The tester dashboard currently lists available campaigns under `users/me/campaigns`. The visibility checker does not yet validate Custom User Field (CUF) rules associated with each campaign. The goal of this feature is to extend the screening logic so that campaigns are displayed only when the tester meets the dossier-defined CUF requirements.

## 2. Goals

- Enforce CUF-based visibility rules when listing campaigns for testers.
- Ignore CUF rules referencing non-existent fields to avoid blocking visibility unnecessarily.

## 3. User Stories

- **As a tester**, I want to see only the campaigns for which I meet all CUF requirements so that irrelevant campaigns do not appear in my list.
- **As a tester**, if a CUF required by a campaign does not exist for me, that rule should be ignored so I can still view other eligible campaigns.

## 4. Functional Requirements

1. Retrieve CUF rules from the campaign dossier. Each rule consists of a CUF identifier and required value.
2. For each campaign in `users/me/campaigns`, verify that the tester has the CUF with the specified value.
3. If a tester lacks the CUF or its value differs, hide the campaign from the list.
4. If a CUF referenced in the rules does not exist in the system, skip that rule without affecting visibility.

## 5. Non-Goals (Out of Scope)

- Modifying existing CUF creation or management screens.
- Implementing any new UI designs beyond campaign visibility logic.

## 6. Design Considerations (Optional)

- Follow existing UI patterns in the tester dashboard. There is no dedicated mockup beyond the placeholder provided in `prd-background/design-mock.html`.

## 7. Technical Considerations (Optional)

- CUF definitions and tester data are stored in `@appquality/tryber-database`.
- Ensure the checker efficiently queries CUF values to minimize performance impact on campaign listing.

## 8. Success Metrics

- Campaigns with CUF rules are visible only to testers meeting those rules.
- No new errors are introduced when CUF references are missing.

## 9. Open Questions

- Should partial matches (e.g., testers with additional CUF values) be treated differently, or is an exact match sufficient?
- Are there future plans to surface to the tester why a campaign is hidden due to CUF rules?

## 10. Referenced PRD-background files

- `.project-management/current-prd/prd-background/feature-specification.md` – initial feature request.
- `.project-management/current-prd/prd-background/design-mock.html` – placeholder design reference.
