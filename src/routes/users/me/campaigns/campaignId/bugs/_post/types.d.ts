export type RequestParams =
  StoplightOperations["post-users-me-campaigns-campaign-bugs"]["parameters"]["path"];
export type Bug =
  StoplightOperations["post-users-me-campaigns-campaign-bugs"]["responses"]["200"]["content"]["application/json"];
export type CreateBugError =
  StoplightOperations["post-users-me-campaigns-campaign-bugs"]["responses"]["404"]["content"]["application/json"];
export type Severity = { id: number; name: Bug["severity"] };
export type Replicability = { id: number; name: Bug["replicability"] };
export type BugType = { id: number; name: Bug["type"] };
export type Usecase = { id: number; title: string };
export type BugMedia = { url: string; type: string }[] | undefined;
export type Media =
  StoplightOperations["post-users-me-campaigns-campaign-bugs"]["responses"]["200"]["content"]["application/json"]["media"];
export type UserDevice =
  StoplightOperations["post-users-me-campaigns-campaign-bugs"]["responses"]["200"]["content"]["application/json"]["device"];
export type UserAdditionals =
  StoplightOperations["post-users-me-campaigns-campaign-bugs"]["responses"]["200"]["content"]["application/json"]["additional"];
export type CampaignAdditional = {
  id: number;
  slug: string;
  type: string;
  validation: string;
};
export type CreateAdditionals = { id: number; value: string }[] | undefined;
