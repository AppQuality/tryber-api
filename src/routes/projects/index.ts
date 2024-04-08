/** OPENAPI-CLASS: get-projects */

import { tryber } from "@src/features/database";
import AdminRoute from "@src/features/routes/AdminRoute";

interface GetProjectsInterface {
  response: StoplightOperations["get-projects"]["responses"]["200"]["content"]["application/json"];
}

export default class GetProjects extends AdminRoute<GetProjectsInterface> {
  protected async prepare() {
    const projects = await tryber.tables.WpAppqProject.do().select(
      tryber.ref("display_name").withSchema("wp_appq_project").as("name"),
      "id"
    );
    this.setSuccess(200, { results: projects });
  }
}
