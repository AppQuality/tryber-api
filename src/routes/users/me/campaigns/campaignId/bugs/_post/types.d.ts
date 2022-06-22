type RequestParams =
  StoplightOperations["post-users-me-campaigns-campaign-bugs"]["parameters"]["path"];
type Bug =
  StoplightOperations["post-users-me-campaigns-campaign-bugs"]["responses"]["200"]["content"]["application/json"];
type CreateBugError =
  StoplightOperations["post-users-me-campaigns-campaign-bugs"]["responses"]["404"]["content"]["application/json"];
type Severity = { id: number; name: Bug["severity"] };
type Replicability = { id: number; name: Bug["replicability"] };
type BugType = { id: number; name: Bug["type"] };
