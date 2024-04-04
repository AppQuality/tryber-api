/** OPENAPI-CLASS: post-dossiers */

import AdminRoute from "@src/features/routes/AdminRoute";

export default class RouteItem extends AdminRoute<{
  response: StoplightOperations["post-dossiers"]["responses"]["201"]["content"]["application/json"];
  request: StoplightOperations["post-dossiers"]["requestBody"]["content"]["application/json"];
}> {
  protected async filter() {
    if (!(await super.filter())) return false;
    return true;
  }
  protected async prepare(): Promise<void> {
    this.setSuccess(201, {
      id: 1,
    });
  }
}
